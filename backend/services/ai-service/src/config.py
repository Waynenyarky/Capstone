"""
Configuration for AI Service

Centralized configuration using Pydantic Settings for validation and environment variable support.
"""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI Service Settings"""
    
    # Service configuration
    SERVICE_NAME: str = "AI Service"
    SERVICE_VERSION: str = "1.0.0"
    PORT: int = 3005
    HOST: str = "0.0.0.0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3001,http://localhost:3002"
    
    # Image processing
    IMG_SIZE: int = 224  # Must match training configuration
    MAX_IMAGE_SIZE_MB: int = 10
    IMAGE_FETCH_TIMEOUT: int = 30  # seconds
    
    # === ID Verification Model ===
    ID_VERIFICATION_MODEL_PATH: str = str(
        Path(__file__).parent.parent.parent.parent.parent / 'ai' / 'models' / 'id_verification' / 'model_v1.h5'
    )
    # Lowered threshold to 0.5 to accept real photos that pass document characteristic checks
    # The ML model was trained on synthetic data and struggles with real photos
    # Document characteristics (aspect ratio, resolution, visual detail) provide additional signals
    LEGIT_THRESHOLD: float = 0.5  # Confidence threshold to classify as "legit"
    HIGH_CONFIDENCE_THRESHOLD: float = 0.9  # Threshold for high confidence
    
    # === Future AI Models (placeholders) ===
    # OCR_MODEL_PATH: str = ""
    # DOCUMENT_CLASSIFIER_MODEL_PATH: str = ""
    # ANOMALY_DETECTION_MODEL_PATH: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
    
    class Config:
        env_prefix = "AI_SERVICE_"
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
