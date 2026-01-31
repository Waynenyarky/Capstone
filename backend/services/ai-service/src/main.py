"""
AI Service - FastAPI Application

A modular AI microservice that provides various AI capabilities including:
- ID Verification (visual appearance classification)
- [Future] OCR / Text Extraction
- [Future] Document Classification
- [Future] Anomaly Detection

IMPORTANT: The ID verification service does NOT verify IDs against any government database.
All verification is based on visual appearance classification only.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models import id_verification, ocr
from .routes import health, id_verification as id_verification_routes, training_metrics, ocr as ocr_routes

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_all_models():
    """Load all AI models at startup."""
    logger.info("Loading AI models...")
    
    # Load ID verification model
    id_loaded = id_verification.load_model()
    if id_loaded:
        logger.info("ID verification model loaded successfully")
    else:
        logger.warning("ID verification model not loaded - will run in mock mode")
    
    # Warm up OCR so EasyOCR can download models before the first request
    if ocr.warmup_easyocr_reader():
        logger.info("EasyOCR warmup succeeded")
    else:
        logger.warning("EasyOCR warmup did not complete; OCR requests may still block on first run")

    # [Future] Load other models here
    # ocr.load_model()
    # document_classifier.load_model()
    
    logger.info("Model loading complete")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}...")
    load_all_models()
    logger.info(f"{settings.SERVICE_NAME} is ready")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}...")


# Create FastAPI app
app = FastAPI(
    title=settings.SERVICE_NAME,
    description="""
    ## AI Microservice
    
    A modular AI service providing various AI-powered capabilities for the Capstone project.
    
    ### Available Capabilities
    
    #### ID Verification (`/id-verification/`)
    Visual appearance-based ID document verification.
    
    **IMPORTANT**: This service does NOT verify IDs against any government database.
    All verification is based on visual appearance classification only - it determines
    if an image looks like a legitimate ID document based on visual characteristics.
    
    #### OCR / Text Extraction (`/ocr/`)
    Extract text from ID documents using optical character recognition.
    
    #### [Future] Document Classification
    Classify documents by type.
    
    ---
    
    All AI models are trained in-house as part of the Capstone project.
    No third-party "black box" AI APIs are used as the main deliverable.
    """,
    version=settings.SERVICE_VERSION,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(id_verification_routes.router)
app.include_router(training_metrics.router)
app.include_router(ocr_routes.router)

# [Future] Add more routers here
# app.include_router(document_classifier_routes.router)


# Legacy endpoint for backward compatibility
@app.post("/verify-id", include_in_schema=False)
async def verify_id_legacy(request: id_verification_routes.VerifyIdRequest):
    """
    Legacy endpoint for backward compatibility.
    Redirects to /id-verification/verify
    """
    return await id_verification_routes.verify_id(request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
