
# AI Workspace (Reusable Foundation)

Structure created at: `/mnt/data/ai_workspace`

## Purpose
A modular, generic AI foundation ready to accept new datasets and models for tasks like classification, prediction, NLP, and anomaly detection.

## Folder layout
- `datasets/` - put incoming CSV/JSON datasets here. A `sample_template.csv` exists as a template.
- `preprocessing/` - preprocessing utilities (cleaning, splitting, scaling/encoding)
- `training/` - training scripts to run experiments and export models
- `models/` - saved models (or model definitions)
- `notebooks/` - optional interactive notebooks
- `exports/` - exported/packaged artifacts (models, zips)

## Quick start (local)
1. Put your dataset CSV in `datasets/`. Must contain a `label` column for supervised tasks.
2. Run preprocessing & training:
```bash
python -m training.train --csv datasets/sample_toy.csv --export models/sample_model.h5
```
3. The script will try TensorFlow first and fall back to scikit-learn if TF isn't available. Models are saved in `models/` (either `.h5` for TF or `.pkl` for sklearn).

## API (reuse pattern)
- `load_csv(path)`
- `clean_data(df)`
- `preprocess_for_model(df, label_col='label')` -> returns dict with `X_train, y_train, X_val, y_val, X_test, y_test, scaler, feature_columns`
- `train_with_tensorflow(prep, model_path)` / `train_with_sklearn(prep, model_path)`
- `export` -> saved model file

## How to plug new datasets
1. Ensure dataset contains `label` column. If labels are named differently, update call in scripts or modify `preprocess.split_features_label`.
2. For categorical features, extend `preprocessing/preprocess.py` to add encoding logic (OneHotEncoder / OrdinalEncoder).
3. Add custom model code in `training/` or create `models/your_model.py` implementing `train(prep)` returning a saved model path and metrics.

## Integration with backend
- Export trained model to `models/` (HDF5 / joblib pickle).
- For TensorFlow models, use TensorFlow Serving or convert to TensorFlow Lite for mobile using `tf.lite.TFLiteConverter`.
- For scikit-learn models, serve via a simple Flask/FastAPI endpoint that loads the model file and exposes a `/predict` route.
- Keep `preprocessing/scaler` parameters serialized (e.g., using `joblib`) so incoming data is scaled the same way at inference time.

