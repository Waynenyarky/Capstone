# LOB Recommendation — Trained Model Pipeline

This document covers the trained ML model for the Line of Business (LOB) recommendation feature. The model complements the primary Google Gemini-based recommendation: when configured, the app calls the trained model first and falls back to Gemini on failure.

## Docker: Zero-Config for Other Developers

When you run the app with Docker (`./start.sh` or `./start.sh --dev --web-only`):

- The **lob-model** service starts automatically and is used by the business-service for LOB recommendations.
- **If no model exists** (e.g. fresh clone, or first run), the service **trains automatically** on startup using `ai/datasets/lob_recommendation_dataset.json`, then starts serving. No manual training step is required.
- The business-service is configured with `LOB_MODEL_SERVICE_URL=http://lob-model:5050`, so LOB recommendations use the trained model when available and fall back to Gemini otherwise.

Another developer can clone the repo, run `./start.sh --dev --web-only`, and the LOB AI flow (trained model + Gemini fallback) works without extra setup.

## Architecture Overview

```
Business Owner form
  └─> business-service  POST /api/business/ai/recommend-line-of-business
        ├─ (0) Business description gate  →  Heuristic + Gemini check
        ├─ (1) Try trained model         →  Python service POST /predict  →  recommendations
        └─ (2) Fallback                  →  Google Gemini (few-shot prompt) →  recommendations
```

**Business description gate:** Before recommending LOBs, the service checks whether the input is an actual business description. The heuristic runs first: (1) Vague phrases like "my business", "our company", "a store" are blacklisted and rejected. (2) The input must contain at least two business-related keywords (e.g. "sell" + "food", "restaurant" + "catering"); single-keyword inputs like "negosyo" alone are rejected. When `GEMINI_API_KEY` is set, after the heuristic passes the service also calls Gemini with a yes/no prompt to catch edge cases (e.g. coherent but non-business text, or generic phrases without specifics). If either check rejects the input, the service returns no recommendations and prompts the user to describe what their business sells or does. This prevents the LOB model from classifying gibberish or vague input. When the key is set, the service also requests a short Gemini review (1–2 sentences) of the description; this is returned as `geminiReview` and shown in the UI above the recommendations.

Admin Trainer UI (`/admin/lob-trainer`) lets admins manage training data and retrain the model.

---

## Dataset

**Full dataset:** `ai/datasets/lob_recommendation_dataset.json`

Each entry has a free-text `businessDescription` (English or Filipino) and an array of `recommendations`, each with `taxCode`, `lineOfBusiness`, `detailedLine`, and `psicCode`.

**Preprocessing (flattening):** Entries with multiple recommendations are expanded into separate rows, each with a single label `taxCode|detailedLine` (e.g., `RET|Sari-sari store`). This gives ~165 rows across ~79 classes from the initial dataset.

The dataset is also seeded into the MongoDB `lobtrainingexamples` collection on first startup, so admins can manage it from the UI.

### Train/test split

To get honest evaluation metrics, the dataset is split **once** into fixed files:

| File | Purpose |
|------|---------|
| `ai/datasets/lob_recommendation_train.json` | Used for model training |
| `ai/datasets/lob_recommendation_test.json` | Used only for evaluation (model never sees this during training) |

The split is at the **entry** level (each `businessDescription` + its `recommendations` is one unit), so the same description never appears in both sets.

**Generate or regenerate the split:**

```bash
python3 ai/scripts/split_lob_dataset.py
```

Re-run this after adding new data to the full dataset so both train and test get a share of the new entries.

---

## Training

**Script:** `ai/scripts/train_lob_model.py`

**Steps:**

1. Load dataset JSON — defaults to `lob_recommendation_train.json` if it exists, otherwise falls back to the full dataset.
2. Flatten into (description, label) rows.
3. Vectorize text with `TfidfVectorizer` (max_features=5000, ngram_range=(1,2), sublinear_tf).
4. Train three classifiers (all with `class_weight='balanced'`) and compare via cross-validation:
   - Logistic Regression
   - Random Forest
   - Linear SVC (wrapped with CalibratedClassifierCV for probability support)
5. Select the best model by accuracy.
6. Fit the best model on the training set and save artifacts.

**Run manually:**

```bash
cd /path/to/Capstone
pip install -r ai/requirements.txt
python3 ai/scripts/train_lob_model.py
```

Optionally pass a custom dataset:

```bash
python3 ai/scripts/train_lob_model.py --dataset /path/to/custom_dataset.json
```

---

## Artifacts

All saved under `ai/models/`:

| File | Description |
|------|-------------|
| `lob_vectorizer.joblib` | Fitted TF-IDF vectorizer |
| `lob_model.joblib` | Best trained classifier |
| `lob_labels.json` | Ordered list of class labels (e.g., `["AGR|Crop farming", ...]`) |

---

## Prediction Service

**Script:** `ai/service/predict_app.py`

A Flask app that loads the trained artifacts and serves predictions.

### Start the service

```bash
cd /path/to/Capstone
pip install -r ai/requirements.txt
python3 ai/service/predict_app.py
```

The service runs on port **5050** by default (override with `LOB_MODEL_PORT` env var).

### Retrain on startup

To force a retrain from the default dataset when starting the stack:

```bash
./start.sh --retrain
```

This sets `LOB_RETRAIN_ON_START=1` for the lob-model container so the Python service retrains from `ai/datasets/lob_recommendation_dataset.json` before starting the server. You can combine it with other flags, e.g. `./start.sh --dev --retrain`.

Without `--retrain`, the service only auto-trains when the model artifacts are missing (first run or fresh clone). With `--retrain`, it always retrains on that startup. When you update the dataset, run the full pipeline first (split → train → evaluate) so metrics are saved, then start the service with `--retrain`; see [ai-lob-improvement-plan-and-requirements.md](ai-lob-improvement-plan-and-requirements.md) Part 3 for the one-command pipeline.

To retrain when running the Python service directly (no Docker):

```bash
python3 ai/service/predict_app.py --retrain
```

The service also honours the env var `LOB_RETRAIN_ON_START=1` (or `true`/`yes`) as equivalent to `--retrain`, so you can set it in a compose file or override to retrain on every container start.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns model status and label count |
| `POST` | `/predict` | Predict LOB recommendations for a description |
| `POST` | `/train` | Retrain the model with a provided dataset |

**POST /predict** request body:

```json
{
  "businessDescription": "I sell snacks and groceries in my small store",
  "topK": 5,
  "threshold": 0.01
}
```

Response:

```json
{
  "recommendations": [
    {
      "taxCode": "RET",
      "lineOfBusiness": "retail",
      "detailedLine": "Sari-sari store",
      "psicCode": "4711",
      "confidence": 0.2202
    }
  ]
}
```

**POST /train** request body:

```json
{
  "dataset": [
    {
      "businessDescription": "...",
      "recommendations": [{ "taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Sari-sari store", "psicCode": "4711" }]
    }
  ]
}
```

Or point to a file:

```json
{
  "datasetPath": "/absolute/path/to/dataset.json"
}
```

---

## Integration with business-service

The Node.js backend (`backend/services/business-service/src/routes/ai.js`) has a dual-path architecture:

1. If `LOB_MODEL_SERVICE_URL` is set (e.g., `http://localhost:5050`), it calls the Python service's `/predict` endpoint first.
2. If the trained model call fails or the env var is not set, it falls back to Google Gemini (requires `GEMINI_API_KEY`).

Both paths validate recommendations against the canonical taxonomy in `lineOfBusiness.js`.

### Environment variables

Add to `.env`:

```bash
# Required for Gemini fallback
GEMINI_API_KEY=your-key-from-google-ai-studio

# Optional — enables trained model predictions
LOB_MODEL_SERVICE_URL=http://localhost:5050
```

---

## Admin Trainer UI

Accessible at `/admin/lob-trainer` (admin role required).

### Features

- **Dashboard:** Shows total training examples, tax code coverage, model service status.
- **CRUD:** Add, edit, delete training examples with business description, tax code, and detailed line fields.
- **Search & filter:** Filter examples by description text or tax code.
- **Train model:** Button triggers `POST /api/business/admin/lob-trainer/train`, which exports all examples from the database and sends them to the Python service's `/train` endpoint.

### Workflow for adding a new line of business

1. Add the new LOB to the taxonomy (existing admin feature).
2. In the Trainer UI, add a few training examples for the new LOB.
3. Click **Train Model** and wait for completion (~30-60 seconds).
4. The retrained model is loaded automatically; the next prediction uses it.

---

## Running everything together

```bash
# Terminal 1: Start the Python model service
cd /path/to/Capstone
python3 ai/service/predict_app.py

# Terminal 2: Start the backend services (assumes MongoDB is running)
# Make sure .env has GEMINI_API_KEY and LOB_MODEL_SERVICE_URL=http://localhost:5050
./start.sh

# Terminal 3: Start the frontend
cd web && npm run dev
```

