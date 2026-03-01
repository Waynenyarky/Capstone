# Phase 5B: AI LOB Model Improvement

## Overview
Improve the LOB recommendation model by deduplicating the dataset, augmenting with diverse training data, and retraining to achieve higher accuracy across all categories.

## Prerequisites
Phase 4F (unified fee taxonomy) must be complete so the model outputs match the fee system.

---

## Current State

### Model performance (from `ai/models/evaluation_metrics.json`):
| Metric | Value |
|---|---|
| Top-1 Accuracy | 95.15% |
| Top-3 Accuracy | 100% |
| Top-5 Accuracy | 100% |
| Macro F1 | 0.8608 |
| Weighted F1 | 0.9570 |
| Macro Precision | 0.8656 |
| Macro Recall | 0.8608 |
| Test rows | 165 |

### Issues:
1. **Class imbalance**: Macro F1 (0.86) is significantly lower than weighted F1 (0.96), indicating some LOB categories have poor recall
2. **Small test set**: Only 165 rows — not enough for confidence intervals
3. **Duplicate entries**: Dataset may contain duplicates from multiple generation batches
4. **Low-recall categories**: Batches 2-6 were specifically generated to address low-recall categories, suggesting ongoing issues

---

## 5B-1. Dataset Deduplication

**Script:** `ai/scripts/audit_lob_dataset.py` (already exists)

Run:
```bash
cd ai && python scripts/audit_lob_dataset.py
```

If duplicates are found, deduplicate:
```bash
cd ai && python scripts/augment_lob_dataset.py --deduplicate
```

### Manual verification:
After dedup, check:
- Total examples per category (should be roughly balanced)
- Minimum examples per category (target: at least 15 per category)
- No exact duplicate descriptions across categories

---

## 5B-2. Analyze Per-Category Performance

After dedup, run evaluation:
```bash
cd ai && python scripts/evaluate_lob_model.py
```

Look at the per-class metrics in the output. Identify categories with:
- Recall < 0.80
- F1 < 0.80
- Fewer than 15 training examples

### Expected low-recall categories (based on batch names):
- Mining (MIN) — rare business type
- Utilities (UTL) — rare business type
- Agriculture (AGR) — may overlap with food service
- Construction (CON) — may overlap with services

---

## 5B-3. Augment Low-Recall Categories

**Script:** `ai/scripts/generate_batch_400.py` (exists) or create targeted augmentation

### Strategy:
For each category with recall < 0.80:
1. Generate 20-30 new diverse business descriptions
2. Include variations:
   - Different business sizes (micro, small, medium)
   - Different sub-industries within the category
   - Different description lengths (short vs detailed)
   - Filipino-English descriptions (matching Alaminos context)
3. Validate generated descriptions are unambiguous (clearly belong to that category)

### Augmentation template:
```python
CATEGORY_AUGMENTATION = {
    'MIN': [
        "sand and gravel quarrying business in Pangasinan",
        "small-scale mining operation for limestone",
        "aggregate supplier for construction materials",
        # ... 20+ more
    ],
    'UTL': [
        "water refilling station and delivery service",
        "solar panel installation and maintenance",
        "electric power distribution cooperative",
        # ... 20+ more
    ],
    # ... for each low-recall category
}
```

---

## 5B-4. Merge and Split

After augmentation:

```bash
# Merge all generated batches
cd ai && python scripts/merge_generated.py

# Split into train/test (80/20 stratified)
cd ai && python scripts/split_lob_dataset.py

# Verify split
python -c "
import json
train = json.load(open('datasets/lob_recommendation_train.json'))
test = json.load(open('datasets/lob_recommendation_test.json'))
print(f'Train: {len(train)} examples')
print(f'Test: {len(test)} examples')
"
```

---

## 5B-5. Retrain and Evaluate

```bash
# Train with hyperparameter tuning
cd ai && python scripts/train_lob_model.py

# Evaluate
cd ai && python scripts/evaluate_lob_model.py
```

### Target metrics:
| Metric | Target |
|---|---|
| Top-1 Accuracy | ≥ 95% |
| Macro F1 | ≥ 0.90 |
| Macro Recall | ≥ 0.90 |
| Per-class Recall | ≥ 0.80 for every category |
| Test rows | ≥ 200 |

---

## 5B-6. Verify AI Service Integration

### Predict endpoint:
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"description": "small retail store selling clothing and accessories"}'
```

Expected response should include `taxCode: "RET"` with high confidence.

### Integration with fee system (Phase 4F):
Verify that the predicted `taxCode` can be used by `feeCalculator.getFeeConfig()`:
1. AI predicts `taxCode: "RET"`
2. Fee calculator looks up `FeeConfiguration` where `taxCode === "RET"`
3. Returns correct Mayor's Permit fee and tax brackets

### Web integration:
**File:** `web/src/features/business-owner/components/AiLobRecommendation.jsx`

Verify:
- Component calls AI service with business description
- Displays top 3 recommendations
- User can accept a recommendation (sets LOB on the form)
- Accepted LOB maps correctly to fee configuration

---

## 5B-7. Training Data Management via Admin UI

**File:** `web/src/features/admin/pages/AdminLobTrainer.jsx`

Verify the admin can:
- View training examples
- Add new examples
- Edit existing examples
- Delete examples
- Trigger model retraining from UI

### Backend:
- `GET /api/business/lob-trainer/examples` — list
- `POST /api/business/lob-trainer/examples` — create
- `PUT /api/business/lob-trainer/examples/:id` — update
- `DELETE /api/business/lob-trainer/examples/:id` — delete
- `POST /api/business/lob-trainer/train` — trigger retrain

---

## Edge Cases
- AI service container may need rebuilding after model update: `docker-compose build ai`
- During retraining, the `/predict` endpoint should either serve the old model or return a "training in progress" response
- Descriptions in Filipino-English hybrid should still get correct predictions
- Categories with very few real businesses in Alaminos (e.g., Mining) may never reach 0.90 recall — document the exception

## Acceptance Criteria
1. Dataset is deduplicated with no exact duplicate descriptions
2. Every LOB category has ≥ 15 training examples
3. Model achieves Macro F1 ≥ 0.90 (or documented exception for rare categories)
4. Per-class recall ≥ 0.80 for all categories
5. AI service `/predict` returns correct predictions for test cases
6. Predicted `taxCode` integrates with fee calculator
7. Admin LOB Trainer page works for CRUD and retraining
8. AI service Docker container builds and starts

## Rollback Plan
Restore previous model files from `ai/models/`. The old model and vectorizer are in git history.
