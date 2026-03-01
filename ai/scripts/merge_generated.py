"""
Merge AI-generated batch files into the main LOB dataset.

Use this after the chat assistant (or another source) generates descriptions
in batch JSON files. Merges into the same file used by the pipeline and
by the prediction service (--retrain / LOB_RETRAIN_ON_START).

Usage:
  python3 ai/scripts/merge_generated.py batch1.json [batch2.json ...]
  python3 ai/scripts/merge_generated.py --dataset PATH batch1.json
  python3 ai/scripts/merge_generated.py --output PATH batch1.json  # write to different file
  python3 ai/scripts/merge_generated.py --no-dedupe batch1.json  # allow duplicate (desc, label) pairs

Default: appends to ai/datasets/lob_recommendation_dataset.json and skips
entries that would be exact (description, taxCode, detailedLine) duplicates.
"""

import argparse
import json
import os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")


def normalize_entry(entry):
    """Produce a set of (desc, taxCode, detailedLine) for dedupe."""
    desc = (entry.get("businessDescription") or "").strip()
    if not desc:
        return None
    out = set()
    for rec in entry.get("recommendations", []):
        tax = rec.get("taxCode", "")
        dl = rec.get("detailedLine", "")
        if tax and dl:
            out.add((desc, tax, dl))
    return (desc, out) if out else None


def main():
    parser = argparse.ArgumentParser(
        description="Merge generated batch JSON files into the main LOB dataset"
    )
    parser.add_argument(
        "batches",
        nargs="+",
        help="Paths to JSON files (each an array of { businessDescription, recommendations })",
    )
    parser.add_argument(
        "--dataset",
        default=DEFAULT_DATASET,
        help=f"Main dataset to merge into (default: {DEFAULT_DATASET})",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="If set, write merged result here instead of overwriting --dataset",
    )
    parser.add_argument(
        "--no-dedupe",
        action="store_true",
        help="Do not skip duplicate (description, taxCode, detailedLine) pairs",
    )
    args = parser.parse_args()

    out_path = args.output or args.dataset

    # Load main dataset
    if os.path.exists(args.dataset):
        with open(args.dataset, "r", encoding="utf-8") as f:
            dataset = json.load(f)
        if not isinstance(dataset, list):
            dataset = []
    else:
        dataset = []

    # Existing (desc, tax, detailedLine) for dedupe
    seen = set()
    if not args.no_dedupe:
        for entry in dataset:
            n = normalize_entry(entry)
            if n:
                _, pairs = n
                seen.update(pairs)

    added = 0
    skipped = 0

    for batch_path in args.batches:
        if not os.path.exists(batch_path):
            print(f"Skip (not found): {batch_path}")
            continue
        with open(batch_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            entries = raw
        elif isinstance(raw, dict) and "entries" in raw:
            entries = raw["entries"]
        else:
            entries = [raw]
        for entry in entries:
            if not isinstance(entry, dict) or "businessDescription" not in entry:
                continue
            recs = entry.get("recommendations", [])
            if not recs:
                continue
            if not args.no_dedupe:
                n = normalize_entry(entry)
                if not n:
                    continue
                _, new_pairs = n
                if new_pairs.issubset(seen):
                    skipped += 1
                    continue
                seen.update(new_pairs)
            dataset.append(entry)
            added += 1

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"Merged into {out_path}")
    print(f"  Added: {added}, Skipped (duplicate): {skipped}, Total entries: {len(dataset)}")
    if out_path == args.dataset and (added > 0 or not os.path.exists(args.dataset)):
        print("  This file is used by: run_lob_pipeline.sh, prediction service (--retrain), and seeder.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
