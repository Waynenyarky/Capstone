# LOB AI Model: Improvement Plan & Requirements Checklist

Two parts: (1) **Did we meet your professor’s requirements?** and (2) **As an AI specialist, what would we do to improve the model and reach 95%?**

---

## Part 1: Requirements Checklist (Professor’s Notes)

| Requirement | Status | Where it’s done |
|-------------|--------|------------------|
| **Training techniques used (visible)** | ✅ | Documented in [ai-lob-model-creation-and-flow.md](ai-lob-model-creation-and-flow.md): TF-IDF, stratified K-Fold CV, class_weight=balanced, CalibratedClassifierCV for LinearSVC, GridSearchCV for tuning. Also in code and `training_meta.json`. |
| **F1 score** | ✅ | Evaluation script and API: `macroF1`, `weightedF1`. Admin UI can show them via `/evaluate`. |
| **Precision** | ✅ | Evaluation script and API: `precisionMacro`, `precisionWeighted`. Added to `evaluate_lob_model.py` and `/evaluate` response. |
| **Accuracy** | ✅ | Top-1 (and Top-3, Top-5) in evaluation script, API, and UI. |
| **Recall** | ✅ | Macro and weighted in evaluation; per-class recall for “which LOBs to improve.” |
| **Optimized and fine-tuned model** | ✅ | GridSearchCV on best algorithm; best params saved in `training_meta.json`. Model deployed is the tuned one. |
| **95% accurate** | ⚠️ Not yet | Current test Top-1 ~72%. Reaching 95% needs more data and iteration (see Part 2). |
| **Document: how model was created, with layers and steps** | ✅ | [ai-lob-model-creation-and-flow.md](ai-lob-model-creation-and-flow.md) has the full flow. |
| **Flow in doc: Raw data → Preprocessing → Data splitting → Model training (6+ algos) → Optimizing → Deployment** | ✅ | Same doc: sections 1–6 match this flow. |
| **Algorithms: SVM, RF, DT, LR, XGB, NN** | ✅ | LinearSVC + SVC(RBF), RandomForest, DecisionTree, LogisticRegression, XGBoost (optional), MLPClassifier. |

**Summary:** Everything is met except **95% accuracy**; that is the main gap and is driven by **dataset size** (as your professor said).

---

## Part 2: Improvement Plan (AI Specialist View)

### Main problem: dataset is too small

- **Current:** 383 entries, 80 classes, many labels with only 2–5 examples. Test Top-1 ~72%.
- **Goal:** 95% Top-1 (or at least high Top-3/Top-5 and macro F1).

Improvements below are ordered by impact.

---

### 1. Increase and balance the dataset (highest impact)

- **Add real examples**  
  - From BPLO forms, support tickets, or manual entry via Admin LOB Trainer.  
  - Target: at least **10–20+ examples per label** (especially for low-recall LOBs from `evaluate_lob_model.py`).

- **Bootstrap (current, no API)**  
  - Keep using `bootstrap_lob_dataset.py` to reach a minimum count per label.  
  - Optionally raise `--target` (e.g. 10) once you have more base variety.

- **Optional: synthetic data with review**  
  - If you introduce Gemini (or similar) later: generate candidates, then **human review** before merging into `lob_recommendation_dataset.json`.  
  - Never treat unreviewed synthetic data as gold.

- **Audit often**  
  - Run `audit_lob_dataset.py --threshold 10` and use the “below threshold” list as a priority list for collection.

**Outcome:** More and more balanced data is the single biggest lever for 95% and better precision/recall/F1.

---

### 2. Re-run pipeline after every data update

After adding/merging data:

```bash
python3 ai/scripts/split_lob_dataset.py
python3 ai/scripts/train_lob_model.py
python3 ai/scripts/evaluate_lob_model.py --output-json ai/models/evaluation_metrics.json
```

- Track **accuracy, precision, recall, F1** (script and JSON).  
- Use **per-class recall** to decide which LOBs need more examples next.

---

### 3. Model and feature tweaks (medium impact)

- **Try more TF-IDF options**  
  - e.g. `max_features=10000`, or `ngram_range=(1,3)` (trigrams).  
  - Compare with a small grid in the training script.

- **Ensure all 6+ algorithms run**  
  - MLP can fail with string labels on some setups; XGBoost needs `libomp` on macOS. Fix or document so professor sees we tried SVM, RF, DT, LR, XGB, NN.

- **Slightly larger tuning grids**  
  - Add a few more values per hyperparameter (e.g. more `C`, more `max_depth`) or use `RandomizedSearchCV` with more iterations if training time allows.

---

### 4. Evaluation and reporting (for professor)

- **Always report all four metrics**  
  - Accuracy (Top-1, and Top-3/Top-5 if available).  
  - Precision (macro/weighted).  
  - Recall (macro/weighted).  
  - F1 (macro/weighted).

- **Save metrics to a file**  
  - Run:  
    `python3 ai/scripts/evaluate_lob_model.py --output-json ai/models/evaluation_metrics.json`  
  - Commit or export this file so the professor can see the exact numbers.

- **Mention in the doc**  
  - In [ai-lob-model-creation-and-flow.md](ai-lob-model-creation-and-flow.md) we already state where accuracy, precision, recall, and F1 are produced (script, API, UI).

---

### 5. Deployment and operations

