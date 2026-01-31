"""
Health Check Routes

Provides health check and service status endpoints.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

from ..models import id_verification

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    services: Dict[str, Any]


class ServiceStatusResponse(BaseModel):
    """Individual service status."""
    name: str
    loaded: bool
    version: Optional[str] = None
    notes: list[str] = []


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns the overall service status and status of individual AI capabilities.
    """
    id_verification_info = id_verification.get_model_info()
    
    services = {
        'id_verification': {
            'loaded': id_verification_info['loaded'],
            'version': id_verification_info.get('version'),
        }
    }
    
    # Overall status is healthy if service is running (models can be in mock mode)
    return HealthResponse(
        status="healthy",
        services=services
    )


@router.get("/status", response_model=Dict[str, ServiceStatusResponse])
async def get_all_services_status():
    """
    Get detailed status of all AI services.
    """
    id_verification_info = id_verification.get_model_info()
    
    return {
        'id_verification': ServiceStatusResponse(
            name="ID Verification",
            loaded=id_verification_info['loaded'],
            version=id_verification_info.get('version'),
            notes=id_verification_info.get('notes', [])
        )
    }
