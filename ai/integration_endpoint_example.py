
# Minimal FastAPI inference endpoint (example)
from fastapi import FastAPI
import joblib, json, pandas as pd
app = FastAPI()
model = joblib.load('models/sample_model.pkl')  # or tensorflow.keras.models.load_model
scaler = joblib.load('models/scaler.joblib')    # if you saved scaler
@app.post('/predict')
def predict(payload: dict):
    df = pd.DataFrame([payload])
    # apply same feature selection and scaling
    X = df[[c for c in df.columns if c.startswith('feature_')]].values
    Xs = scaler.transform(X)
    preds = model.predict(Xs)
    return {'preds': preds.tolist()}
