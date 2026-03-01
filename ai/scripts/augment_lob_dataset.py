"""
Augment the LOB recommendation dataset for under-represented classes using
Google Generative AI (Gemini).

For each label below the threshold, generates new synthetic business
descriptions using Gemini, then writes them to a separate file for HUMAN
REVIEW before merging into the main dataset.

Usage:
    python3 ai/scripts/augment_lob_dataset.py [--dataset PATH] [--threshold 3] [--target 5]

Requires:
    GEMINI_API_KEY environment variable set.

Output:
    ai/datasets/lob_recommendation_augmented.json

IMPORTANT: The output file MUST be reviewed by a human before merging.
           Some generated descriptions may be incorrect or low quality.
"""

import argparse
import json
import os
import sys
import time
from collections import Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
OUTPUT_PATH = os.path.join(AI_ROOT, "datasets", "lob_recommendation_augmented.json")


def flatten_labels(dataset):
    counts = Counter()
    examples_by_label = {}
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
                if label not in examples_by_label:
                    examples_by_label[label] = []
                examples_by_label[label].append(desc)
    return counts, examples_by_label


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


def generate_descriptions(api_key, label, info, existing_examples, count_needed):
    """Call Gemini to generate synthetic business descriptions for a given LOB."""
    try:
        import google.generativeai as genai
    except ImportError:
        print("  ERROR: google-generativeai package not installed. Run: pip3 install google-generativeai")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    examples_text = "\n".join(f"  - {ex}" for ex in existing_examples[:3])
    if not examples_text:
        examples_text = "  (no existing examples)"

    prompt = f"""Generate {count_needed} diverse business descriptions for a Filipino business that would be classified under:
- Tax Code: {info['taxCode']}
- Line of Business: {info['lineOfBusiness']}
- Detailed Line: {info['detailedLine']}

Existing examples:
{examples_text}

Requirements:
- Mix of English and Filipino (Tagalog) descriptions
- Each description should be 1-3 sentences, realistic for a Philippine LGU business permit application
- Describe what the business sells or does, not the classification itself
- Make each description unique and different from the examples
- Return ONLY a JSON array of strings, no other text

Example output format:
["description one", "description two", "description three"]"""

    try:
        result = model.generate_content(prompt)
        text = result.text.strip()
        json_match = text
        if text.startswith("```"):
            lines = text.split("\n")
            json_match = "\n".join(lines[1:-1])
        parsed = json.loads(json_match)
        if isinstance(parsed, list):
            return [d for d in parsed if isinstance(d, str) and len(d.strip()) >= 10]
    except Exception as e:
        print(f"  Gemini error for {label}: {e}")
    return []


def main():
    parser = argparse.ArgumentParser(description="Augment LOB dataset with Gemini-generated descriptions")
    parser.add_argument("--dataset", type=str, default=DEFAULT_DATASET)
    parser.add_argument("--threshold", type=int, default=3)
    parser.add_argument("--target", type=int, default=5, help="Target examples per label")
    parser.add_argument("--dry-run", action="store_true", help="List what would be generated without calling Gemini")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key and not args.dry_run:
        print("ERROR: GEMINI_API_KEY environment variable is required (or use --dry-run).")
        return 1

    with open(args.dataset, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    counts, examples_by_label = flatten_labels(dataset)
    label_info = load_taxonomy()

    needs_augmentation = []
    for label, info in label_info.items():
        current = counts.get(label, 0)
        if current < args.threshold:
            needed = args.target - current
            needs_augmentation.append((label, info, current, needed))

    print(f"Labels needing augmentation: {len(needs_augmentation)}")
    print(f"Target: {args.target} examples per label\n")

    if args.dry_run:
        total_needed = 0
        for label, info, current, needed in needs_augmentation:
            print(f"  {label}: has {current}, need {needed} more")
            total_needed += needed
        print(f"\nTotal descriptions to generate: {total_needed}")
        print("Run without --dry-run to actually generate (requires GEMINI_API_KEY).")
        return 0

    augmented_entries = []
    total_generated = 0

    for i, (label, info, current, needed) in enumerate(needs_augmentation):
        existing = examples_by_label.get(label, [])
        print(f"[{i+1}/{len(needs_augmentation)}] {label} (has {current}, generating {needed})...")

        descriptions = generate_descriptions(api_key, label, info, existing, needed)

        for desc in descriptions:
            augmented_entries.append({
                "businessDescription": desc.strip(),
                "recommendations": [{
                    "taxCode": info["taxCode"],
                    "lineOfBusiness": info["lineOfBusiness"],
                    "detailedLine": info["detailedLine"],
                    "psicCode": info["psicCode"],
                }],
                "_augmented": True,
                "_sourceLabel": label,
            })
            total_generated += 1

        # Rate limiting
        if i < len(needs_augmentation) - 1:
            time.sleep(1)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(augmented_entries, f, ensure_ascii=False, indent=2)

    print(f"\nGenerated {total_generated} new entries -> {OUTPUT_PATH}")
    print("\n*** IMPORTANT: Review the output file before merging! ***")
    print("Some descriptions may be incorrect or low quality.")
    print(f"\nTo merge into the main dataset after review:")
    print(f"  1. Open {OUTPUT_PATH} and remove any bad entries")
    print(f"  2. Append the reviewed entries to {args.dataset}")
    print(f"  3. Re-run: python3 ai/scripts/split_lob_dataset.py")
    print(f"  4. Re-run: python3 ai/scripts/train_lob_model.py")
    print(f"  5. Re-run: python3 ai/scripts/evaluate_lob_model.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
