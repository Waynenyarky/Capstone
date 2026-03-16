#!/usr/bin/env python3
"""
Run a real-world-ish stress test for LOB model robustness.

Stress profile:
- code-switching (English <-> Filipino keyword replacements)
- light typo noise
- colloquial phrase injection

Outputs:
- ai/models/realworldish_typo_codeswitch_metrics.json
- ai/models/realworldish_typo_codeswitch_top_confusions.json
"""

import glob
import json
import os
import random
import re
from typing import Dict, List

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from train_lob_model import normalize_text

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
DATASET_GLOB = os.path.join(AI_ROOT, "datasets", "generated_batch_*_low_recall.json")
REALWORLD_HOLDOUT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_realworld_holdout.json")
MODELS_DIR = os.path.join(AI_ROOT, "models")

METRICS_OUT = os.path.join(MODELS_DIR, "realworldish_typo_codeswitch_metrics.json")
CONFUSIONS_OUT = os.path.join(MODELS_DIR, "realworldish_typo_codeswitch_top_confusions.json")

EN_TO_TL = {
    "store": "tindahan",
    "delivery": "hatid",
    "restaurant": "kainan",
    "eatery": "karinderia",
    "bakery": "panaderya",
    "clothing": "damit",
    "pharmacy": "botika",
    "warehouse": "bodega",
    "lending": "pautang",
    "loan": "utang",
    "services": "serbisyo",
    "construction": "konstruksyon",
    "farm": "bukid",
    "office": "opisina",
    "clinic": "klinika",
}

TL_TO_EN = {
    "tindahan": "store",
    "kainan": "restaurant",
    "karinderia": "eatery",
    "botika": "pharmacy",
    "sanglaan": "pawnshop",
    "nagbebenta": "selling",
    "nagde-deliver": "delivery",
    "nagpapautang": "lending",
    "bukid": "farm",
    "gulay": "vegetables",
    "bigas": "rice",
    "kape": "coffee",
    "gupit": "haircut",
}

FILLERS = [" po", " naman", " sa may bayan", " near palengke", " sa barangay"]


def load_rows() -> List[dict]:
    if os.path.exists(REALWORLD_HOLDOUT_DATASET):
        with open(REALWORLD_HOLDOUT_DATASET, "r", encoding="utf-8") as f:
            return json.load(f)

    rows: List[dict] = []
    for path in sorted(glob.glob(DATASET_GLOB)):
        with open(path, "r", encoding="utf-8") as f:
            rows.extend(json.load(f))
    return rows


def typo_token(token: str) -> str:
    if len(token) < 4 or any(ch.isdigit() for ch in token):
        return token

    r = random.random()
    if r < 0.33 and len(token) >= 5:
        i = random.randint(1, len(token) - 2)
        return token[:i] + token[i + 1 :]

    if r < 0.66 and len(token) >= 5:
        i = random.randint(1, len(token) - 2)
        chars = list(token)
        chars[i], chars[i + 1] = chars[i + 1], chars[i]
        return "".join(chars)

    return re.sub(r"[aeiouAEIOU]", lambda _: random.choice("aeiou"), token, count=1)


def mutate_text(text: str) -> str:
    out = text

    for source, dest in EN_TO_TL.items():
        if re.search(rf"\b{re.escape(source)}\b", out, flags=re.IGNORECASE) and random.random() < 0.45:
            out = re.sub(rf"\b{re.escape(source)}\b", dest, out, flags=re.IGNORECASE)

    for source, dest in TL_TO_EN.items():
        if re.search(rf"\b{re.escape(source)}\b", out, flags=re.IGNORECASE) and random.random() < 0.35:
            out = re.sub(rf"\b{re.escape(source)}\b", dest, out, flags=re.IGNORECASE)

    if random.random() < 0.6:
        out = out.rstrip(". ") + random.choice(FILLERS) + "."

    tokens = re.split(r"(\s+)", out)
    for i, token in enumerate(tokens):
        if token.strip() and token.isalpha() and random.random() < 0.22:
            tokens[i] = typo_token(token)

    out = "".join(tokens)
    out = out.replace(";", ",").replace("—", "-").replace("  ", " ")
    return normalize_text(out.strip())


