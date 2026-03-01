# LOB Dataset Quality Report

Quick check of `ai/datasets/lob_recommendation_dataset.json` (as of last run). Use this to judge whether the dataset is "good" for training and what to improve.

---

## 1. Coverage and balance

| Check | Result |
|-------|--------|
| **Taxonomy coverage** | 80/80 labels (100%) — no missing LOBs. |
| **Examples per label** | After bootstrap at target 10: every label has exactly 10 flattened rows (perfectly balanced). |
| **Total size** | 783 entries → 800 flattened rows (some entries have 2 LOBs). |

**Verdict:** Balance and coverage are good. Every LOB is represented and no label is under-represented.

---

## 2. Unique content (redundancy)

| Metric | Value |
|--------|--------|
| **Unique descriptions (exact text)** | 310 |
| **Flattened rows** | 800 |
| **Redundancy** | 800 − 310 = 490 rows are duplicate text (same description repeated, often with same label). |

So about **61%** of rows are exact duplicates of another row. That comes from:

- **Bootstrap:** The script copies and lightly rephrases (e.g. adds "We " or "Our business: ") to reach 10 per label. Many variations end up identical after normalization, or the same sentence is reused for the same label.
- **Multi-label entries:** The same description can appear in 2 rows (one per LOB); that's intentional and correct.

**Verdict:** The dataset is **redundant**. The model sees many repeated (description, label) pairs. Effective unique (text, label) diversity is closer to 310 than 800, so ~3–4 truly distinct descriptions per label on average. That's enough to train and get good metrics, but not as "rich" as 800 unique descriptions.

---

## 3. Contradictions (same text, different labels)

There are **32 descriptions** that appear with **more than one label**. Examples:

- "I own a sari-sari store but I also cook and sell rice meals..." → both `RET|Sari-sari store` and `FDS|Restaurant / eatery`
- "I have a salon and I also sell beauty products..." → both `SVC|Salon / barbershop` and `RET|General merchandise`

These are **intentional multi-LOB entries** (one business, multiple lines). They are **not** labeling errors. For training we flatten to one row per (description, label), so the model learns that the same text can map to multiple LOBs. That's valid.

**Verdict:** No problematic contradictions. Multi-label design is correct.

---

## 4. Description length and emptiness

| Check | Result |
|-------|--------|
| **Min length** | 45 characters |
| **Max length** | 114 characters |
| **Median length** | ~70 characters |
| **Very short (<20 chars)** | 0 |
| **Empty descriptions** | 0 (after trim) |

**Verdict:** Lengths are fine; no empty or too-short descriptions.

---

## 5. Near-duplicates (bootstrap artifact)

Using a simple normalized "core" (strip prefix, first 60 chars), only **2** cores appear more than 3 times. So the bootstrap did not create huge numbers of near-identical sentences; repetition is mostly exact duplicates (same string repeated).

**Verdict:** Low risk of overfitting to a few paraphrases. Main issue is exact duplication, not subtle near-duplicates.

---

## 6. Summary: is it a good dataset?

| Aspect | Good? | Note |
|--------|--------|------|
| **Coverage** | Yes | All 80 LOBs present, 10 examples each. |
| **Balance** | Yes | Perfectly balanced across labels. |
| **Uniqueness** | No | ~61% of rows are exact duplicates; effective diversity ~310 (text, label) pairs. |
| **Labels** | Yes | No bad contradictions; multi-label is intentional. |
| **Format / length** | Yes | No empty or too-short text; lengths reasonable. |

**Overall:** The dataset is **good for coverage and balance** and **fine for training** (model reaches ~91% Top-1). It is **not ideal** because much of it is duplicated text, so the model is not seeing as much real variety as the row count suggests. To improve quality:

1. **Add more unique, real descriptions** (Admin UI, CSV, or JSON) — especially for low-recall LOBs — so the proportion of non-duplicate rows goes up.
2. **Keep bootstrap for balance** if you want, but treat it as a way to hit a minimum count per label, not as a source of true diversity.
3. **Re-run the pipeline** after adding data and check evaluation metrics and this report again.

To regenerate this report, run the same checks (e.g. the Python snippet in the improvement plan or a small script that computes unique-description and redundancy stats).

---

## 7. Adding higher-quality descriptions (Option A: chat assistant)

You can add **AI-generated descriptions** (no external API) by having the chat assistant produce batch JSON files, then merging them into the main dataset.

**Workflow:**

1. **Request batches from the assistant**  
   Ask in chat: e.g. "Generate 5 new BPLO-style business descriptions for these LOBs: [list 10–15 labels from the taxonomy]." The assistant will reply with a JSON array of entries in the same format as the dataset (`businessDescription` + `recommendations` with `taxCode`, `lineOfBusiness`, `detailedLine`, `psicCode`).

2. **Save each batch**  
   Save the assistant’s JSON to a file under the dataset directory, e.g. `ai/datasets/generated_batch_1.json`. Use one file per batch (e.g. one file per 10–15 LOBs).

3. **Merge into the main dataset**  
   From the repo root:
   ```bash
   python3 ai/scripts/merge_generated.py ai/datasets/generated_batch_1.json
   ```
   To merge multiple batches:
   ```bash
   python3 ai/scripts/merge_generated.py ai/datasets/generated_batch_1.json ai/datasets/generated_batch_2.json
   ```
   By default, the script appends to `ai/datasets/lob_recommendation_dataset.json` and skips exact (description, taxCode, detailedLine) duplicates. Use `--output PATH` to write to a different file; use `--no-dedupe` to allow duplicates.

4. **Re-run pipeline and (optional) quality check**  
   ```bash
   ./ai/scripts/run_lob_pipeline.sh
   ```
   Then re-run any quality script to see updated redundancy and metrics.

**Where this dataset is used**

The file `ai/datasets/lob_recommendation_dataset.json` (the default merge target) is the **single source** used by:

- **Pipeline:** `./ai/scripts/run_lob_pipeline.sh` — split, train, and evaluate all read from this file (split uses it to produce train/test).
- **Prediction service with retrain:** When you start the LOB model service with `--retrain` (or `LOB_RETRAIN_ON_START=1`), it retrains from this same file before serving. So after you merge new descriptions and run `./start.sh --retrain`, the website’s LOB recommendations use the updated model trained on the merged dataset.
- **Seeder:** The business-service seeder loads LOB training examples from this file (or `LOB_DATASET_PATH`) when the collection is empty.

So any descriptions you add via Option A and merge into that file **are** used by the website once you run the pipeline (or start with `--retrain`).
