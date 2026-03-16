# AI Hardening + 4,000 Bilingual Dataset Implementation

This document summarizes the implementation of model-service hardening and the balanced bilingual dataset target (**2,000 Filipino + 2,000 English flattened rows**).

## What was implemented

## 1) Model-service hardening

### Protected admin endpoints
- `POST /train` now requires `X-LOB-Admin-Token`.
- `GET /evaluate` now requires `X-LOB-Admin-Token`.
- If `LOB_MODEL_ADMIN_TOKEN` is not configured, these endpoints return `503`.

Files:
- `ai/service/predict_app.py`
- `backend/services/business-service/src/routes/lobTrainer.js`
- `.env.example`
- `docker-compose.yml`
- `docker-compose.dev.yml`

### Removed path-based training input
- `datasetPath` input was disabled for `/train`.
- Only in-body `dataset` arrays are accepted.
- Added strict dataset schema checks before retraining.

File:
- `ai/service/predict_app.py`

### Request bounds and validation
- Added max description length (`2000`) for `/predict`.
- Added bounded validation for `topK`, `threshold`, and `minConfidence`.

File:
- `ai/service/predict_app.py`

### Artifact integrity checks
- Training now writes SHA-256 checksums for model artifacts.
- Load path verifies checksums before `joblib.load`.

Files:
- `ai/scripts/train_lob_model.py`
- `ai/service/predict_app.py`

### Evaluation policy hardening
- Evaluation now requires fixed test set (`lob_recommendation_test.json`) and no longer falls back to full-dataset optimistic scoring.

Files:
- `ai/scripts/evaluate_lob_model.py`
- `ai/service/predict_app.py`

## 2) Balanced bilingual dataset target

### New dataset generator
A new script generates a balanced bilingual dataset with explicit language labels (`english` or `filipino`) and one recommendation per entry.

File:
- `ai/scripts/generate_balanced_bilingual_dataset.py`

### Generated artifacts
- `ai/datasets/lob_recommendation_dataset_balanced_4000.json`
- `ai/datasets/lob_recommendation_dataset_balanced_4000_report.json`

### Verified result
- Flattened rows: **4000**
- English rows: **2000**
- Filipino rows: **2000**
- Mixed rows: **0** (explicitly avoided for claim clarity)

Audit script:
- `ai/scripts/audit_bilingual_dataset.py`

## 3) Pipeline defaults updated

When present, the balanced dataset is now preferred by default in scripts/services:
- `ai/service/predict_app.py`
- `ai/scripts/train_lob_model.py`
- `ai/scripts/split_lob_dataset.py`
- `ai/scripts/audit_lob_dataset.py`
- `ai/scripts/run_lob_pipeline.sh`

## 4) Documentation updates

Updated references for balanced bilingual counts and secured model admin endpoints in:
- `docs/lob_model_training.md`
- `SPRINT2_IMPLEMENTATION_SUBMISSION.md`
- `ai/scripts/sprint2_filipino_support_test.py`

## Operational notes

1. Set `LOB_MODEL_ADMIN_TOKEN` in `.env` and ensure both **business-service** and **lob-model** use the same value.
2. Use the pipeline for reproducible metrics:
   - `ai/scripts/run_lob_pipeline.sh`
3. Use bilingual audit for claim verification:
   - `python3 ai/scripts/audit_bilingual_dataset.py --dataset ai/datasets/lob_recommendation_dataset_balanced_4000.json`
