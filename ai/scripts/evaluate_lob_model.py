"""
Evaluate the trained LOB recommendation model on held-out data.

Uses ai/datasets/lob_recommendation_test.json (from the split script) as a
fixed unseen test set by default.

Usage:
    python3 ai/scripts/evaluate_lob_model.py [--dataset PATH]

Metrics:
  - Accuracy (Top-1): % of test rows where the model's single best guess is correct.
  - Precision (macro/weighted): fraction of predicted positives that are correct.
  - Recall (macro/weighted): fraction of actual positives that were predicted.
  - F1 (macro/weighted): harmonic mean of precision and recall.
  - Top-3/Top-5 accuracy: % where the correct LOB appears in top-N suggestions.
  - Per-class recall: which LOBs the model misses most.
"""

import argparse
import json
import os
import sys
from collections import defaultdict

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from train_lob_model import normalize_text

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TEST_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_test.json")
FULL_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
MODELS_DIR = os.path.join(AI_ROOT, "models")


def flatten_dataset(dataset):
    rows = []
    for entry in dataset:
        desc = normalize_text(entry.get("businessDescription", ""))
        if not desc:
            continue
        for rec in entry.get("recommendations", []):
            tax = rec.get("taxCode", "")
            dl = rec.get("detailedLine", "")
            if tax and dl:
                rows.append({"text": desc, "label": f"{tax}|{dl}"})
    return rows


def summarize_confidence_gates(y_true_idx, pred_idx, top_probs, thresholds=None):
    """Compute precision/coverage tradeoff for confidence-gated top-1 predictions."""
    if thresholds is None:
        thresholds = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 0.95]

    n = len(y_true_idx)
    rows = []
    for t in thresholds:
        keep = top_probs >= t
        kept = int(np.sum(keep))
        coverage = kept / n if n else 0.0
        if kept:
            precision_at_t = float(np.mean(pred_idx[keep] == y_true_idx[keep]))
        else:
            precision_at_t = None
        rows.append({
            "threshold": t,
            "coverage": coverage,
            "precision": precision_at_t,
            "kept": kept,
        })

    qualified = [r for r in rows if r["precision"] is not None and r["precision"] >= 0.95]
    recommended = max(qualified, key=lambda r: (r["coverage"], -r["threshold"])) if qualified else None
    return rows, recommended


