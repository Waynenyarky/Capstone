#!/usr/bin/env python3
"""Generate a balanced bilingual LOB dataset.

Creates a synthetic-but-structured dataset with:
- exact N English flattened rows
- exact N Filipino flattened rows
- one recommendation per entry (so flattened rows == entries)

Usage:
  python3 ai/scripts/generate_balanced_bilingual_dataset.py \
    --target-per-language 2000 \
    --output ai/datasets/lob_recommendation_dataset_balanced_4000.json
"""

import argparse
import json
import os
import random
from collections import Counter, defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
DEFAULT_OUTPUT = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000.json")
DEFAULT_REPORT = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000_report.json")

EN_CUSTOMERS = [
    "nearby households",
    "students and workers",
    "local residents",
    "small businesses",
    "walk-in customers",
    "online buyers",
    "contract clients",
    "barangay communities",
]

FIL_CUSTOMERS = [
    "mga kapitbahay",
    "mga estudyante at empleyado",
    "mga residente sa barangay",
    "maliliit na negosyo",
    "walk-in na customer",
    "online na buyer",
    "mga kontratang kliyente",
    "komunidad sa bayan",
]

LOCATIONS = [
    "near the public market",
    "along the highway",
    "beside the school",
    "in a commercial area",
    "within the town proper",
    "near the transport terminal",
    "inside a mixed-use building",
    "close to residential communities",
]

FIL_LOCATIONS = [
    "malapit sa palengke",
    "sa tabi ng highway",
    "katabi ng paaralan",
    "sa commercial area",
    "sa sentro ng bayan",
    "malapit sa terminal",
    "sa loob ng mixed-use building",
    "malapit sa residential na komunidad",
]


def load_labels():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        taxonomy = json.load(f)

    labels = []
    for item in taxonomy:
        tax_code = item["taxCode"]
        lob = item["lineOfBusiness"]
        detailed_lines = item.get("detailedLines", [])
        psic_codes = item.get("psicCodes", [])
        for i, detailed_line in enumerate(detailed_lines):
            labels.append(
                {
                    "taxCode": tax_code,
                    "lineOfBusiness": lob,
                    "detailedLine": detailed_line,
                    "psicCode": psic_codes[i] if i < len(psic_codes) else "",
                }
            )
    labels.sort(key=lambda x: (x["taxCode"], x["detailedLine"]))
    return labels


def build_english_description(label, n, rng):
    detailed = label["detailedLine"]
    lob = label["lineOfBusiness"]
    customer = EN_CUSTOMERS[n % len(EN_CUSTOMERS)]
    location = LOCATIONS[(n // len(EN_CUSTOMERS)) % len(LOCATIONS)]
    phrase = [
        f"We operate a {detailed.lower()} business that serves {customer} {location}.",
        f"Our {lob} operation focuses on {detailed.lower()} offerings for {customer}.",
        f"The business provides {detailed.lower()} services and products with regular weekday and weekend operations.",
    ]
    rng.shuffle(phrase)
    return " ".join(phrase)


def build_filipino_description(label, n, rng):
    detailed = label["detailedLine"]
    lob = label["lineOfBusiness"]
    customer = FIL_CUSTOMERS[n % len(FIL_CUSTOMERS)]
    location = FIL_LOCATIONS[(n // len(FIL_CUSTOMERS)) % len(FIL_LOCATIONS)]
    phrase = [
        f"Nagpapatakbo kami ng negosyong {detailed.lower()} para sa {customer} {location}.",
        f"Ang aming {lob} na serbisyo ay nakatuon sa {detailed.lower()} para sa araw-araw na pangangailangan.",
        "May regular kaming operasyon tuwing weekdays at weekends para sa mabilis at maayos na serbisyo.",
    ]
    rng.shuffle(phrase)
    return " ".join(phrase)


def distribute_counts(total_per_language, label_count):
    base = total_per_language // label_count
    rem = total_per_language % label_count
    counts = [base] * label_count
    for i in range(rem):
        counts[i] += 1
    return counts


def generate_dataset(labels, target_per_language, seed=20260316, shuffle=True):
    rng = random.Random(seed)
    per_label_counts = distribute_counts(target_per_language, len(labels))

    rows = []
    seen_by_lang = defaultdict(set)

    for idx, label in enumerate(labels):
        needed = per_label_counts[idx]

        for i in range(needed):
            desc = build_english_description(label, i, rng)
            if desc in seen_by_lang["english"]:
                desc = f"{desc} Branch reference EN-{idx + 1:03d}-{i + 1:03d}."
            seen_by_lang["english"].add(desc)
            rows.append(
                {
                    "businessDescription": desc,
                    "language": "english",
                    "recommendations": [dict(label)],
                }
            )

        for i in range(needed):
            desc = build_filipino_description(label, i, rng)
            if desc in seen_by_lang["filipino"]:
                desc = f"{desc} Reference FIL-{idx + 1:03d}-{i + 1:03d}."
            seen_by_lang["filipino"].add(desc)
            rows.append(
                {
                    "businessDescription": desc,
                    "language": "filipino",
                    "recommendations": [dict(label)],
                }
            )

    if shuffle:
        rng.shuffle(rows)

    return rows


def summarize(rows):
    lang_counter = Counter()
    label_counter = Counter()

    for entry in rows:
        lang = (entry.get("language") or "unknown").lower().strip()
        for rec in entry.get("recommendations", []):
            tax = rec.get("taxCode", "")
            dl = rec.get("detailedLine", "")
            if not tax or not dl:
                continue
            label_counter[f"{tax}|{dl}"] += 1
            lang_counter[lang] += 1

    return {
        "totalEntries": len(rows),
        "flattenedRows": sum(label_counter.values()),
        "byLanguage": dict(lang_counter),
        "labelCount": len(label_counter),
        "minRowsPerLabel": min(label_counter.values()) if label_counter else 0,
        "maxRowsPerLabel": max(label_counter.values()) if label_counter else 0,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate balanced bilingual LOB dataset")
    parser.add_argument("--target-per-language", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=20260316)
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT)
    parser.add_argument("--report-json", type=str, default=DEFAULT_REPORT)
    parser.add_argument("--no-shuffle", action="store_true")
    args = parser.parse_args()

    if args.target_per_language < 1:
        raise SystemExit("--target-per-language must be >= 1")

    labels = load_labels()
    if not labels:
        raise SystemExit("No labels found in taxonomy")

    rows = generate_dataset(
        labels,
        target_per_language=args.target_per_language,
        seed=args.seed,
        shuffle=not args.no_shuffle,
    )

    summary = summarize(rows)
    expected_total = args.target_per_language * 2

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    report = {
        "targetPerLanguage": args.target_per_language,
        "expectedTotalFlattenedRows": expected_total,
        "taxonomyLabels": len(labels),
        "summary": summary,
        "notes": [
            "Each entry contains exactly one recommendation, so entries == flattened rows.",
            "Language is explicitly tagged as 'english' or 'filipino' to avoid mixed-bucket ambiguity.",
            "Synthetic dataset should be reviewed before production use.",
        ],
    }

    os.makedirs(os.path.dirname(args.report_json), exist_ok=True)
    with open(args.report_json, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Wrote dataset: {args.output}")
    print(f"Wrote report:  {args.report_json}")
    print(json.dumps(summary, indent=2))

    by_language = summary.get("byLanguage", {})
    if by_language.get("english", 0) != args.target_per_language:
        raise SystemExit("English count mismatch")
    if by_language.get("filipino", 0) != args.target_per_language:
        raise SystemExit("Filipino count mismatch")


if __name__ == "__main__":
    main()
