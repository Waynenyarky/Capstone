"""
LOB Recommendation Model Training Script

Loads the LOB recommendation dataset, flattens multi-recommendation entries,
adds hard-case rows + noisy augmentation, trains robust text classifiers
(Logistic Regression, Linear SVC, ComplementNB), compares them with
cross-validation, runs hyperparameter tuning on the best, and saves the best model + vectorizer
+ label list + tuning metadata.

Usage:
    python ai/scripts/train_lob_model.py [--dataset PATH_TO_JSON] [--no-tune]
"""

import argparse
import glob
import hashlib
import json
import os
import random
import re
import sys
import unicodedata
from collections import Counter
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import ComplementNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion
from sklearn.svm import LinearSVC
from sklearn.model_selection import cross_val_score, StratifiedKFold, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score
from sklearn.calibration import CalibratedClassifierCV

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TRAIN_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_train.json")
BALANCED_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset_balanced_4000.json")
FULL_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
if os.path.exists(TRAIN_DATASET):
    DEFAULT_DATASET = TRAIN_DATASET
elif os.path.exists(BALANCED_DATASET):
    DEFAULT_DATASET = BALANCED_DATASET
else:
    DEFAULT_DATASET = FULL_DATASET
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
MODELS_DIR = os.path.join(AI_ROOT, "models")
CHECKSUMS_PATH = os.path.join(MODELS_DIR, "lob_artifact_checksums.json")
LOW_RECALL_DATASET_GLOB = os.path.join(AI_ROOT, "datasets", "generated_batch_*_low_recall.json")
REALWORLD_HOLDOUT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_realworld_holdout.json")

CANONICAL_TOKEN_MAP = {
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

FILLER_SUFFIXES = (" sa barangay", " near palengke", " po", " naman")


def load_taxonomy():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_text(text):
    """Normalize bilingual free text into a more stable representation for training/inference."""
    text = unicodedata.normalize("NFKC", str(text or "")).lower().strip()
    if not text:
        return ""

    text = text.replace("&", " and ")
    text = re.sub(r"[^\w\s/-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    for source, target in CANONICAL_TOKEN_MAP.items():
        text = re.sub(rf"\b{re.escape(source)}\b", target, text)

    return text


def _inject_typo_noise(token, rng):
    if len(token) < 5 or not token.isalpha():
        return token

    roll = rng.random()
    if roll < 0.34:
        i = rng.randint(1, len(token) - 2)
        return token[:i] + token[i + 1 :]
    if roll < 0.67:
        i = rng.randint(1, len(token) - 2)
        chars = list(token)
        chars[i], chars[i + 1] = chars[i + 1], chars[i]
        return "".join(chars)
    return re.sub(r"[aeiou]", lambda _: rng.choice("aeiou"), token, count=1)


def make_noisy_variant(text, rng):
    """Create lightweight typo/colloquial noise variants to improve robustness."""
    parts = re.split(r"(\s+)", text)
    for i, part in enumerate(parts):
        if part.strip() and part.isalpha() and rng.random() < 0.18:
            parts[i] = _inject_typo_noise(part, rng)
    noisy = "".join(parts)
    if rng.random() < 0.45:
        noisy = noisy + rng.choice(FILLER_SUFFIXES)
    return normalize_text(noisy)


def flatten_dataset(dataset):
    """Flatten so each row is (description, label) where label = 'taxCode|detailedLine'."""
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


def _row_key(row):
    return (row["text"], row["label"])


def load_holdout_row_keys():
    if not os.path.exists(REALWORLD_HOLDOUT_DATASET):
        return set()
    try:
        with open(REALWORLD_HOLDOUT_DATASET, "r", encoding="utf-8") as f:
            holdout_raw = json.load(f)
        holdout_rows = flatten_dataset(holdout_raw)
        return {_row_key(r) for r in holdout_rows}
    except Exception as exc:
        print(f"WARNING: Could not load holdout dataset for leakage guard: {exc}")
        return set()


def load_optional_low_recall_rows(primary_dataset_path):
    """Load additional difficult examples if available to improve hard-case recall."""
    rows = []
    primary_abs = os.path.abspath(primary_dataset_path)
    holdout_row_keys = load_holdout_row_keys()
    for path in sorted(glob.glob(LOW_RECALL_DATASET_GLOB)):
        if os.path.abspath(path) == primary_abs:
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            candidate_rows = flatten_dataset(raw)
            if holdout_row_keys:
                candidate_rows = [r for r in candidate_rows if _row_key(r) not in holdout_row_keys]
            rows.extend(candidate_rows)
        except Exception as exc:
            print(f"WARNING: Could not load optional dataset {path}: {exc}")
    return rows


def dedupe_rows(rows):
    seen = set()
    out = []
    for row in rows:
        key = (row["text"], row["label"])
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def augment_rows(rows, per_label_limit=50, seed=42):
    """Generate bounded noisy variants per label to improve typo/code-switch robustness."""
    rng = random.Random(seed)
    grouped = {}
    for row in rows:
        grouped.setdefault(row["label"], []).append(row)

    augmented = []
    for label, label_rows in grouped.items():
        max_take = min(per_label_limit, len(label_rows))
        sampled = label_rows if len(label_rows) <= max_take else rng.sample(label_rows, max_take)
        for row in sampled:
            noisy_text = make_noisy_variant(row["text"], rng)
            if noisy_text and noisy_text != row["text"]:
                augmented.append({"text": noisy_text, "label": label})
    return augmented


def get_models():
    """Build dict of robust text models."""
    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=3000, C=2.0, random_state=42, solver="lbfgs", class_weight="balanced"
        ),
        "LinearSVC": LinearSVC(
            max_iter=5000, C=1.0, random_state=42, dual=False, class_weight="balanced"
        ),
        "ComplementNB": ComplementNB(alpha=0.4),
    }
    return models


