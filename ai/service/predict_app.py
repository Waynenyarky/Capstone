"""
LOB Prediction & Training Flask Service

Endpoints:
  POST /predict  — predict LOB recommendations for a business description
  POST /train    — retrain the model from a provided dataset
  GET  /health   — simple health check
  GET  /evaluate — run model evaluation on test set, return metrics as JSON

Startup:
  python predict_app.py              — load existing model (auto-train only if missing)
  python predict_app.py --retrain    — retrain from default dataset, then start server
"""

import argparse
import json
import os
import sys
import traceback
from collections import defaultdict
from threading import Lock

import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SERVICE_DIR)
MODELS_DIR = os.path.join(AI_ROOT, "models")
TAXONOMY_PATH = os.path.join(AI_ROOT, "data", "line_of_business.json")
DEFAULT_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_dataset.json")
TEST_DATASET = os.path.join(AI_ROOT, "datasets", "lob_recommendation_test.json")

sys.path.insert(0, os.path.join(AI_ROOT, "scripts"))
from train_lob_model import train as run_training, flatten_dataset

app = Flask(__name__)
CORS(app)

model = None
vectorizer = None
labels = None
taxonomy = None
model_lock = Lock()
training_meta = None  # {"algorithm": str, "trainedAt": str} from training_meta.json

# OPTIMIZATION: Cache the label-to-taxonomy mapping instead of rebuilding on every request
_label_to_taxonomy_cache = None


def load_taxonomy():
    global taxonomy
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        taxonomy = json.load(f)


def build_label_to_taxonomy_map():
    """Build a mapping from 'taxCode|detailedLine' -> full taxonomy info.
    
    OPTIMIZATION: Results are cached after first call since taxonomy doesn't change.
    Before: Called on every /predict request, rebuilding the entire mapping each time.
    After: Built once at startup, reused for all subsequent requests.
    """
    global _label_to_taxonomy_cache
    
    # Return cached mapping if available
    if _label_to_taxonomy_cache is not None:
        return _label_to_taxonomy_cache
    
    # Build the mapping (only happens once)
    mapping = {}
    for entry in taxonomy:
        tc = entry["taxCode"]
        lob = entry["lineOfBusiness"]
        for i, dl in enumerate(entry["detailedLines"]):
            psic = entry["psicCodes"][i] if i < len(entry["psicCodes"]) else ""
            mapping[f"{tc}|{dl}"] = {
                "taxCode": tc,
                "lineOfBusiness": lob,
                "detailedLine": dl,
                "psicCode": psic,
            }
    
    # Cache for future calls
    _label_to_taxonomy_cache = mapping
    return mapping


def load_model():
    global model, vectorizer, labels, training_meta
    vec_path = os.path.join(MODELS_DIR, "lob_vectorizer.joblib")
    mod_path = os.path.join(MODELS_DIR, "lob_model.joblib")
    lab_path = os.path.join(MODELS_DIR, "lob_labels.json")

    if not all(os.path.exists(p) for p in [vec_path, mod_path, lab_path]):
        print("WARNING: Model artifacts not found. /predict will return an error until the model is trained.")
        return False

    with model_lock:
        vectorizer = joblib.load(vec_path)
        model = joblib.load(mod_path)
        with open(lab_path, "r", encoding="utf-8") as f:
            labels = json.load(f)
        training_meta = None
        meta_path = os.path.join(MODELS_DIR, "training_meta.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    training_meta = json.load(f)
            except Exception:
                pass
    print(f"Loaded model with {len(labels)} labels")
    return True


@app.route("/health", methods=["GET"])
def health():
    payload = {
        "status": "ok",
        "model_loaded": model is not None,
        "num_labels": len(labels) if labels else 0,
    }
    if training_meta:
        payload["algorithm"] = training_meta.get("algorithm")
        payload["last_trained"] = training_meta.get("trainedAt")
    return jsonify(payload)


@app.route("/api/health", methods=["GET"])
def api_health():
    """Compatibility endpoint for monitoring service that expects /api/health"""
    return health()


@app.route("/predict", methods=["POST"])
def predict():
    if model is None or vectorizer is None or labels is None:
        return jsonify({"error": "Model not loaded. Train the model first."}), 503

    data = request.get_json(silent=True)
    if not data or not data.get("businessDescription"):
        return jsonify({"error": "businessDescription is required"}), 400

    desc = data["businessDescription"].strip()
    if len(desc) < 10:
        return jsonify({"error": "businessDescription must be at least 10 characters"}), 400

    top_k = data.get("topK", 5)
    threshold = data.get("threshold", 0.01)
    # If the model's best prediction is below this, return no recommendations (description doesn't match any category well)
    min_confidence = data.get("minConfidence", 0.18)

    try:
        with model_lock:
            X = vectorizer.transform([desc])
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)[0]
            elif hasattr(model, "decision_function"):
                decision = model.decision_function(X)[0]
                exp_d = np.exp(decision - np.max(decision))
                proba = exp_d / exp_d.sum()
            else:
                pred = model.predict(X)
                return jsonify({"recommendations": _label_to_recs([pred[0]])})

        top_indices = np.argsort(proba)[::-1][:top_k]
        best_prob = float(proba[top_indices[0]]) if len(top_indices) else 0
        if best_prob < min_confidence:
            return jsonify({
                "recommendations": [],
                "noConfidentMatch": True,
                "message": "Your description doesn't clearly match any of our current lines of business. Please add your line(s) manually below.",
            })

        label_map = build_label_to_taxonomy_map()
        recommendations = []
        seen = set()

        for idx in top_indices:
            if proba[idx] < threshold:
                continue
            label = labels[idx]
            if label in seen:
                continue
            seen.add(label)
            info = label_map.get(label)
            if info:
                rec = dict(info)
                rec["confidence"] = round(float(proba[idx]), 4)
                recommendations.append(rec)

        return jsonify({"recommendations": recommendations})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/train", methods=["POST"])