def main():
    parser = argparse.ArgumentParser(description="Evaluate LOB model on held-out data")
    parser.add_argument("--dataset", type=str, default=None,
                        help="Path to test dataset JSON. Defaults to lob_recommendation_test.json if it exists.")
    parser.add_argument("--output-json", type=str, default=None,
                        help="If set, write metrics to this JSON file (e.g. ai/models/evaluation_metrics.json)")
    args = parser.parse_args()

    # Determine test dataset: explicit arg > fixed test file
    if args.dataset:
        ds_path = args.dataset
        using_fixed_test = False
    elif os.path.exists(TEST_DATASET):
        ds_path = TEST_DATASET
        using_fixed_test = True
    else:
        print("ERROR: No fixed test set found at ai/datasets/lob_recommendation_test.json")
        print("       Run split_lob_dataset.py first to create a proper train/test split.\n")
        return 1

    if not os.path.exists(ds_path):
        print(f"Dataset not found: {ds_path}")
        return 1

    vec_path = os.path.join(MODELS_DIR, "lob_vectorizer.joblib")
    model_path = os.path.join(MODELS_DIR, "lob_model.joblib")
    labels_path = os.path.join(MODELS_DIR, "lob_labels.json")
    for p in [vec_path, model_path, labels_path]:
        if not os.path.exists(p):
            print(f"Model artifact not found: {p}. Train first with train_lob_model.py")
            return 1

    print(f"Loading model and test data from {ds_path}")
    if using_fixed_test:
        print("(Using fixed test set — these metrics are on data the model has never seen.)\n")

    with open(ds_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    rows = flatten_dataset(raw)

    if len(rows) < 5:
        print(f"Only {len(rows)} test rows — need at least 5 for meaningful evaluation.")
        return 1

    vectorizer = joblib.load(vec_path)
    model = joblib.load(model_path)
    with open(labels_path, "r", encoding="utf-8") as f:
        label_list = json.load(f)
    label_to_idx = {l: i for i, l in enumerate(label_list)}

    texts = [r["text"] for r in rows]
    labels_arr = [r["label"] for r in rows]

    # Filter to labels that are in the model's vocabulary
    valid = [(t, l) for t, l in zip(texts, labels_arr) if l in label_to_idx]
    if not valid:
        print("No test samples with labels in model vocabulary.")
        return 1
    skipped = len(texts) - len(valid)
    if skipped > 0:
        print(f"  Skipped {skipped} rows with labels not in model vocabulary.")
    X_test, y_test = zip(*valid)
    X_test = list(X_test)
    y_test = list(y_test)

    X_test_vec = vectorizer.transform(X_test)
    y_true_idx = np.array([label_to_idx[l] for l in y_test])

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_test_vec)
        pred_idx = np.argmax(proba, axis=1)
    else:
        pred_labels = model.predict(X_test_vec)
        pred_idx = np.array([
            label_to_idx[l] if l in label_to_idx else label_to_idx.get(str(l), 0)
            for l in pred_labels
        ])

    acc1 = accuracy_score(y_true_idx, pred_idx)
    acc3 = acc5 = None  # set below if model has predict_proba
    confidence_gate_rows = []
    confidence_gate_recommended = None
    print(f"--- Test results (n={len(y_test)} rows) ---\n")
    print(f"Top-1 accuracy: {acc1:.2%}")
    print("  (Fraction of test rows where the model's single best guess is correct.)")

    if hasattr(model, "predict_proba"):
        top3_correct = 0
        top5_correct = 0
        for i in range(len(y_true_idx)):
            probs = model.predict_proba(X_test_vec[i : i + 1])[0]
            sorted_idx = np.argsort(probs)[::-1]
            if y_true_idx[i] in set(sorted_idx[:3].tolist()):
                top3_correct += 1
            if y_true_idx[i] in set(sorted_idx[:5].tolist()):
                top5_correct += 1
        acc3 = top3_correct / len(y_true_idx)
        acc5 = top5_correct / len(y_true_idx)
        print(f"Top-3 accuracy: {acc3:.2%}")
        print(f"Top-5 accuracy: {acc5:.2%}")
        print("  (Fraction where the correct LOB appears in top-N suggestions.)")

        top_probs = np.max(proba, axis=1)
        confidence_gate_rows, confidence_gate_recommended = summarize_confidence_gates(
            y_true_idx, pred_idx, top_probs
        )
        print("\n--- Confidence-gated Top-1 (precision vs coverage) ---")
        for row in confidence_gate_rows:
            p = "n/a" if row["precision"] is None else f"{row['precision']:.1%}"
            print(
                f"  threshold>={row['threshold']:.2f}  precision={p}  coverage={row['coverage']:.1%}  kept={row['kept']}"
            )
        if confidence_gate_recommended:
            print(
                f"  Recommended 95%-precision gate: >= {confidence_gate_recommended['threshold']:.2f} "
                f"(coverage {confidence_gate_recommended['coverage']:.1%})"
            )
        else:
            print("  No threshold reached >=95% precision on this evaluation set.")

    try:
        f1_macro = f1_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        )
        f1_weighted = f1_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        )
        print(f"Macro F1:       {f1_macro:.4f}")
        print(f"Weighted F1:    {f1_weighted:.4f}")
        print("  (Macro = each class equal weight; Weighted = by class frequency.)")
    except Exception:
        f1_macro = 0
        f1_weighted = 0
        print("F1:             (could not compute)")

    try:
        precision_macro = precision_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        )
        precision_weighted = precision_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        )
        recall_macro = recall_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        )
        recall_weighted = recall_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        )
        print(f"Precision (macro):   {precision_macro:.4f}")
        print(f"Precision (weighted): {precision_weighted:.4f}")
        print(f"Recall (macro):      {recall_macro:.4f}")
        print(f"Recall (weighted):   {recall_weighted:.4f}")
    except Exception:
        precision_macro = precision_weighted = recall_macro = recall_weighted = 0
        print("Precision/Recall: (could not compute)")

    print("\n--- Per-class recall (which LOBs the model misses most) ---")
    recall_by_label = defaultdict(lambda: {"correct": 0, "total": 0})
    for i, true_idx in enumerate(y_true_idx):
        rec = recall_by_label[true_idx]
        rec["total"] += 1
        if pred_idx[i] == true_idx:
            rec["correct"] += 1
    recalls = []
    for idx, rec in recall_by_label.items():
        r = rec["correct"] / rec["total"] if rec["total"] else 0
        recalls.append((label_list[idx], r, rec["total"]))
    recalls.sort(key=lambda x: (x[1], -x[2]))
    print("Lowest recall (add more training examples for these):")
    for label, rec, count in recalls[:15]:
        print(f"  {rec:.0%}  ({count} test)  {label}")
    if len(recalls) > 15:
        print(f"  ... ({len(recalls) - 15} more with 100% recall)")

    print("\n--- Summary ---")
    print(f"  Accuracy (Top-1): {acc1:.1%}")
    print(f"  Precision (macro): {precision_macro:.4f}  Recall (macro): {recall_macro:.4f}  F1 (macro): {f1_macro:.4f}")
    if hasattr(model, "predict_proba"):
        print(f"  Top-3 accuracy {acc3:.1%}, top-5 {acc5:.1%} — correct LOB usually in the list.")
    print("  Use 'Per-class recall' to see which LOBs to add more examples for.")

    if args.output_json:
        os.makedirs(os.path.dirname(args.output_json) or ".", exist_ok=True)
        metrics = {
            "accuracyTop1": float(acc1),
            "accuracyTop3": float(acc3) if acc3 is not None else None,
            "accuracyTop5": float(acc5) if acc5 is not None else None,
            "precisionMacro": float(precision_macro),
            "precisionWeighted": float(precision_weighted),
            "recallMacro": float(recall_macro),
            "recallWeighted": float(recall_weighted),
            "macroF1": float(f1_macro),
            "weightedF1": float(f1_weighted),
            "testRows": len(y_test),
            "confidenceGates": confidence_gate_rows,
            "recommended95PrecisionGate": confidence_gate_recommended,
        }
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)
        print(f"\nMetrics written to {args.output_json}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
