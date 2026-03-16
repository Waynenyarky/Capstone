"""
Audit the LOB recommendation dataset for under-represented classes.

Loads the full dataset and the taxonomy, counts examples per label
(taxCode|detailedLine), and reports classes below a configurable threshold.

Usage:
    python3 ai/scripts/audit_lob_dataset.py [--dataset PATH] [--threshold 5]

Note: Default threshold is 5 because the training pipeline uses 5-fold
stratified CV for model selection; with at least 5 examples per label, every
class can participate in CV. Fewer than 5 still trains but CV is limited or
excludes some classes. "10+" is a practical target for more stable estimates,
not a rule from a single source.

Output: A table showing every LOB label with its current count and whether it
needs more examples. Labels with zero examples (exist in taxonomy but not in
dataset) are also listed.
"""

import argparse
import json
import os
import sys
from collections import Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
BALANCED_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000.json")
DEFAULT_DATASET = BALANCED_DATASET if os.path.exists(BALANCED_DATASET) else os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")


def flatten_dataset(dataset):
    rows = []
    for entry in dataset:
        desc = entry.get("businessDescription", "").strip()
        if not desc:
            continue
        for rec in entry.get("recommendations", []):
            tax = rec.get("taxCode", "")
            dl = rec.get("detailedLine", "")
            if tax and dl:
                rows.append(f"{tax}|{dl}")
    return rows


def load_taxonomy():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        taxonomy = json.load(f)
    all_labels = []
    for entry in taxonomy:
        tc = entry["taxCode"]
        for dl in entry["detailedLines"]:
            all_labels.append(f"{tc}|{dl}")
    return all_labels


def main():
    parser = argparse.ArgumentParser(description="Audit LOB dataset for under-represented classes")
    parser.add_argument("--dataset", type=str, default=DEFAULT_DATASET)
    parser.add_argument("--threshold", type=int, default=5,
                        help="Minimum examples per label to count as adequate. 5 = all classes can join 5-fold CV in train script (default: 5)")
    args = parser.parse_args()

    with open(args.dataset, "r", encoding="utf-8") as f:
        raw = json.load(f)

    labels = flatten_dataset(raw)
    counts = Counter(labels)
    taxonomy_labels = load_taxonomy()

    print(f"Dataset: {args.dataset}")
    print(f"Total entries: {len(raw)}, flattened rows: {len(labels)}")
    print(f"Unique labels in dataset: {len(counts)}")
    print(f"Total labels in taxonomy: {len(taxonomy_labels)}")
    print(f"Threshold: >= {args.threshold} examples\n")

    missing = []
    below = []
    adequate = []

    for label in taxonomy_labels:
        c = counts.get(label, 0)
        if c == 0:
            missing.append((label, c))
        elif c < args.threshold:
            below.append((label, c))
        else:
            adequate.append((label, c))

    # Extra labels in dataset but not in taxonomy
    extra = [(l, c) for l, c in counts.items() if l not in set(taxonomy_labels)]

    print(f"=== MISSING from dataset ({len(missing)} labels with 0 examples) ===")
    for label, c in sorted(missing):
        print(f"  {label}")

    print(f"\n=== BELOW threshold ({len(below)} labels with 1–{args.threshold - 1} examples) ===")
    for label, c in sorted(below, key=lambda x: x[1]):
        print(f"  {c}  {label}")

    print(f"\n=== ADEQUATE ({len(adequate)} labels with >= {args.threshold} examples) ===")
    for label, c in sorted(adequate, key=lambda x: -x[1]):
        print(f"  {c}  {label}")

    if extra:
        print(f"\n=== IN DATASET but NOT in taxonomy ({len(extra)} labels) ===")
        for label, c in sorted(extra):
            print(f"  {c}  {label}")

    # Summary
    total_taxonomy = len(taxonomy_labels)
    covered = total_taxonomy - len(missing)
    print(f"\n--- Summary ---")
    print(f"  Taxonomy coverage: {covered}/{total_taxonomy} ({covered / total_taxonomy:.0%})")
    print(f"  Missing:           {len(missing)} (need at least 1 example each)")
    print(f"  Below threshold:   {len(below)} (need more examples to reach >= {args.threshold})")
    print(f"  Adequate:          {len(adequate)} (>= {args.threshold} examples)")
    print(f"  Target: get every label to >= {args.threshold} examples (5 allows full 5-fold CV in training; more data generally helps).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
