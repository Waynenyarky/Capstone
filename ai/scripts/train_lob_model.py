"""
LOB Recommendation Model Training Script

Loads the LOB recommendation dataset, flattens multi-recommendation entries,
trains multiple classifiers (Logistic Regression, Random Forest, Linear SVC,
Decision Tree, SVC RBF, MLP, XGBoost), compares them with cross-validation,
runs hyperparameter tuning on the best, and saves the best model + vectorizer
+ label list + tuning metadata.

Usage:
    python ai/scripts/train_lob_model.py [--dataset PATH_TO_JSON] [--no-tune]
"""

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC, SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score
from sklearn.calibration import CalibratedClassifierCV

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
TRAIN_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_train.json")
FULL_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
DEFAULT_DATASET = TRAIN_DATASET if os.path.exists(TRAIN_DATASET) else FULL_DATASET
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
MODELS_DIR = os.path.join(AI_ROOT, "models")

# Optional XGBoost (skip if library cannot be loaded, e.g. missing libomp on macOS)
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except (ImportError, Exception):
    HAS_XGB = False


def load_taxonomy():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def flatten_dataset(dataset):
    """Flatten so each row is (description, label) where label = 'taxCode|detailedLine'."""
    rows = []
    for entry in dataset:
        desc = entry.get("businessDescription", "").strip()
        if not desc:
            continue
        for rec in entry.get("recommendations", []):
            tax = rec.get("taxCode", "")
            dl = rec.get("detailedLine", "")
            if tax and dl:
                rows.append({"text": desc, "label": f"{tax}|{dl}"})
    return rows


def get_models():
    """Build dict of name -> model (6+ algorithms)."""
    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=2000, C=1.0, random_state=42, solver="lbfgs", class_weight="balanced"
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200, max_depth=None, random_state=42, class_weight="balanced"
        ),
        "LinearSVC": LinearSVC(
            max_iter=3000, C=1.0, random_state=42, dual=False, class_weight="balanced"
        ),
        "DecisionTree": DecisionTreeClassifier(
            max_depth=20, random_state=42, class_weight="balanced"
        ),
        "SVC_RBF": SVC(
            kernel="rbf", C=1.0, gamma="scale", random_state=42, class_weight="balanced"
        ),
        "MLPClassifier": MLPClassifier(
            hidden_layer_sizes=(100, 50),
            max_iter=500,
            random_state=42,
            early_stopping=True,
        ),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBClassifier(
            n_estimators=150,
            max_depth=6,
            random_state=42,
            use_label_encoder=False,
            eval_metric="mlogloss",
        )
    return models


def get_param_grid(algorithm_name):
    """Param grids for hyperparameter tuning (modest size for speed)."""
    grids = {
        "LogisticRegression": {"C": [0.5, 1.0, 2.0]},
        "RandomForest": {"n_estimators": [100, 200], "max_depth": [10, 20, None]},
        "LinearSVC": {"C": [0.3, 0.5, 1.0, 2.0]},
        "DecisionTree": {"max_depth": [10, 20, 30]},
        "SVC_RBF": {"C": [0.5, 1.0, 2.0], "gamma": ["scale", "auto"]},
        "MLPClassifier": {
            "hidden_layer_sizes": [(100, 50), (150, 75)],
            "alpha": [1e-4, 1e-3],
        },
        "XGBoost": {"n_estimators": [100, 150], "max_depth": [4, 6]},
    }
    return grids.get(algorithm_name, {})


def train(dataset_path=None, skip_tune=False):
    ds_path = dataset_path or DEFAULT_DATASET
    print(f"Loading dataset from {ds_path}")
    with open(ds_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    rows = flatten_dataset(raw)
    print(f"Flattened dataset: {len(rows)} rows")

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

    vectorizer = TfidfVectorizer(
        max_features=6000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        max_df=0.92,
        strip_accents="unicode",
    )
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)
    label_to_idx = {l: i for i, l in enumerate(unique_labels)}
    y_int = np.array([label_to_idx[l] for l in labels])

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
                y_cv_use = y_int[cv_mask] if name == "XGBoost" and HAS_XGB else y_cv
                scores = cross_val_score(model, X_cv, y_cv_use, cv=cv, scoring="accuracy")
                mean_acc = scores.mean()
                results[name] = mean_acc
                print(f"  {name}: accuracy = {mean_acc:.4f} (+/- {scores.std():.4f})")
            except Exception as e:
                print(f"  {name}: FAILED ({e})")
    else:
        print("\n--- Evaluating on full training set ---")
        for name, model in models.items():
            try:
                y_use = y_int if name == "XGBoost" and HAS_XGB else y
                model.fit(X, y_use)
                y_pred = model.predict(X)
                if name == "XGBoost" and HAS_XGB:
                    y_pred = np.array([unique_labels[i] for i in y_pred])
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
            y_tune = y_int[cv_mask] if best_name == "XGBoost" and HAS_XGB else y_cv
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
    y_fit = y_int if best_name == "XGBoost" and HAS_XGB else y
    best_model.fit(X, y_fit)

    # LinearSVC doesn't have predict_proba; wrap with calibration
    if best_name == "LinearSVC":
        print("Wrapping LinearSVC with CalibratedClassifierCV for probability support...")
        cal_cv = min(3, min_class_count) if min_class_count >= 2 else "prefit"
        if cal_cv == "prefit":
            calibrated = CalibratedClassifierCV(best_model, cv="prefit")
            calibrated.fit(X, y)
        else:
            calibrated = CalibratedClassifierCV(
                LinearSVC(
                    max_iter=3000, C=1.0, random_state=42, dual=False, class_weight="balanced"
                ),
                cv=cal_cv,
            )
            calibrated.fit(X, y)
        best_model = calibrated

    print("\n--- Full training set classification report ---")
    y_pred = best_model.predict(X)
    if best_name == "XGBoost" and HAS_XGB:
        y_pred = np.array([unique_labels[i] for i in y_pred])
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

    meta = {
        "algorithm": best_name,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "cv_accuracy": best_cv_accuracy,
        "n_train_samples": len(rows),
        "n_labels": len(unique_labels),
    }
    if tuning_result:
        meta["tuning"] = tuning_result
    meta_path = os.path.join(MODELS_DIR, "training_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved vectorizer to {vectorizer_path}")
    print(f"Saved model ({best_name}) to {model_path}")
    print(f"Saved {len(unique_labels)} labels to {labels_path}")
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
