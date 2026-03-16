"""
Split the LOB recommendation dataset into fixed train/test files.

Splits at the ENTRY level (each businessDescription + recommendations is one
unit) so the same description never appears in both train and test.

Usage:
    python3 ai/scripts/split_lob_dataset.py [--dataset PATH] [--test-size 0.2] [--seed 42]

Outputs:
    ai/datasets/lob_recommendation_train.json
    ai/datasets/lob_recommendation_test.json
"""

import argparse
import json
import os
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
BALANCED_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000.json")
DEFAULT_DATASET = BALANCED_DATASET if os.path.exists(BALANCED_DATASET) else os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
DATASETS_DIR = os.path.join(AI_ROOT, "datasets")


def main():
    parser = argparse.ArgumentParser(description="Split LOB dataset into train/test")
    parser.add_argument("--dataset", type=str, default=DEFAULT_DATASET)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    with open(args.dataset, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} entries from {args.dataset}")

    random.seed(args.seed)
    indices = list(range(len(data)))
    random.shuffle(indices)

    split_idx = int(len(data) * (1 - args.test_size))
    train_indices = sorted(indices[:split_idx])
    test_indices = sorted(indices[split_idx:])

    train_data = [data[i] for i in train_indices]
    test_data = [data[i] for i in test_indices]

    train_path = os.path.join(DATASETS_DIR, "lob_recommendation_train.json")
    test_path = os.path.join(DATASETS_DIR, "lob_recommendation_test.json")

    with open(train_path, "w", encoding="utf-8") as f:
        json.dump(train_data, f, ensure_ascii=False, indent=2)

    with open(test_path, "w", encoding="utf-8") as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)

    # Count flattened rows per split
    def count_rows(entries):
        return sum(len(e.get("recommendations", [])) for e in entries)

    print(f"Train: {len(train_data)} entries ({count_rows(train_data)} flattened rows) -> {train_path}")
    print(f"Test:  {len(test_data)} entries ({count_rows(test_data)} flattened rows) -> {test_path}")
    print(f"Seed: {args.seed}, test size: {args.test_size}")


if __name__ == "__main__":
    main()
