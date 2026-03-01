# AI LOB Model — Full Pipeline (no external API)

This document describes the **end-to-end pipeline** for the Line of Business (LOB) recommendation model: audit → extend dataset → split → train → evaluate. **No Gemini or other API is used** for dataset expansion; we use a bootstrap script that duplicates and lightly varies existing examples so every label meets a minimum count.

For architecture, prediction service, and Admin Trainer UI, see [lob_model_training.md](lob_model_training.md).

---

## Pipeline overview

| Step | Script | Purpose |
|------|--------|--------|
| 1. Audit | `ai/scripts/audit_lob_dataset.py` | Find labels with too few examples (default threshold: 5). |
| 2. Bootstrap | `ai/scripts/bootstrap_lob_dataset.py` | Extend dataset so every label has ≥5 examples (duplicate + light variation; no API). |
| 3. Merge | — | Use bootstrapped file as main dataset (or copy over `lob_recommendation_dataset.json`). |
| 4. Split | `ai/scripts/split_lob_dataset.py` | Produce fixed train/test JSONs. |
| 5. Train | `ai/scripts/train_lob_model.py` | Compare 6+ algorithms, tune best, save model + metadata. |
| 6. Evaluate | `ai/scripts/evaluate_lob_model.py` | Report Top-1/3/5 accuracy, macro/weighted F1, per-class recall. |

---

## 1. Audit

Identifies under-represented labels (count below threshold). Default threshold is 5 so every class can participate in 5-fold CV during training.

```bash
python3 ai/scripts/audit_lob_dataset.py [--dataset PATH] [--threshold 5]
```

- **Output:** Prints missing labels (0 examples), below-threshold labels, and adequate labels. No file written.
- **Dataset default:** `ai/datasets/lob_recommendation_dataset.json`

---

## 2. Bootstrap (no API)

Extends the dataset so every taxonomy label has at least `--target` examples by duplicating existing descriptions and applying light text variation (e.g. prefix/suffix). No Gemini or other API is called.

```bash
python3 ai/scripts/bootstrap_lob_dataset.py [--dataset PATH] [--target 5] [--output PATH]
```

- **Output:** By default writes `ai/datasets/lob_recommendation_dataset_bootstrapped.json`. Original dataset is unchanged unless you pass `--output` to overwrite.
- **Use case:** Run after audit; then either use the bootstrapped file as the main dataset or copy it over `lob_recommendation_dataset.json`.

---

## 3. Merge (optional)

To make the extended set the default for training and for the seeder:

```bash
cp ai/datasets/lob_recommendation_dataset.json ai/datasets/lob_recommendation_dataset_original.json  # backup
cp ai/datasets/lob_recommendation_dataset_bootstrapped.json ai/datasets/lob_recommendation_dataset.json
```

The business-service seeder reads `lob_recommendation_dataset.json` (or `LOB_DATASET_PATH`); it also tries `lob_recommendation_dataset_bootstrapped.json` as a fallback.

---

## 4. Split

Splits the dataset at the **entry** level (same description never in both train and test).

```bash
python3 ai/scripts/split_lob_dataset.py [--dataset PATH] [--test-size 0.2] [--seed 42]
```

- **Outputs:**  
  - `ai/datasets/lob_recommendation_train.json`  
  - `ai/datasets/lob_recommendation_test.json`  
- **Default dataset:** `ai/datasets/lob_recommendation_dataset.json` (use the bootstrapped path if you didn’t merge).

---

## 5. Train

Loads the train set, compares multiple classifiers with cross-validation, runs hyperparameter tuning on the best, and saves the best model plus metadata.

**Algorithms (6+):** LogisticRegression, RandomForest, LinearSVC, DecisionTree, SVC_RBF, MLPClassifier; XGBoost is included if the library loads (optional dependency; may require e.g. `libomp` on macOS).

```bash
python3 ai/scripts/train_lob_model.py [--dataset PATH] [--no-tune]
```

- **Default dataset:** `lob_recommendation_train.json` if present, else `lob_recommendation_dataset.json`.
- **`--no-tune`:** Skip GridSearchCV for the best algorithm (faster run).
- **Outputs under `ai/models/`:**
  - `lob_vectorizer.joblib` — TF-IDF vectorizer  
  - `lob_model.joblib` — Best classifier (possibly tuned)  
  - `lob_labels.json` — Ordered list of labels  
  - `training_meta.json` — Algorithm name, `trainedAt`, `cv_accuracy`, `n_train_samples`, `n_labels`, and (if tuning ran) `tuning.best_params`, `tuning.best_cv_score`, `tuning.cv_results`

**Tuning:** After picking the best algorithm by CV accuracy, the script runs a small `GridSearchCV` for that algorithm and refits the best estimator on the full training set. Best params and CV score are stored in `training_meta.json`.

---

## 6. Evaluate

Uses the fixed test set to report metrics (no training data).

```bash
python3 ai/scripts/evaluate_lob_model.py [--dataset PATH]
```

- **Default dataset:** `lob_recommendation_test.json` if it exists.
- **Metrics:**
  - **Top-1 accuracy** — Fraction of test rows where the single best prediction is correct.
  - **Top-3 / Top-5 accuracy** — Fraction where the correct LOB appears in top-3 or top-5.
  - **Macro F1** — Average F1 over classes (good for imbalanced data).
  - **Weighted F1** — F1 weighted by class frequency.
  - **Per-class recall** — Which LOBs are missed most; use this to add more examples and retrain.

---

## One-shot pipeline (no Gemini)

From project root, with the main dataset already extended (e.g. bootstrapped and merged):

```bash
# Ensure dataset has enough examples per label (bootstrap if needed)
python3 ai/scripts/bootstrap_lob_dataset.py --target 5

# Optional: make it the default
cp ai/datasets/lob_recommendation_dataset_bootstrapped.json ai/datasets/lob_recommendation_dataset.json

# Split and train
python3 ai/scripts/split_lob_dataset.py
python3 ai/scripts/train_lob_model.py

# Evaluate
python3 ai/scripts/evaluate_lob_model.py
```

No `GEMINI_API_KEY` or any external API is required for dataset expansion or training.

---

## Metrics summary

| Metric | Meaning |
|--------|--------|
| **Top-1 accuracy** | % of test rows where the model’s best guess is correct. |
| **Top-3 / Top-5** | % where the correct LOB is in the top 3 or 5 suggestions. |
| **Macro F1** | Average F1 across all LOBs; each class weighted equally. |
| **Weighted F1** | F1 weighted by class frequency. |
| **Per-class recall** | Per-LOB recall; use “Lowest recall” to target weak classes. |

A practical target: Top-1 &gt; 70%, Top-3 &gt; 85%. Improve by adding examples for low-recall LOBs and re-running split → train → evaluate.

---

## Optional: Gemini augmentation (not required)

The repo also includes `ai/scripts/augment_lob_dataset.py`, which uses the Gemini API to generate synthetic descriptions for under-represented labels. **You do not need this for the pipeline above.** If you use it:

1. Set `GEMINI_API_KEY`.
2. Run the script; it writes `lob_recommendation_augmented.json`.
3. **Review and edit** that file, then merge approved entries into `lob_recommendation_dataset.json`.
4. Re-run split → train → evaluate.

The default pipeline uses only the bootstrap script for dataset extension (no API).
