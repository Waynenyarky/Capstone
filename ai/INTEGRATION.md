
# Integration Plan (Backend)

1. Training produces a model file in `models/` and saves preprocessing artifacts (scaler) as needed.
2. For a Python backend (Flask/FastAPI/Django):
   - Create an inference endpoint that loads the model and preprocessing artifacts at startup.
   - The endpoint accepts JSON payloads, converts to DataFrame, applies same preprocessing (scaler, encoders), then model.predict -> return JSON.
3. For a mobile app:
   - Convert to TensorFlow Lite (`.tflite`) or use an API endpoint for inference.
4. Version models and track metadata (training data, date, metrics). Store model files with names like `model_v1_YYYYMMDD.h5`.