- **Retrain when data changes**  
  - Use `--retrain` or `LOB_RETRAIN_ON_START=1` when you’ve updated the dataset so the deployed model is always trained on the latest data.

- **Version the dataset and metrics**  
  - Keep a copy of the dataset (or its path) used for each trained model and the corresponding `evaluation_metrics.json` so you can reproduce and show progress toward 95%.

---

## Summary: Did we meet the requirements?

- **Yes:** Training techniques documented; accuracy, precision, recall, F1 all reported; model is optimized and fine-tuned; flow doc exists with Raw data → Preprocessing → Data splitting → Model training (6+ algos) → Optimizing → Deployment; we use SVM, RF, DT, LR, XGB (optional), NN (MLP).

- **Not yet:** **95% accuracy** — we’re around 72% Top-1. Getting to 95% is mainly a **data** problem: larger, more balanced dataset, then re-run the same pipeline and re-evaluate. The improvement plan above is the path to get there.

---

## Part 3: Execution plan

This section turns Part 2 into a concrete plan you can follow and tick off.

### 3.1 One-command pipeline

After any dataset change, run one command that: splits → trains → evaluates and **saves** the four metrics (accuracy, precision, recall, F1).

**Script:** [ai/scripts/run_lob_pipeline.sh](../ai/scripts/run_lob_pipeline.sh)

**From repo root:**

```bash
./ai/scripts/run_lob_pipeline.sh
```

Or with options:

```bash
./ai/scripts/run_lob_pipeline.sh --dataset ai/datasets/lob_recommendation_dataset.json
./ai/scripts/run_lob_pipeline.sh --no-tune
```

**Environment (optional):** `LOB_DATASET_PATH` for default dataset; `LOB_NO_TUNE=1` to skip hyperparameter tuning.

**Output:** Metrics are written to `ai/models/evaluation_metrics.json` (accuracy Top-1/3/5, precision macro/weighted, recall macro/weighted, F1 macro/weighted). After adding data, run the pipeline and use this file (and the script’s per-class recall output) to track progress.

---

### 3.2 Dataset growth workflow

Repeat this workflow to increase and balance the dataset (Part 2, #1).

1. **Audit**  
   Run:  
   `python3 ai/scripts/audit_lob_dataset.py --threshold 10`  
   Use the printed “below threshold” and “missing” labels as the priority list for collection.

2. **Low-recall LOBs**  
   Run the pipeline (3.1) or at least:  
   `python3 ai/scripts/evaluate_lob_model.py`  
   Use the “lowest recall” list in the output (and optionally `ai/models/evaluation_metrics.json`) to decide which labels need more examples next.

3. **Add data**  
   Prefer **real examples** (Admin LOB Trainer at `/admin/lob-trainer`, CSV import, or direct edit of `ai/datasets/lob_recommendation_dataset.json`). Optionally run:  
   `python3 ai/scripts/bootstrap_lob_dataset.py --target 10`  
   then merge reviewed entries from `lob_recommendation_dataset_bootstrapped.json` into the main dataset.  
   **Higher-quality AI descriptions (no API):** Use Option A in [ai-lob-dataset-quality-report.md](ai-lob-dataset-quality-report.md) — request batch JSON from the chat assistant, save to `ai/datasets/generated_batch_*.json`, then run `python3 ai/scripts/merge_generated.py ai/datasets/generated_batch_1.json` to merge into the main dataset used by the pipeline and `./start.sh --retrain`.

4. **Re-run pipeline**  
   Run `./ai/scripts/run_lob_pipeline.sh` again. Compare `ai/models/evaluation_metrics.json` (and per-class recall) before and after to see improvement.

---

### 3.3 Optional tweaks

When you have time, you can try these (Part 2, #3); no obligation to implement all.

- **TF-IDF**  
  In [ai/scripts/train_lob_model.py](../ai/scripts/train_lob_model.py), try e.g. `max_features=10000` or `ngram_range=(1,3)` in a separate run and compare metrics (or add a small grid and pick the best).

- **Tuning**  
  Slightly enlarge the GridSearchCV grids (e.g. more `C` or `max_depth` values) or add a `RandomizedSearchCV` option for faster exploration.

- **MLP / XGB**  
  MLP can fail with string labels on some setups; XGBoost may need `libomp` on macOS (`brew install libomp`). Fix or document so that all 6+ algorithms (SVM, RF, DT, LR, XGB, NN) run in your environment, and note in the doc which algorithms were compared in the final run.

---

### 3.4 Deploy and versioning

**Retrain when data changes (Part 2, #5)**  
If the deployed app uses the JSON dataset, run the pipeline (3.1) after updating the dataset, then start the prediction service with `--retrain` (or `LOB_RETRAIN_ON_START=1`) so the live model is trained on the current data. See [lob_model_training.md](lob_model_training.md) (“Retrain on startup”).

**Versioning**  
For important milestones, keep a copy of the dataset and metrics so you can reproduce and show progress toward 95%. For example:

- Copy `ai/datasets/lob_recommendation_dataset.json` to `ai/datasets/archive/lob_recommendation_dataset_YYYYMMDD.json`.
- Copy `ai/models/evaluation_metrics.json` to `ai/models/archive/evaluation_metrics_YYYYMMDD.json`.

No mandatory script; do this when you record a milestone (e.g. before a demo or submission).
