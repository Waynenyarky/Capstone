# LOB Prediction & Training Service (Flask + scikit-learn)
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy full ai tree so service/, models/, data/, scripts/, datasets/ are under /app
COPY ai/ ./

# Predict app runs from /app; it expects AI_ROOT = parent of service/ = /app
EXPOSE 5050

ENV LOB_MODEL_PORT=5050
CMD ["python", "-u", "service/predict_app.py"]