Without the Python service running, the app still works — it simply uses Gemini for all LOB recommendations.

---

## How to validate that the model is strong enough

You don't need deep AI knowledge. Use **metrics** (numbers) and **manual spot-checks** (read a few examples and see if suggestions make sense).

### 1. Run the evaluation script

The evaluation script uses `lob_recommendation_test.json` (a fixed, unseen test set) by default. The model has never seen these descriptions during training.

```bash
cd /path/to/Capstone
python3 ai/scripts/evaluate_lob_model.py
```

You'll see:

- **Top-1 accuracy** — How often the model's single best guess is correct (e.g. 90% = correct in 9/10 test rows).
- **Top-3 accuracy** — How often the correct LOB appears in the model's top 3 suggestions. For the UI we show several suggestions; if top-3 is high (e.g. 95%+), the user usually sees the right one.
- **Top-5 accuracy** — Same but for top 5. The UI typically shows up to 5.
- **Macro F1** — Average strength across all LOBs; good when some LOBs have few examples. Higher is better; with many classes and little data it's often 0.3–0.5.
- **Weighted F1** — Like Macro F1 but weights by class frequency (more forgiving of rare classes).
- **Per-class recall** — Which LOBs the model misses most. Add more training examples for those in the Trainer UI.

**Rough "strong enough" guide:** Top-1 above 80% and top-3 above 90% is solid. If top-3 is much higher than top-1, the correct LOB is usually in the list, which is acceptable. Use the "Lowest recall" list to add examples for weak LOBs and retrain.

### 2. Audit the dataset

Run the audit script to identify under-represented LOBs:

```bash
python3 ai/scripts/audit_lob_dataset.py
```

This shows every label in the taxonomy, how many training examples it has, and which ones are below the threshold (default: 5). The default of 5 matches the training script’s 5-fold CV: with at least 5 examples per label, every class can participate in cross-validation. Use the output as a checklist for adding data.

### 3. Manual spot-checks

Pick 10–20 real-world descriptions (English and Filipino), run them through the form or the prediction API, and check: Is the right LOB in the list? Are suggestions reasonable? If yes, the model is good enough for your use case.

---

## How to enhance the model

Simple levers (no AI expertise required):

1. **Audit first** — Run `python3 ai/scripts/audit_lob_dataset.py` to find which LOBs have too few examples.

2. **Add more data** — Add training examples for under-represented LOBs. You can:
   - Use the Admin Trainer UI at `/admin/lob-trainer` to add examples one by one, then click **Train model**.
   - Or add entries directly to `ai/datasets/lob_recommendation_dataset.json`.
   - Or use the Gemini-assisted augmentation script (see below).

3. **Target: at least 5 examples per LOB** — The training script uses 5-fold stratified CV for model selection; with 5+ examples per label, every class is included in CV. Fewer than 5 still trains but CV is limited or skips some classes. More data per label generally improves generalization (no single “magic number” beyond that). Use the audit script with `--threshold 5` (default) to see which labels need more data.

4. **Re-split, retrain, re-evaluate** — After adding data to the full dataset:

```bash
python3 ai/scripts/split_lob_dataset.py   # regenerate train/test
python3 ai/scripts/train_lob_model.py      # retrain on new train set
python3 ai/scripts/evaluate_lob_model.py   # evaluate on new test set
```

5. **Optional: Gemini-assisted augmentation** — For bulk generation of synthetic descriptions:

```bash
# Dry run (shows what would be generated, no API calls):
python3 ai/scripts/augment_lob_dataset.py --dry-run

# Actually generate (requires GEMINI_API_KEY):
GEMINI_API_KEY=your-key python3 ai/scripts/augment_lob_dataset.py
```

This writes to `ai/datasets/lob_recommendation_augmented.json`. **You must review the output** before merging — remove any incorrect or low-quality descriptions, then append the good entries to the main dataset and re-split.

6. **Gemini as backup** — The app already falls back to Gemini when the trained model fails or isn't configured, so users can still get suggestions or add lines manually.

---

## Limitations

With 79 classes and limited data, the model is inherently data-limited. The fixed train/test split gives an honest estimate of generalization. As you add more balanced data through the Trainer UI or augmentation scripts, metrics will improve. Gemini and the "Add line manually" button remain the safety net for cases the model misses.