def evaluate() -> Dict[str, float]:
    random.seed(42)

    vec_path = os.path.join(MODELS_DIR, "lob_vectorizer.joblib")
    model_path = os.path.join(MODELS_DIR, "lob_model.joblib")
    labels_path = os.path.join(MODELS_DIR, "lob_labels.json")

    vectorizer = joblib.load(vec_path)
    model = joblib.load(model_path)
    with open(labels_path, "r", encoding="utf-8") as f:
        label_list = json.load(f)

    label_to_idx = {label: idx for idx, label in enumerate(label_list)}

    rows = load_rows()
    texts: List[str] = []
    y_true: List[int] = []

    for entry in rows:
        desc = mutate_text(entry.get("businessDescription", ""))
        if not desc:
            continue

        for rec in entry.get("recommendations", []):
            label = f"{rec.get('taxCode', '')}|{rec.get('detailedLine', '')}"
            if label in label_to_idx:
                texts.append(desc)
                y_true.append(label_to_idx[label])

    X = vectorizer.transform(texts)
    y_true_np = np.array(y_true)

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        y_pred_np = np.argmax(proba, axis=1)
        acc3 = float(np.mean([y_true_np[i] in np.argsort(proba[i])[::-1][:3] for i in range(len(y_true_np))]))
        acc5 = float(np.mean([y_true_np[i] in np.argsort(proba[i])[::-1][:5] for i in range(len(y_true_np))]))
    else:
        pred_labels = model.predict(X)
        y_pred_np = np.array([label_to_idx.get(str(v), 0) for v in pred_labels])
        acc3 = None
        acc5 = None

    metrics = {
        "accuracyTop1": float(accuracy_score(y_true_np, y_pred_np)),
        "accuracyTop3": acc3,
        "accuracyTop5": acc5,
        "precisionMacro": float(precision_score(y_true_np, y_pred_np, average="macro", zero_division=0, labels=np.arange(len(label_list)))),
        "precisionWeighted": float(precision_score(y_true_np, y_pred_np, average="weighted", zero_division=0)),
        "recallMacro": float(recall_score(y_true_np, y_pred_np, average="macro", zero_division=0, labels=np.arange(len(label_list)))),
        "recallWeighted": float(recall_score(y_true_np, y_pred_np, average="weighted", zero_division=0)),
        "macroF1": float(f1_score(y_true_np, y_pred_np, average="macro", zero_division=0, labels=np.arange(len(label_list)))),
        "weightedF1": float(f1_score(y_true_np, y_pred_np, average="weighted", zero_division=0)),
        "testRows": int(len(y_true_np)),
    }

    seen = np.unique(y_true_np)
    cm = confusion_matrix(y_true_np, y_pred_np, labels=seen)
    confusions = []
    for i, true_idx in enumerate(seen):
        for j, pred_idx in enumerate(seen):
            if i == j:
                continue
            count = int(cm[i][j])
            if count > 0:
                confusions.append(
                    {
                        "true": label_list[int(true_idx)],
                        "pred": label_list[int(pred_idx)],
                        "count": count,
                    }
                )

    confusions.sort(key=lambda x: x["count"], reverse=True)

    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(METRICS_OUT, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    with open(CONFUSIONS_OUT, "w", encoding="utf-8") as f:
        json.dump(confusions[:30], f, indent=2)

    return metrics


def main() -> int:
    metrics = evaluate()
    print(json.dumps(metrics, indent=2))
    print(f"Saved metrics to {METRICS_OUT}")
    print(f"Saved top confusions to {CONFUSIONS_OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