def train_endpoint():
    """Accept a dataset and retrain the model.

    Body can be:
      { "dataset": [ { "businessDescription": "...", "recommendations": [...] } ] }
    or:
      { "datasetPath": "/absolute/path/to/dataset.json" }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    dataset = data.get("dataset")
    dataset_path = data.get("datasetPath")

    if dataset:
        tmp_path = os.path.join(AI_ROOT, "datasets", "_train_temp.json")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False)
        train_path = tmp_path
    elif dataset_path:
        if not os.path.exists(dataset_path):
            return jsonify({"error": f"Dataset file not found: {dataset_path}"}), 400
        train_path = dataset_path
    else:
        return jsonify({"error": "Provide 'dataset' (array) or 'datasetPath' (string)"}), 400

    try:
        success = run_training(train_path)
        if not success:
            return jsonify({"error": "Training failed (not enough data?)"}), 500

        load_model()

        if dataset and os.path.exists(tmp_path):
            os.remove(tmp_path)

        return jsonify({"ok": True, "message": "Model retrained and reloaded successfully"})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Training failed: {str(e)}"}), 500


def _flatten_for_eval(dataset):
    """Flatten dataset into (text, label) rows for evaluation."""
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


def run_evaluation():
    """Run model evaluation on test set. Returns dict with metrics or None on failure."""
    if model is None or vectorizer is None or labels is None:
        return None
    label_list = labels
    label_to_idx = {l: i for i, l in enumerate(label_list)}

    if os.path.exists(TEST_DATASET):
        ds_path = TEST_DATASET
        using_fixed_test = True
    elif os.path.exists(DEFAULT_DATASET):
        ds_path = DEFAULT_DATASET
        using_fixed_test = False
    else:
        return None

    with open(ds_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    rows = _flatten_for_eval(raw)
    if len(rows) < 5:
        return None

    texts = [r["text"] for r in rows]
    labels_arr = [r["label"] for r in rows]
    valid = [(t, l) for t, l in zip(texts, labels_arr) if l in label_to_idx]
    if not valid:
        return None
    skipped = len(texts) - len(valid)
    X_test, y_test = zip(*valid)
    X_test = list(X_test)
    y_test = list(y_test)

    with model_lock:
        X_test_vec = vectorizer.transform(X_test)
        y_true_idx = np.array([label_to_idx[l] for l in y_test])
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_test_vec)
            pred_idx = np.argmax(proba, axis=1)
        else:
            pred_labels = model.predict(X_test_vec)
            pred_idx = np.array([
                label_to_idx[l] if l in label_to_idx else label_to_idx.get(str(l), 0)
                for l in pred_labels
            ])

    acc1 = float(accuracy_score(y_true_idx, pred_idx))
    acc3 = acc5 = 0.0
    if hasattr(model, "predict_proba"):
        top3_correct = top5_correct = 0
        for i in range(len(y_true_idx)):
            probs = model.predict_proba(X_test_vec[i : i + 1])[0]
            sorted_idx = np.argsort(probs)[::-1]
            if y_true_idx[i] in set(sorted_idx[:3].tolist()):
                top3_correct += 1
            if y_true_idx[i] in set(sorted_idx[:5].tolist()):
                top5_correct += 1
        acc3 = top3_correct / len(y_true_idx)
        acc5 = top5_correct / len(y_true_idx)

    try:
        f1_macro = float(f1_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        ))
        f1_weighted = float(f1_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        ))
    except Exception:
        f1_macro = 0.0
        f1_weighted = 0.0

    try:
        precision_macro = float(precision_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        ))
        precision_weighted = float(precision_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        ))
        recall_macro = float(recall_score(
            y_true_idx, pred_idx, average="macro", zero_division=0, labels=np.arange(len(label_list))
        ))
        recall_weighted = float(recall_score(
            y_true_idx, pred_idx, average="weighted", zero_division=0
        ))
    except Exception:
        precision_macro = precision_weighted = recall_macro = recall_weighted = 0.0

    recall_by_label = defaultdict(lambda: {"correct": 0, "total": 0})
    for i, true_idx in enumerate(y_true_idx):
        rec = recall_by_label[true_idx]
        rec["total"] += 1
        if pred_idx[i] == true_idx:
            rec["correct"] += 1
    recalls = []
    for idx, rec in recall_by_label.items():
        r = rec["correct"] / rec["total"] if rec["total"] else 0
        recalls.append({"label": label_list[idx], "recall": round(r, 4), "total": rec["total"]})
    recalls.sort(key=lambda x: (x["recall"], -x["total"]))
    lowest_recall = recalls[:15]

    return {
        "top1Accuracy": acc1,
        "top3Accuracy": acc3,
        "top5Accuracy": acc5,
        "macroF1": f1_macro,
        "weightedF1": f1_weighted,
        "precisionMacro": precision_macro,
        "precisionWeighted": precision_weighted,
        "recallMacro": recall_macro,
        "recallWeighted": recall_weighted,
        "testRows": len(y_test),
        "skippedRows": skipped,
        "usingFixedTest": using_fixed_test,
        "lowestRecall": lowest_recall,
    }


@app.route("/evaluate", methods=["GET"])
def evaluate_endpoint():
    """Return model evaluation metrics as JSON."""
    result = run_evaluation()
    if result is None:
        return jsonify({
            "error": "Evaluation not available. Ensure model is loaded and test dataset exists (e.g. lob_recommendation_test.json or lob_recommendation_dataset.json).",
        }), 503
    return jsonify(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LOB prediction service")
    parser.add_argument("--retrain", action="store_true", help="Retrain the model from the default dataset before starting the server")
    args = parser.parse_args()

    # Support retrain via env (e.g. ./start.sh --retrain sets LOB_RETRAIN_ON_START=1)
    retrain = args.retrain or os.environ.get("LOB_RETRAIN_ON_START", "").strip().lower() in ("1", "true", "yes")

    load_taxonomy()

    if retrain:
        if os.path.exists(DEFAULT_DATASET):
            print("--retrain: Training from default dataset...")
            try:
                if run_training(DEFAULT_DATASET):
                    load_model()
                    print("Retrain complete. Model is ready.")
                else:
                    print("WARNING: Retrain failed. /predict will return 503 until the model is trained via POST /train.")
            except Exception as e:
                traceback.print_exc()
                print(f"WARNING: Retrain failed: {e}. Exiting.")
                sys.exit(1)
        else:
            print(f"ERROR: --retrain requested but dataset not found at {DEFAULT_DATASET}")
            sys.exit(1)
    elif not load_model():
        # Auto-train on first run so other devs / Docker get a working model without manual steps
        if os.path.exists(DEFAULT_DATASET):
            print("Model not found. Training from default dataset (first run or fresh clone)...")
            try:
                if run_training(DEFAULT_DATASET):
                    load_model()
                    print("Auto-training complete. Model is ready.")
                else:
                    print("WARNING: Auto-training failed. /predict will return 503 until the model is trained via POST /train.")
            except Exception as e:
                traceback.print_exc()
                print(f"WARNING: Auto-training failed: {e}. /predict will return 503 until the model is trained via POST /train.")
        else:
            print(f"WARNING: No model and no dataset at {DEFAULT_DATASET}. Train via POST /train or add the dataset.")
    port = int(os.environ.get("LOB_MODEL_PORT", 5050))
    print(f"Starting LOB prediction service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
