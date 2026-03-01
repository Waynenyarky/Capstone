# LOB AI Model: How It Was Created — Flow and Steps

This document describes **how the Line of Business (LOB) recommendation AI model was created**, in the order your professor expects: **Raw data → Preprocessing → Data splitting → Model training (6+ algorithms) → Optimizing model → Deployment**. It also states the **training techniques** used and where **accuracy, precision, recall, and F1** are reported.

---

## Flow Overview

```
Raw data  →  Preprocessing  →  Data splitting  →  Model training (6+ algos)  →  Optimizing model  →  Deployment
```

Each step is detailed below with scripts, techniques, and outputs.

---

## 1. Raw Data

**What it is:** Business descriptions (English/Filipino) and their correct LOB labels (tax code + detailed line), stored as JSON.

**Location:** `ai/datasets/lob_recommendation_dataset.json`

**Format (per entry):**
- `businessDescription`: string (what the business does)
- `recommendations`: array of `{ taxCode, lineOfBusiness, detailedLine, psicCode }`

**Source:** Curated examples (BPLO-style descriptions), optionally extended by a **bootstrap script** that duplicates and lightly varies existing rows so every label has at least 5 examples (no external API). Taxonomy of allowed labels: `ai/data/line_of_business.json`.

**Current size (example):** 383 entries, 80 unique labels (taxCode|detailedLine). *Professor feedback: dataset is still small; more data is the main lever to reach 95% accuracy.*

---

## 2. Preprocessing

**Purpose:** Turn raw JSON into a form suitable for training: one (text, label) pair per row, then vectorize text.

**Steps:**

1. **Flatten**  
   Each entry can have multiple `recommendations`. We flatten so each `(businessDescription, taxCode|detailedLine)` becomes one row. Example: one description with two LOBs becomes two rows.

2. **Text cleaning**  
   - Strip whitespace from `businessDescription`.  
   - Skip rows with empty description or missing taxCode/detailedLine.

3. **Vectorization (at training time)**  
   - **TF-IDF** (term frequency–inverse document frequency) with:
     - `max_features=5000`
     - `ngram_range=(1, 2)` (unigrams + bigrams)
     - `sublinear_tf=True`
   - Fitted on the **training set only**; test set is transformed with the same vectorizer (no data leakage).

**Script:** Preprocessing is inside `ai/scripts/train_lob_model.py` (flatten + vectorize). No separate preprocessing script; the same flatten logic is in `evaluate_lob_model.py` and the prediction service for consistency.

**Output of this stage:** Feature matrix `X` (sparse) and label vector `y` (string labels like `"RET|Sari-sari store"`), or integer labels for algorithms that require them (e.g. XGBoost).

---

## 3. Data Splitting

**Purpose:** Separate data into **train** and **test** sets so evaluation is on unseen data.

**Technique:**  
- Split at the **entry** level (whole `businessDescription` + its recommendations). The same description never appears in both train and test.  
- Default: **80% train, 20% test**, fixed seed (e.g. 42) for reproducibility.

**Script:**  
`ai/scripts/split_lob_dataset.py`  
`--dataset`, `--test-size`, `--seed`

**Outputs:**  
- `ai/datasets/lob_recommendation_train.json`  
- `ai/datasets/lob_recommendation_test.json`

---

## 4. Model Training (6+ Algorithms)

**Purpose:** Train multiple classifiers, compare them, and pick the best.

**Algorithms used (6+):**

| Algorithm        | Type              | Notes                                      |
|-----------------|-------------------|--------------------------------------------|
| Logistic Regression | Linear            | solver=lbfgs, class_weight=balanced        |
| Random Forest   | Ensemble           | n_estimators=200, class_weight=balanced    |
| Linear SVC      | SVM (linear)      | dual=False, class_weight=balanced          |
| Decision Tree   | Tree               | max_depth=20, class_weight=balanced        |
| SVC (RBF)       | SVM (RBF kernel)  | gamma=scale, class_weight=balanced        |
| MLPClassifier  | Neural network     | hidden_layer_sizes=(100,50), early_stopping|
| XGBoost         | Gradient boosting  | Optional (if library loads)                |

**Training techniques:**

