"""
ID Verification Routes

Provides endpoints for ID document verification.

IMPORTANT: This service does NOT verify IDs against any government database.
All verification is based on visual appearance classification only.
"""
import io
import base64
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from PIL import Image
import httpx

from ..config import settings
from ..models import id_verification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/id-verification", tags=["ID Verification"])


# Request/Response Models
class VerifyIdRequest(BaseModel):
    """Request model for ID verification."""
    frontImageUrl: Optional[str] = None
    frontImageBase64: Optional[str] = None
    backImageUrl: Optional[str] = None
    backImageBase64: Optional[str] = None


class VerificationResult(BaseModel):
    """Individual image verification result."""
    legit: bool
    confidence: float
    documentType: Optional[str] = None


class VerifyIdResponse(BaseModel):
    """Response model for ID verification."""
    legit: bool
    confidence: float
    documentType: Optional[str] = None
    frontResult: Optional[VerificationResult] = None
    backResult: Optional[VerificationResult] = None
    modelVersion: Optional[str] = None
    notes: list[str] = []


class ModelInfoResponse(BaseModel):
    """Model information response."""
    loaded: bool
    version: Optional[str] = None
    notes: list[str] = []


# Helper functions
async def fetch_image_from_url(url: str) -> Image.Image:
    """Fetch an image from a URL."""
    try:
        async with httpx.AsyncClient(timeout=settings.IMAGE_FETCH_TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail=f"URL does not point to an image: {content_type}"
                )
            
            # Check size
            content_length = int(response.headers.get('content-length', 0))
            if content_length > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image too large: {content_length / 1024 / 1024:.1f}MB (max: {settings.MAX_IMAGE_SIZE_MB}MB)"
                )
            
            # Load image
            image = Image.open(io.BytesIO(response.content))
            return image
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch image from {url}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch image from URL: {str(e)}"
        )


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode a base64 encoded image."""
    try:
        # Handle data URL format
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        
        # Check size
        if len(image_data) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large: {len(image_data) / 1024 / 1024:.1f}MB (max: {settings.MAX_IMAGE_SIZE_MB}MB)"
            )
        
        image = Image.open(io.BytesIO(image_data))
        return image
        
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 image data: {str(e)}"
        )


# Routes
@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Get information about the ID verification model."""
    info = id_verification.get_model_info()
    return ModelInfoResponse(
        loaded=info['loaded'],
        version=info.get('version'),
        notes=info.get('notes', []),
    )


@router.post("/verify", response_model=VerifyIdResponse)
async def verify_id(request: VerifyIdRequest):
    """
    Verify an ID document image.
    
    Accepts either image URLs or base64-encoded images.
    At least one image (front) must be provided.
    
    **IMPORTANT**: This endpoint does NOT verify IDs against any government database.
    Verification is based on visual appearance only.
    """
    front_image = None
    back_image = None
    
    # Get front image
    if request.frontImageUrl:
        logger.info(f"Fetching front image from URL: {request.frontImageUrl}")
        front_image = await fetch_image_from_url(request.frontImageUrl)
    elif request.frontImageBase64:
        logger.info("Decoding front image from base64")
        front_image = decode_base64_image(request.frontImageBase64)
    
    # Get back image if provided
    if request.backImageUrl:
        logger.info(f"Fetching back image from URL: {request.backImageUrl}")
        back_image = await fetch_image_from_url(request.backImageUrl)
    elif request.backImageBase64:
        logger.info("Decoding back image from base64")
        back_image = decode_base64_image(request.backImageBase64)
    
    # Require at least front image
    if front_image is None:
        raise HTTPException(
            status_code=400,
            detail="At least front image must be provided (via frontImageUrl or frontImageBase64)"
        )
    
    # Perform verification
    try:
        results = id_verification.verify_id_images(
            front_image=front_image,
            back_image=back_image
        )
        
        return VerifyIdResponse(
            legit=results['legit'],
            confidence=results['confidence'],
            documentType=results.get('documentType'),
            frontResult=VerificationResult(**results['frontResult']) if results.get('frontResult') else None,
            backResult=VerificationResult(**results['backResult']) if results.get('backResult') else None,
            modelVersion=results.get('modelVersion'),
            notes=results.get('notes', []),
        )
        
    except Exception as e:
        logger.error(f"ID verification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.post("/verify-upload", response_model=VerifyIdResponse)
async def verify_id_upload(
    front_image: UploadFile = File(..., description="Front side of the ID"),
    back_image: Optional[UploadFile] = File(None, description="Back side of the ID (optional)"),
):
    """
    Verify an ID document by uploading image files directly.
    
    **IMPORTANT**: This endpoint does NOT verify IDs against any government database.
    Verification is based on visual appearance only.
    """
    # Load front image
    try:
        front_content = await front_image.read()
        if len(front_content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Front image too large (max: {settings.MAX_IMAGE_SIZE_MB}MB)"
            )
        front_pil = Image.open(io.BytesIO(front_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid front image: {str(e)}")
    
    # Load back image if provided
    back_pil = None
    if back_image:
        try:
            back_content = await back_image.read()
            if len(back_content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"Back image too large (max: {settings.MAX_IMAGE_SIZE_MB}MB)"
                )
            back_pil = Image.open(io.BytesIO(back_content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid back image: {str(e)}")
    
    # Perform verification
    try:
        results = id_verification.verify_id_images(
            front_image=front_pil,
            back_image=back_pil
        )
        
        return VerifyIdResponse(
            legit=results['legit'],
            confidence=results['confidence'],
            documentType=results.get('documentType'),
            frontResult=VerificationResult(**results['frontResult']) if results.get('frontResult') else None,
            backResult=VerificationResult(**results['backResult']) if results.get('backResult') else None,
            modelVersion=results.get('modelVersion'),
            notes=results.get('notes', []),
        )
        
    except Exception as e:
        logger.error(f"ID verification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )
