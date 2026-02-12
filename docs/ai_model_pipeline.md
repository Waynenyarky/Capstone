# AI Model Pipeline Documentation

## Overview

This document describes the pipeline from raw data to deployment for the BizClear AI Document Validation system.

---

## Pipeline Diagram

```
Raw Data (CSV) → Preprocessing → Data Splitting → Model Training (6 algorithms) → Optimization → Evaluation → Deployment
```

---

## Step 1: Raw Data

**Source:** `ai/datasets/unified_form_validation_dataset.csv`

- Synthetic dataset of ~100+ business permit applications
- ~60% valid, ~40% with errors (missing fields, wrong PSIC, invalid address, inconsistent data)
- Fields: business_name, owner_name, address, barangay, city, psic_code, line_of_business, capitalization, gross_sales, has_required_docs
- Target: `is_valid` (0 or 1)

**Validation:** To be validated by BPLO officer (Wilfredo Villena) as gold set.

---

## Step 2: Preprocessing

- Handle missing values (fill or drop)
- Encode categorical variables (LabelEncoder)
- Normalize numerical features (StandardScaler)
- No text embedding in traditional ML path; structured features only

---

## Step 3: Data Splitting

- Train/Val/Test: 70/15/15 or 80/10/10
- Stratified sampling to preserve class balance

---

## Step 4: Model Training (6 Algorithms)

| Algorithm | Purpose |
|-----------|---------|
| **SVM** | Support Vector Machine, RBF and linear kernels |
| **RF** | Random Forest, feature importance analysis |
| **DT** | Decision Tree, interpretability |
| **LR** | Logistic Regression, baseline |
| **XGB** | XGBoost, gradient boosting |
| **NN** | Neural Network, feedforward |

---

## Step 5: Optimization

- Hyperparameter tuning (GridSearchCV or RandomizedSearchCV)
- k-fold cross-validation (k=5)
- Regularization (L1/L2), early stopping, dropout for NN

---

## Step 6: Evaluation

- Metrics: accuracy, precision, recall, F1, confusion matrix, ROC
- Select best performer for deployment

---

## Step 7: Combined Approach (Hybrid)

- **Traditional ML:** Fast, deterministic structured validation (missing fields, format, ranges)
- **Gemini:** Semantic/contextual validation (PSIC matches line of business, lessor rules)
- **Flow:** ML runs first; if issues or scanned image provided, invoke Gemini

---

## Step 8: Deployment

- Best model saved as `.joblib`
- Loaded by AI service at startup
- API: `POST /api/ai/validate-form`, `POST /api/ai/validate-form/ml-only`, `POST /api/ai/validate-form/scan`

---

## Revision History

- Initial draft: Phase 1A