- **Stratified K-Fold cross-validation** on the training set to compare algorithms (same folds for all). Number of folds is limited by the smallest class size (e.g. 2-fold if min class count is 2).
- **Class weight = balanced** for all sklearn models to handle imbalanced labels.
- **Best model** is chosen by **CV accuracy**; that model is then refit on the **full training set**.
- **LinearSVC** does not output probabilities; it is wrapped with **CalibratedClassifierCV** so the app can show confidence scores (top-K and thresholds).

**Script:**  
`ai/scripts/train_lob_model.py`  
Uses: `sklearn.feature_extraction.text.TfidfVectorizer`, then the classifiers above, then `cross_val_score` and final `fit`.

**Outputs:**  
- `ai/models/lob_vectorizer.joblib`  
- `ai/models/lob_model.joblib` (best classifier)  
- `ai/models/lob_labels.json` (ordered list of labels)  
- `ai/models/training_meta.json` (algorithm name, trainedAt, cv_accuracy, n_train_samples, n_labels)

---

## 5. Optimizing Model

**Purpose:** Fine-tune the **best algorithm** (from step 4) via hyperparameter search.

**Technique:**  
- **GridSearchCV** over a small grid of hyperparameters for the winning model.  
- Example grids: for LinearSVC, `C` in [0.5, 1.0, 2.0]; for Random Forest, `n_estimators` and `max_depth`; etc.  
- **Refit** the best estimator on the full training set after search.

**Script:**  
Same `ai/scripts/train_lob_model.py`. Use default (tuning on) or `--no-tune` to skip.

**Outputs (in `training_meta.json`):**  
- `tuning.best_params`  
- `tuning.best_cv_score`  
- `tuning.cv_results` (optional)

So the model you deploy is **optimized and fine-tuned** (best algorithm + best params from grid search).

---

## 6. Deployment

**Purpose:** Serve the trained model so the app can get LOB recommendations.

**Components:**

- **Prediction service:** `ai/service/predict_app.py` (Flask).  
  - Loads `lob_vectorizer.joblib`, `lob_model.joblib`, `lob_labels.json`.  
  - **Endpoints:** `GET /health`, `POST /predict`, `GET /evaluate`, `POST /train`.  
- **Deployment:** Run directly (`python3 ai/service/predict_app.py`) or via Docker (e.g. `lob-model` container).  
- **Integration:** Business-service calls this service when `LOB_MODEL_SERVICE_URL` is set; falls back to Gemini if the model is unavailable.

**Where the model is used:**  
Business owner form → business-service → LOB model service `/predict` → recommendations with confidence scores.

---

## Evaluation Metrics (Accuracy, Precision, Recall, F1)

These are the metrics your professor asked for. They are computed on the **held-out test set** (data the model never saw during training).

**Where they appear:**

1. **Command-line:**  
   Run:  
   `python3 ai/scripts/evaluate_lob_model.py`  
   Optionally:  
   `python3 ai/scripts/evaluate_lob_model.py --output-json ai/models/evaluation_metrics.json`  
   The script prints and (with `--output-json`) writes:
   - **Accuracy:** Top-1 (and Top-3, Top-5 if the model has probabilities)
   - **Precision:** macro and weighted
   - **Recall:** macro and weighted
   - **F1:** macro and weighted
   - Per-class recall (which LOBs are missed most)

2. **API:**  
   `GET /evaluate` on the prediction service returns JSON with:
   - `top1Accuracy`, `top3Accuracy`, `top5Accuracy`
   - `precisionMacro`, `precisionWeighted`
   - `recallMacro`, `recallWeighted`
   - `macroF1`, `weightedF1`
   - `lowestRecall` (per-class)

3. **Admin UI:**  
   The LOB Trainer page (`/admin/lob-trainer`) can call the business-service, which proxies to the model service’s `/evaluate` and displays these metrics (including precision, recall, F1).

So: **training techniques** are documented in this doc and in the pipeline doc; **accuracy, precision, recall, and F1** are all reported in evaluation (script, API, and optionally in the UI).

---

## Summary: Flow in One Picture

| Step              | What happens                                                                 | Script / artifact |
|-------------------|-------------------------------------------------------------------------------|-------------------|
| Raw data          | JSON with businessDescription + recommendations                               | `lob_recommendation_dataset.json` |
| Preprocessing     | Flatten to (text, label); TF-IDF on train                                     | Inside `train_lob_model.py` |
| Data splitting    | 80/20 train/test at entry level, fixed seed                                  | `split_lob_dataset.py` → train.json, test.json |
| Model training    | 6+ algos (LR, RF, LinearSVC, DT, SVC RBF, MLP, optional XGB); stratified CV   | `train_lob_model.py` → vectorizer, model, labels, training_meta |
| Optimizing model  | GridSearchCV on best algo; refit on full train                               | Same script → updated model + tuning in training_meta |
| Deployment        | Flask service loads model; business-service calls it for recommendations      | `predict_app.py`; Docker / process |

---

## 95% Accuracy Target

Current test **Top-1 accuracy** is around **72%**. Reaching **95%** is the goal and requires:

1. **Larger, better dataset** — Professor’s main point: the dataset is still small. Add more real or reviewed synthetic examples, especially for low-recall LOBs.  
2. **More examples per label** — Aim for at least 10–20+ per label where possible.  
3. **Re-run pipeline** — After adding data: split → train (with tuning) → evaluate, and track accuracy, precision, recall, F1.

The pipeline and this document already support that workflow; the main gap is **data volume and balance**, not the flow or the metrics.

---

## Is the reported accuracy valid? What does it cover?

**Short answer:** The **72%** (and other metrics) are **valid for what they measure**, but they **do not** automatically cover all real-world edge cases. Here’s the basis and the limitations.

### Where the accuracy is based from

| Aspect | What we use |
|--------|-------------|
| **Data** | `ai/datasets/lob_recommendation_test.json` — a **fixed held-out 20%** of the same dataset used for training (same JSON schema, same taxonomy). The model **never saw** these entries during training. |
| **Split** | Entry-level 80/20, seed 42. So ~77 test entries → 83 flattened rows (one row per description–LOB pair). |
| **Metric** | For each test row we have one true label (`taxCode|detailedLine`). We take the model’s **single best prediction** (argmax of probabilities). **Top-1 accuracy** = fraction of those 83 rows where the predicted label equals the true label. |

So the number is: **“On 83 held-out description–label pairs from the same dataset, the model’s top guess was correct 72% of the time.”** That is a valid, reproducible estimate of performance on **that** test set.

### What this accuracy does NOT cover (edge cases and limitations)

1. **Out-of-domain or weird input**  
   Test set is the same “kind” of data as training (BPLO-style business descriptions). We do **not** systematically evaluate:
   - Gibberish or non-business text  
   - Very short or very long descriptions  
   - Descriptions that don’t clearly match any LOB  
   - Adversarial or misleading phrasing  

   The app may reject some of these with a “describe your business” message (e.g. in the business-service gate), but that behavior is **not** reflected in the 72% number.

2. **Labels outside the taxonomy**  
   The model only predicts among the **80 classes** in `lob_labels.json`. If the real world has a valid LOB that isn’t in the taxonomy, the model can’t predict it and we don’t measure that.

3. **Multi-LOB entries**  
   Entries with multiple recommendations are **flattened** into one row per (description, label). So we evaluate “for this description and this one true label, did the model predict that label?” We do **not** evaluate “did the model return all correct LOBs for a multi-LOB business” in a single metric.

4. **Real BPLO submissions**  
   Unless real BPLO application text was added to the dataset and ended up in the test set, the 72% is based on **curated + bootstrapped** data, not on a separate, real-world-only evaluation set.

5. **Top-1 only**  
   The 72% is **Top-1** accuracy. Top-3 and Top-5 are higher (~78%, ~84%) because we count “correct LOB anywhere in top 3 or 5.” So the **same** model can be described as “72% Top-1” or “84% Top-5” depending on which metric we report.

### Summary for your report or defense

- **Did we reach 95%?** **No.** Current **Top-1 accuracy is ~72%** on the held-out test set.  
- **Is the accuracy valid?** **Yes**, for that test set and that metric: same data source as training, proper train/test split, no train data in test.  
- **Does it consider all edge cases?** **No.** It reflects performance on **in-domain, single-label, taxonomy-only** test rows. Edge cases (gibberish, out-of-domain, multi-LOB behavior, real-world-only data) are not fully reflected in this number.  
- **Where did it base from?** From **`lob_recommendation_test.json`** (83 flattened rows from the same dataset as training, 20% holdout, seed 42), comparing the model’s **single best prediction** to the **one true label** per row.

For a stronger claim (e.g. “valid for production” or “covers edge cases”), you’d add separate checks: e.g. a small set of real BPLO descriptions, or tests for vague/gibberish input, and report those separately from the 72%.
