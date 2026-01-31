# AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (libgl1 replaces libgl1-mesa-glx in newer Debian)
# Also install Tesseract for OCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (EasyOCR is large due to PyTorch, use longer timeout)
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt

# Copy source code
COPY src/ ./src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV AI_SERVICE_PORT=3005
ENV AI_SERVICE_HOST=0.0.0.0
ENV AI_SERVICE_LOG_LEVEL=INFO

# Model paths - these should be mounted as volumes in production
ENV AI_SERVICE_ID_VERIFICATION_MODEL_PATH=/app/models/id_verification/model_v1.h5

# Create models directory
RUN mkdir -p /app/models/id_verification

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3005/health')" || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3005"]