def get_param_grid(algorithm_name):
    """Param grids for hyperparameter tuning (modest size for speed)."""
    grids = {
        "LogisticRegression": {"C": [1.0, 2.0, 3.0]},
        "LinearSVC": {"C": [0.5, 1.0, 2.0]},
        "ComplementNB": {"alpha": [0.2, 0.4, 0.8]},
    }
    return grids.get(algorithm_name, {})


def train(dataset_path=None, skip_tune=False):
    ds_path = dataset_path or DEFAULT_DATASET
    print(f"Loading dataset from {ds_path}")
    with open(ds_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    rows = flatten_dataset(raw)
    base_rows_count = len(rows)

    extra_rows = load_optional_low_recall_rows(ds_path)
    if extra_rows:
        rows.extend(extra_rows)

    rows = dedupe_rows(rows)
    deduped_before_aug = len(rows)

    augmented_rows = augment_rows(rows, per_label_limit=60, seed=42)
    rows.extend(augmented_rows)
    rows = dedupe_rows(rows)

    print(f"Flattened dataset (base): {base_rows_count} rows")
    print(f"Added optional difficult rows: {len(extra_rows)}")
    print(f"Added noisy augmentation rows: {len(augmented_rows)}")
    print(f"Training rows after dedupe: {len(rows)} (pre-augment dedupe: {deduped_before_aug})")

    if len(rows) < 10:
        print("ERROR: Not enough training data (need at least 10 rows).")
        return False

    texts = [r["text"] for r in rows]
    labels = [r["label"] for r in rows]

    unique_labels = sorted(set(labels))
    label_counts = Counter(labels)
    print(f"Unique labels (classes): {len(unique_labels)}")
    print(
        f"Label distribution — min: {min(label_counts.values())}, max: {max(label_counts.values())}, median: {sorted(label_counts.values())[len(label_counts)//2]}"
    )

    vectorizer = FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    max_features=12000,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                    max_df=0.95,
                    strip_accents="unicode",
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    max_features=25000,
                    sublinear_tf=True,
                    min_df=1,
                    strip_accents="unicode",
                ),
            ),
        ]
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)

    min_class_count = min(label_counts.values())
    n_splits = min(5, max(2, min_class_count))

    cv_mask = np.array([label_counts[l] >= n_splits for l in labels])
    X_cv = X[cv_mask]
    y_cv = y[cv_mask]

    can_cross_validate = cv_mask.sum() >= n_splits * 2
    if can_cross_validate:
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        print(
            f"\nCross-validation: {n_splits}-fold on {cv_mask.sum()}/{len(labels)} samples (classes with >= {n_splits} examples)"
        )
    else:
        print(
            "\nToo few multi-sample classes for cross-validation; will evaluate on full training set only."
        )

    models = get_models()
    print(f"\nComparing {len(models)} algorithms: {list(models.keys())}")

    results = {}
    if can_cross_validate:
        print("\n--- Cross-validation results ---")
        for name, model in models.items():
            try:
                scores = cross_val_score(model, X_cv, y_cv, cv=cv, scoring="accuracy")
                mean_acc = scores.mean()
                results[name] = mean_acc
                print(f"  {name}: accuracy = {mean_acc:.4f} (+/- {scores.std():.4f})")
            except Exception as e:
                print(f"  {name}: FAILED ({e})")
    else:
        print("\n--- Evaluating on full training set ---")
        for name, model in models.items():
            try:
                model.fit(X, y)
                y_pred = model.predict(X)
                acc = accuracy_score(y, y_pred)
                results[name] = acc
                print(f"  {name}: training accuracy = {acc:.4f}")
            except Exception as e:
                print(f"  {name}: FAILED ({e})")

    if not results:
        print("ERROR: All models failed.")
        return False

    best_name = max(results, key=results.get)
    best_cv_accuracy = results[best_name]
    print(f"\nBest model: {best_name} (CV accuracy {best_cv_accuracy:.4f})")

    # Hyperparameter tuning on best model
    best_model = models[best_name]
    param_grid = get_param_grid(best_name)
    tuning_result = None
    if param_grid and not skip_tune and can_cross_validate:
        print(f"\n--- Hyperparameter tuning for {best_name} ---")
        try:
            X_tune = X_cv
            y_tune = y_cv
            search = GridSearchCV(
                best_model,
                param_grid,
                cv=min(3, n_splits),
                scoring="accuracy",
                n_jobs=-1,
                refit=True,
            )
            search.fit(X_tune, y_tune)
            best_model = search.best_estimator_
            tuning_result = {
                "best_params": search.best_params_,
                "best_cv_score": float(search.best_score_),
                "cv_results": {
                    k: (v.tolist() if hasattr(v, "tolist") else v)
                    for k, v in search.cv_results_.items()
                    if k in ("mean_test_score", "std_test_score", "params")
                },
            }
            print(f"  Best params: {search.best_params_}")
            print(f"  Best CV score: {search.best_score_:.4f}")
        except Exception as e:
            print(f"  Tuning failed: {e}; using default params.")

    # Train best (possibly tuned) model on full data
    best_model.fit(X, y)

    # LinearSVC doesn't have predict_proba; wrap with calibration
    if best_name == "LinearSVC":
        print("Wrapping LinearSVC with CalibratedClassifierCV for probability support...")
        cal_cv = min(3, min_class_count) if min_class_count >= 2 else "prefit"
        if cal_cv == "prefit":
            calibrated = CalibratedClassifierCV(best_model, cv="prefit")
            calibrated.fit(X, y)
        else:
            c_value = best_model.get_params().get("C", 1.0)
            calibrated = CalibratedClassifierCV(
                LinearSVC(
                    max_iter=5000, C=c_value, random_state=42, dual=False, class_weight="balanced"
                ),
                cv=cal_cv,
            )
            calibrated.fit(X, y)
        best_model = calibrated

    print("\n--- Full training set classification report ---")
    y_pred = best_model.predict(X)
    print(classification_report(y, y_pred, zero_division=0))
    print(f"Training accuracy: {accuracy_score(y, y_pred):.4f}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    vectorizer_path = os.path.join(MODELS_DIR, "lob_vectorizer.joblib")
    model_path = os.path.join(MODELS_DIR, "lob_model.joblib")
    labels_path = os.path.join(MODELS_DIR, "lob_labels.json")

    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(best_model, model_path)
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(unique_labels, f, ensure_ascii=False, indent=2)

    checksums = {}
    for p in (vectorizer_path, model_path, labels_path):
        h = hashlib.sha256()
        with open(p, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        checksums[os.path.basename(p)] = h.hexdigest()
    with open(CHECKSUMS_PATH, "w", encoding="utf-8") as f:
        json.dump(checksums, f, indent=2)

    meta = {
        "algorithm": best_name,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "cv_accuracy": best_cv_accuracy,
        "n_train_samples": len(rows),
        "n_base_samples": base_rows_count,
        "n_optional_difficult_samples": len(extra_rows),
        "n_noisy_augmented_samples": len(augmented_rows),
        "n_labels": len(unique_labels),
        "feature_extractor": "tfidf_word_char_hybrid",
    }
    if tuning_result:
        meta["tuning"] = tuning_result
    meta_path = os.path.join(MODELS_DIR, "training_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved vectorizer to {vectorizer_path}")
    print(f"Saved model ({best_name}) to {model_path}")
    print(f"Saved {len(unique_labels)} labels to {labels_path}")
    print(f"Saved artifact checksums to {CHECKSUMS_PATH}")
    print(f"Saved metadata (incl. tuning) to {meta_path}")
    print("\nTraining complete.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train LOB recommendation model")
    parser.add_argument("--dataset", type=str, default=None, help="Path to dataset JSON")
    parser.add_argument(
        "--no-tune",
        action="store_true",
        help="Skip hyperparameter tuning step",
    )
    args = parser.parse_args()
    success = train(args.dataset, skip_tune=args.no_tune)
    sys.exit(0 if success else 1)
