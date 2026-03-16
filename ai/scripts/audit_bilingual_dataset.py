#!/usr/bin/env python3
"""Audit bilingual balance in a LOB dataset.

Counts flattened rows by language using explicit `language` field when present.
If language field is missing, applies a conservative heuristic classifier.
"""

import argparse
import json
import os
import re
from collections import Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
BALANCED_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000.json")
DEFAULT_DATASET = BALANCED_DATASET if os.path.exists(BALANCED_DATASET) else os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")

FILIPINO_MARKERS = {
    "ang", "mga", "ng", "sa", "at", "kami", "ako", "para", "may", "nagtitinda",
    "nagbebenta", "tindahan", "karinderia", "serbisyo", "nagluluto", "gamit", "bahay",
    "negosyo", "nagpapatakbo", "palengke", "barangay", "kliyente", "pamilya", "paaralan",
}

ENGLISH_MARKERS = {
    "we", "our", "business", "services", "store", "customers", "products", "operations",
    "retail", "offers", "provides", "near", "market", "school", "community", "company",
}


def infer_language(desc):
    text = desc.lower()

    def score(markers):
        return sum(1 for w in markers if re.search(rf"(^|[^a-z]){re.escape(w)}([^a-z]|$)", text))

    fil_score = score(FILIPINO_MARKERS)
    en_score = score(ENGLISH_MARKERS)

    if fil_score >= en_score + 2:
        return "filipino"
    if en_score >= fil_score + 2:
        return "english"
    return "mixed"


def main():
    parser = argparse.ArgumentParser(description="Audit bilingual counts in LOB dataset")
    parser.add_argument("--dataset", type=str, default=DEFAULT_DATASET)
    parser.add_argument("--show-labels", action="store_true")
    args = parser.parse_args()

    with open(args.dataset, "r", encoding="utf-8") as f:
        data = json.load(f)

    lang_counts = Counter()
    label_lang_counts = Counter()
    rows = 0

    for entry in data:
        desc = (entry.get("businessDescription") or "").strip()
        if not desc:
            continue

        declared = (entry.get("language") or "").strip().lower()
        lang = declared if declared in {"english", "filipino", "mixed"} else infer_language(desc)

        for rec in entry.get("recommendations", []):
            tax = (rec.get("taxCode") or "").strip()
            dl = (rec.get("detailedLine") or "").strip()
            if not tax or not dl:
                continue
            rows += 1
            lang_counts[lang] += 1
            label_lang_counts[(f"{tax}|{dl}", lang)] += 1

    print(f"Dataset: {args.dataset}")
    print(f"Flattened rows: {rows}")
    print(f"English:  {lang_counts['english']}")
    print(f"Filipino: {lang_counts['filipino']}")
    print(f"Mixed:    {lang_counts['mixed']}")

    if args.show_labels:
        print("\nPer-label language rows:")
        labels = sorted({k[0] for k in label_lang_counts})
        for label in labels:
            en = label_lang_counts[(label, "english")]
            fil = label_lang_counts[(label, "filipino")]
            mix = label_lang_counts[(label, "mixed")]
            print(f"- {label}: EN={en}, FIL={fil}, MIX={mix}")


if __name__ == "__main__":
    main()
