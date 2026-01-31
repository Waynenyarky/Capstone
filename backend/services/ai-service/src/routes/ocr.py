"""
OCR (Optical Character Recognition) Routes

Provides endpoints for extracting text from ID document images.
"""
import io
import base64
import logging
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from PIL import Image
import httpx

from ..config import settings
from ..models import ocr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["OCR"])


# Request/Response Models
class OcrRequest(BaseModel):
    """Request model for OCR extraction."""
    imageUrl: Optional[str] = None
    imageBase64: Optional[str] = None
    idType: str = 'unknown'
    ocrMapping: Optional[Dict[str, List[str]]] = None


class ExtractedField(BaseModel):
    """A single extracted field."""
    name: str
    value: str
    confidence: float = 1.0


class OcrResponse(BaseModel):
    """Response model for OCR extraction."""
    success: bool
    rawText: str
    extractedFields: Dict[str, Any]
    confidence: float
    idType: str
    ocrAvailable: bool
    message: Optional[str] = None


class OcrStatusResponse(BaseModel):
    """OCR service status."""
    available: bool
    engine: str
    notes: List[str] = []


# Helper functions
async def fetch_image_from_url(url: str) -> Image.Image:
    """Fetch an image from a URL."""
    try:
        async with httpx.AsyncClient(timeout=settings.IMAGE_FETCH_TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            return image
    except Exception as e:
        logger.error(f"Failed to fetch image from {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode a base64 encoded image."""
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")


# Routes
@router.get("/status", response_model=OcrStatusResponse)
async def get_ocr_status():
    """Check if OCR service is available."""
    available = ocr.is_available()
    
    # Check which engine is available
    engine = "none"
    notes = []
    
    if ocr._easyocr_available:
        engine = "easyocr"
        notes.append("EasyOCR (deep learning) is available - best accuracy for ID cards")
    elif ocr._tesseract_available:
        engine = "tesseract"
        notes.append("Tesseract OCR is available")
    else:
        notes.append("No OCR engine installed")
    
    if available:
        notes.append("For best results, ensure ID images are clear and well-lit")
    
    return OcrStatusResponse(
        available=available,
        engine=engine,
        notes=notes
    )


@router.post("/extract", response_model=OcrResponse)
async def extract_text_from_image(request: OcrRequest):
    """
    Extract text from an ID document image.
    
    Accepts either an image URL or base64-encoded image.
    Optionally provide idType for better parsing.
    """
    image = None
    
    # Get image
    if request.imageUrl:
        logger.info(f"Fetching image from URL for OCR: {request.imageUrl}")
        image = await fetch_image_from_url(request.imageUrl)
    elif request.imageBase64:
        logger.info("Decoding base64 image for OCR")
        image = decode_base64_image(request.imageBase64)
    
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Image must be provided (via imageUrl or imageBase64)"
        )
    
    # Check if OCR is available
    if not ocr.is_available():
        # Return mock/empty response if OCR not available
        return OcrResponse(
            success=False,
            rawText="",
            extractedFields={},
            confidence=0.0,
            idType=request.idType,
            ocrAvailable=False,
            message="OCR service not available. Please install Tesseract for OCR support."
        )
    
    # Perform OCR extraction
    try:
        result = ocr.extract_from_id_image(
            image=image,
            id_type=request.idType,
            ocr_mapping=request.ocrMapping
        )
        
        return OcrResponse(
            success=True,
            rawText=result.get('rawText', ''),
            extractedFields=result.get('extractedFields', {}),
            confidence=result.get('confidence', 0.0),
            idType=request.idType,
            ocrAvailable=True,
            message="Text extracted successfully" if result.get('extractedFields') else "No structured data found"
        )
        
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR extraction failed: {str(e)}"
        )


@router.post("/extract-upload", response_model=OcrResponse)
async def extract_text_from_upload(
    image: UploadFile = File(..., description="ID document image"),
    id_type: str = Form(default='unknown', description="Type of ID document"),
):
    """
    Extract text from an uploaded ID document image.
    """
    # Load image
    try:
        content = await image.read()
        pil_image = Image.open(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    # Check if OCR is available
    if not ocr.is_available():
        return OcrResponse(
            success=False,
            rawText="",
            extractedFields={},
            confidence=0.0,
            idType=id_type,
            ocrAvailable=False,
            message="OCR service not available. Please install Tesseract for OCR support."
        )
    
    # Perform OCR extraction
    try:
        result = ocr.extract_from_id_image(
            image=pil_image,
            id_type=id_type,
        )
        
        return OcrResponse(
            success=True,
            rawText=result.get('rawText', ''),
            extractedFields=result.get('extractedFields', {}),
            confidence=result.get('confidence', 0.0),
            idType=id_type,
            ocrAvailable=True,
            message="Text extracted successfully" if result.get('extractedFields') else "No structured data found"
        )
        
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR extraction failed: {str(e)}"
        )
