"""
Bootstrap the LOB dataset so every label has at least TARGET examples by
duplicating and lightly varying existing entries. No API key required.

Usage:
    python3 ai/scripts/bootstrap_lob_dataset.py [--dataset PATH] [--target 5] [--output PATH]

Output:
    By default writes to ai/datasets/lob_recommendation_dataset_bootstrapped.json
    so the original dataset is unchanged. Use --output to override.
"""

import argparse
import json
import os
import random
from collections import Counter, defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
DEFAULT_OUTPUT = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_bootstrapped.json")


def load_taxonomy():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        taxonomy = json.load(f)
    label_info = {}
    for entry in taxonomy:
        tc = entry["taxCode"]
        lob = entry["lineOfBusiness"]
        for i, dl in enumerate(entry["detailedLines"]):
            psic = entry["psicCodes"][i] if i < len(entry["psicCodes"]) else ""
            label_info[f"{tc}|{dl}"] = {
                "taxCode": tc,
                "lineOfBusiness": lob,
                "detailedLine": dl,
                "psicCode": psic,
            }
    return label_info


def flatten_labels_and_examples(dataset):
    """Return (count per label, list of (description, rec_dict) per label)."""
    counts = Counter()
    examples_by_label = defaultdict(list)
    for entry in dataset:
        desc = entry.get("businessDescription", "").strip()
        if not desc:
            continue
        for rec in entry.get("recommendations", []):
            tax = rec.get("taxCode", "")
            dl = rec.get("detailedLine", "")
            if tax and dl:
                label = f"{tax}|{dl}"
                counts[label] += 1
                rec_copy = {k: rec[k] for k in ("taxCode", "lineOfBusiness", "detailedLine", "psicCode") if k in rec}
                examples_by_label[label].append((desc, rec_copy))
    return counts, dict(examples_by_label)


def vary_description(text, seed=None):
    """Light variation so TF-IDF sees a different string; keeps same meaning."""
    if seed is not None:
        random.seed(seed)
    prefixes = ("", "We ", "Our business: ", "I ")
    suffix = "." if text and not text.rstrip().endswith(".") else ""
    p = random.choice(prefixes)
    if p and (text.startswith("I ") or text.startswith("We ") or text.startswith("May ") or text.startswith("Nag")):
        return text + suffix  # already has a subject
    if p:
        return p.rstrip() + " " + text.lstrip() + suffix
    return text + suffix


def main():
    parser = argparse.ArgumentParser(description="Bootstrap LOB dataset to meet minimum examples per label")
    parser.add_argument("--dataset", type=str, default=DEFAULT_DATASET)
    parser.add_argument("--target", type=int, default=5)
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    with open(args.dataset, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    counts, examples_by_label = flatten_labels_and_examples(dataset)
    label_info = load_taxonomy()

    # Collect all new entries to append (no duplicates of originals; we only add synthetic)
    new_entries = []
    for label, info in label_info.items():
        current = counts.get(label, 0)
        if current >= args.target:
            continue
        needed = args.target - current
        examples = examples_by_label.get(label, [])
        if not examples:
            continue
        for i in range(needed):
            desc, rec = examples[i % len(examples)]
            new_desc = vary_description(desc, seed=hash(label + str(i)) % (2 ** 32))
            new_entries.append({
                "businessDescription": new_desc,
                "recommendations": [dict(rec)],
            })

    out_data = dataset + new_entries
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    new_counts, _ = flatten_labels_and_examples(out_data)
    below = sum(1 for l in label_info if new_counts.get(l, 0) < args.target)
    print(f"Original entries: {len(dataset)}, added: {len(new_entries)}, total: {len(out_data)}")
    print(f"Labels still below {args.target}: {below}")
    print(f"Written to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
