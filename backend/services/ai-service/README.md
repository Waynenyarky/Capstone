# AI Service

A modular FastAPI-based microservice providing various AI capabilities for the Capstone project.

## Architecture

The service is designed to be modular and extensible:

```
backend/services/ai-service/
├── src/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Centralized configuration
│   ├── models/              # AI model loaders and inference
│   │   ├── __init__.py
│   │   ├── base.py          # Base model interface
│   │   └── id_verification.py
│   └── routes/              # API endpoints
│       ├── __init__.py
│       ├── health.py        # Health check endpoints
│       └── id_verification.py
├── Dockerfile
├── requirements.txt
└── README.md
```

## Available Capabilities

### 1. ID Verification (`/id-verification/`)

Visual appearance-based ID document verification.

**IMPORTANT**: This service does NOT verify IDs against any government database.
All verification is based on visual appearance classification only.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/id-verification/model-info` | Get model information |
| POST | `/id-verification/verify` | Verify ID via URL or base64 |
| POST | `/id-verification/verify-upload` | Verify ID via file upload |

#### Example Request

```bash
curl -X POST http://localhost:3005/id-verification/verify \
  -H "Content-Type: application/json" \
  -d '{
    "frontImageUrl": "https://example.com/id-front.jpg",
    "backImageUrl": "https://example.com/id-back.jpg"
  }'
```

#### Example Response

```json
{
  "legit": true,
  "confidence": 0.85,
  "documentType": null,
  "frontResult": {
    "legit": true,
    "confidence": 0.85,
    "documentType": null
  },
  "backResult": {
    "legit": true,
    "confidence": 0.82,
    "documentType": null
  },
  "modelVersion": "v1_20240115",
  "notes": [
    "This verification is based on visual appearance only.",
    "No government database verification is performed."
  ]
}
```

### 2. [Future] OCR / Text Extraction (`/ocr/`)

Extract text from documents and images using Tesseract or custom models.

### 3. [Future] Document Classification (`/document-classification/`)

Classify documents by type (ID, receipt, certificate, etc.).

## Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Overall service health |
| GET | `/status` | Detailed status of all AI capabilities |

### 4. Training Metrics (`/training-metrics/`)

Retrieve training metrics, history, and visualization for model monitoring.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/training-metrics/id-verification` | Model accuracy, loss, fit status |
| GET | `/training-metrics/id-verification/history` | Epoch-by-epoch training data |
| GET | `/training-metrics/id-verification/curves` | Training curves PNG image |
| GET | `/training-metrics/id-verification/curves-base64` | Training curves as base64 |

#### Fit Status Analysis

The `/training-metrics/id-verification` endpoint returns a `fit_status` field that indicates:

- **good**: Model generalizes well (training and validation metrics are close)
- **overfitting**: Model memorizes training data (validation loss much higher than training)
- **underfitting**: Model needs more training (both losses are high)

## Configuration

Environment variables (prefix: `AI_SERVICE_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3005` | Service port |
| `HOST` | `0.0.0.0` | Service host |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |
| `ID_VERIFICATION_MODEL_PATH` | `ai/models/id_verification/model_v1.h5` | Path to ID verification model |
| `LEGIT_THRESHOLD` | `0.7` | Confidence threshold for "legit" classification |
| `IMG_SIZE` | `224` | Image input size for models |
| `MAX_IMAGE_SIZE_MB` | `10` | Maximum upload size |

## Running Locally

### Prerequisites
- Python 3.11+
- Trained model files (see `ai/id-verification/` for training instructions)

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run the service

```bash
# Development mode with auto-reload
python -m uvicorn src.main:app --reload --port 3005

# Or
python -m src.main
```

### Access the API docs

- Swagger UI: http://localhost:3005/docs
- ReDoc: http://localhost:3005/redoc

## Docker

### Build

```bash
docker build -t ai-service .
```

### Run

```bash
docker run -p 3005:3005 \
  -v /path/to/models:/app/models \
  -e AI_SERVICE_LOG_LEVEL=INFO \
  ai-service
```

## Adding New AI Capabilities

1. **Create a model module** in `src/models/`:
   ```python
   # src/models/my_new_capability.py
   def load_model() -> bool:
       ...
   
   def predict(input_data) -> dict:
       ...
   ```

2. **Create a routes module** in `src/routes/`:
   ```python
   # src/routes/my_new_capability.py
   from fastapi import APIRouter
   router = APIRouter(prefix="/my-capability", tags=["My Capability"])
   
   @router.post("/predict")
   async def predict(...):
       ...
   ```

3. **Register in main.py**:
   ```python
   from .models import my_new_capability
   from .routes import my_new_capability as my_routes
   
   # In load_all_models():
   my_new_capability.load_model()
   
   # After creating app:
   app.include_router(my_routes.router)
   ```

4. **Add configuration** in `config.py` if needed.

## Mock Mode

If a model file is not found, the service runs in "mock mode" for that capability,
returning random predictions. This is useful for development and testing.

## Model Training

Models are trained separately using scripts in `ai/`:

- **ID Verification**: See `ai/id-verification/README.md`
- **[Future] OCR**: TBD
- **[Future] Document Classification**: TBD
