# AI 95% Accuracy Implementation Plan (LOB Recommender)

## Implementation Status (current)

Wave 1 fixes are now implemented in code:

- Robust bilingual normalization shared across training/evaluation/inference.
- Hybrid TF-IDF features (word + character n-grams) for typo resilience.
- Optional difficult low-recall datasets included in training with augmentation.
- Leakage guard added (real-world holdout rows excluded from optional difficult training rows).
- Confidence-gate metrics now exported during evaluation.
- Predict API default confidence gate aligned to the evaluated 95%-precision operating point (`minConfidence=0.50`).

Latest post-fix metrics:

- `realworld_holdout_metrics.json`:
  - Top-1: **88.0%**
  - Top-3: **98.0%**
  - 95%-precision gate: threshold **0.50**, coverage **84.0%**
- `realworldish_typo_codeswitch_metrics.json`:
  - Top-1: **86.0%**
  - Top-3: **98.0%**

---

## 1) Objective

Achieve and sustain **95% accuracy** under a clearly defined acceptance standard for the LOB recommendation model, using a phased hardening + data + model strategy.

This plan uses the latest evaluation snapshots as baseline and defines implementation gates before sign-off.

---

## 2) Baseline (as of latest run)

### 2.1 Easy synthetic split (existing)
- Source: `ai/models/evaluation_metrics.json`
- Top-1: **100.00%** (800 rows)

### 2.2 Real-world-ish low-recall aggregate
- Source: `ai/models/realworldish_validation_metrics.json`
- Top-1: **57.84%** (185 rows)
- Top-3: **67.57%**
- Top-5: **71.89%**

### 2.3 Stress test (typo + code-switch)
- Source: `ai/models/realworldish_typo_codeswitch_metrics.json`
- Top-1: **47.57%** (185 rows)
- Top-3: **56.76%**
- Top-5: **60.00%**

### 2.4 Gap to target
- Gap from stress Top-1 to 95% target: **47.43 points**

---

## 3) Key failure patterns observed

From `ai/models/realworldish_typo_codeswitch_top_confusions.json`, the model over-predicts a few classes (especially `FIN|Pawnshop`) under noisy input.

High-frequency confusion examples:
- `FDS|Bakery / pastry shop` -> `FIN|Pawnshop`
- `FDS|Restaurant / eatery` -> `FIN|Pawnshop`
- `TRN|Delivery / courier service` -> `FIN|Pawnshop`
- `RET|Sari-sari store` -> `FIN|Pawnshop`
- `WHL|Food & beverages (wholesale)` -> `MFG|Food processing`

This suggests weak robustness to lexical noise and insufficient hard negatives for similar-looking phrases.

---

## 4) Target definition (sign-off contract)

To avoid misleading “95%” claims, acceptance is split into two production-relevant guarantees:

1. **High-confidence auto-classification path**
   - Precision@1 >= **95%**
   - Coverage >= **75%**

2. **Overall user-visible recommendation quality**
   - Top-3 accuracy >= **95%** on acceptance holdout
   - Top-1 accuracy >= **90%** on acceptance holdout

3. **Stress robustness floor** (typos + code-switch)
   - Top-1 >= **85%**
   - Top-3 >= **93%**

> Final sign-off requires all three conditions to pass in 2 consecutive runs.

---

## 5) Implementation roadmap

## Phase 0 — Evaluation discipline and reproducibility (Week 1)

### Deliverables
- Keep and version these benchmark sets:
  - `clean_holdout_v1.json`
  - `realworld_holdout_v1.json`
  - `stress_typo_codeswitch_v1.json`
- Extend evaluation output with:
  - thresholded precision/coverage curve
  - class-wise precision/recall report
  - top confusion pairs report

### Code work
- Update `ai/scripts/evaluate_lob_model.py` to emit threshold metrics JSON.
- Keep `ai/scripts/run_realworldish_stress_test.py` as the standard stress generator/runner.

### Exit gate
- All three benchmark scripts run in CI and publish artifacts.

---

## Phase 1 — Data remediation (Weeks 1–2)

### Deliverables
- Add **hard-negative and ambiguity-focused samples** for worst confusion pairs.
- Expand bilingual noisy corpus with controlled augmentation:
  - typos
  - colloquial Filipino/Taglish
  - abbreviations and shorthand
- Build class floor so no class is underrepresented in difficult sets.

### Data targets
- Add at least **150 difficult examples/class** for bottom-20 recall classes.
- Ensure each confusion pair has counterexamples where only decisive tokens differ.

### Exit gate
- Macro recall improvement >= +15 points on stress benchmark versus current baseline.

---

## Phase 2 — Model architecture upgrades (Weeks 2–3)

### Deliverables
1. **Robust feature extraction**
   - Combine word n-grams + character n-grams (typo resilience)
   - Normalize punctuation/spacing and common shorthand
2. **Hierarchical classification**
   - Stage A: predict tax family (e.g., FIN/RET/FDS)
   - Stage B: predict detailed line within family
3. **Probability calibration**
   - Calibrate scores for reliable thresholding (needed for 95% precision path)

### Code work
- `ai/scripts/train_lob_model.py`:
  - add hybrid vectorizer option
  - add two-stage training option
  - persist calibration metadata

### Exit gate
- Stress Top-1 >= 75%
- Real-world holdout Top-1 >= 82%

---

## Phase 3 — Inference policy for safe 95% (Week 3)

### Deliverables
- Confidence-gated response policy in `ai/service/predict_app.py`:
  - if confidence >= threshold: return single auto-choice
  - else: return top-3 + clarification prompt (no risky auto-commit)
- Add telemetry for low-confidence rates and correction outcomes.

### Exit gate
- Precision@1 >= 95% with coverage >= 75% on acceptance holdout.

---

## Phase 4 — Regression prevention and release gates (Week 4)

### Deliverables
- CI job to run:
  1. clean holdout eval
  2. real-world holdout eval
  3. stress eval
- Block deploy if any acceptance metric fails.
- Publish monthly drift report and retraining triggers.

### Exit gate
- Two consecutive green runs with all sign-off metrics passed.

---

## 6) Concrete backlog (execution order)

1. Extend `ai/scripts/evaluate_lob_model.py` with threshold precision/coverage outputs.
2. Build curated acceptance datasets (`clean_holdout_v1`, `realworld_holdout_v1`, `stress_v1`).
3. Add hard-negative generator script for top confusion pairs.
4. Update `ai/scripts/train_lob_model.py` to support char n-grams + hierarchical mode.
5. Retrain and compare baseline vs upgraded model using same fixed benchmarks.
6. Add confidence gate logic to `ai/service/predict_app.py`.
7. Add CI gates and fail-fast thresholds.

---

## 7) Risk notes and trade-offs

- Forcing unconditional 95% Top-1 on all noisy open-world inputs is high risk and likely unstable.
- Safer production strategy: **95% precision on high-confidence auto path + top-3 fallback**.
- This minimizes bad auto-classifications while still improving user experience and compliance safety.

---

## 8) Next immediate actions

1. Implement Phase 0 metrics extension in `evaluate_lob_model.py`.
2. Start Phase 1 data generation focused on confusion pairs involving `FIN|Pawnshop` and wholesale/manufacturing overlap.
3. Run a first A/B training comparison (current model vs hybrid char+word features).
