"""
Training Metrics Routes

Provides endpoints to retrieve training metrics, history, and visualization data.
This allows the frontend to display model accuracy, training curves, etc.
"""
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
import base64

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/training-metrics", tags=["Training Metrics"])


class TrainingEpochData(BaseModel):
    """Data for a single training epoch."""
    epoch: int
    loss: float
    val_loss: float
    accuracy: float
    val_accuracy: float
    auc: Optional[float] = None
    val_auc: Optional[float] = None
    lr: Optional[float] = None


class TrainingHistoryResponse(BaseModel):
    """Full training history response."""
    epochs: int
    history: List[TrainingEpochData]
    final_metrics: Dict[str, float]


class DataCountsResponse(BaseModel):
    """Training data counts."""
    train_legit: int = 0
    train_fake: int = 0
    val_legit: int = 0
    val_fake: int = 0
    total_train: int = 0
    total_val: int = 0
    total: int = 0


class ModelMetricsResponse(BaseModel):
    """Model metrics summary response."""
    model_version: str
    created_at: str
    base_model: str
    accuracy: float
    loss: float
    auc: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    training_config: Dict[str, Any]
    data_counts: Optional[DataCountsResponse] = None
    training_mode: str = "unknown"  # 'quick', 'standard', 'full'
    fit_status: str  # 'good', 'overfitting', 'underfitting'
    fit_details: str
    notes: List[str] = []


class TrainingCurvesResponse(BaseModel):
    """Training curves as base64 image."""
    available: bool
    image_base64: Optional[str] = None
    content_type: str = "image/png"


def get_model_dir() -> Path:
    """Get the directory containing model artifacts."""
    model_path = Path(settings.ID_VERIFICATION_MODEL_PATH)
    return model_path.parent


def analyze_fit_status(history: dict) -> tuple[str, str]:
    """
    Analyze training history to determine if model is overfitting/underfitting.
    
    Returns:
        Tuple of (status, details) where status is 'good', 'overfitting', or 'underfitting'
    """
    if not history or 'loss' not in history:
        return 'unknown', 'No training history available'
    
    train_loss = history['loss']
    val_loss = history['val_loss']
    train_acc = history.get('accuracy', [])
    val_acc = history.get('val_accuracy', [])
    
    final_train_loss = train_loss[-1]
    final_val_loss = val_loss[-1]
    loss_gap = final_val_loss - final_train_loss
    
    final_train_acc = train_acc[-1] if train_acc else 0
    final_val_acc = val_acc[-1] if val_acc else 0
    acc_gap = final_train_acc - final_val_acc
    
    # Analyze fit
    if loss_gap > 0.3 or acc_gap > 0.15:
        return 'overfitting', (
            f"Model is overfitting. Training accuracy ({final_train_acc:.1%}) is significantly "
            f"higher than validation accuracy ({final_val_acc:.1%}). "
            f"Consider: more data, regularization, or early stopping."
        )
    elif final_train_loss > 0.5 and final_val_loss > 0.5:
        return 'underfitting', (
            f"Model may be underfitting. Both training loss ({final_train_loss:.3f}) and "
            f"validation loss ({final_val_loss:.3f}) are high. "
            f"Consider: more epochs, larger model, or better features."
        )
    else:
        return 'good', (
            f"Model shows good generalization. Training accuracy: {final_train_acc:.1%}, "
            f"Validation accuracy: {final_val_acc:.1%}. Loss gap is acceptable ({loss_gap:.3f})."
        )


@router.get("/id-verification", response_model=ModelMetricsResponse)
async def get_id_verification_metrics():
    """
    Get training metrics for the ID verification model.
    
    Returns accuracy, loss, fit status (overfitting/underfitting analysis), and more.
    """
    model_dir = get_model_dir()
    metadata_path = model_dir / "model_v1_metadata.json"
    history_path = model_dir / "training_history.json"
    
    if not metadata_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Model metadata not found. Model may not be trained yet."
        )
    
    # Load metadata
    with open(metadata_path) as f:
        metadata = json.load(f)
    
    # Load history for fit analysis
    history = {}
    if history_path.exists():
        with open(history_path) as f:
            history = json.load(f)
    
    metrics = metadata.get('metrics', {})
    training_config = metadata.get('training_config', {})
    data_counts_raw = metadata.get('data_counts', {})
    
    # Check if fit_status is stored in metadata (sklearn models)
    # or needs to be calculated from history (TensorFlow models)
    if 'fit_status' in metadata:
        fit_status = metadata.get('fit_status', 'unknown')
        fit_details = metadata.get('fit_details', 'No details available')
    else:
        fit_status, fit_details = analyze_fit_status(history)
    
    # Get training mode from top-level metadata or training_config
    training_mode = metadata.get('training_mode', training_config.get('training_mode', 'unknown'))
    
    # Parse data counts
    data_counts = None
    if data_counts_raw:
        data_counts = DataCountsResponse(
            train_legit=data_counts_raw.get('train_legit', 0),
            train_fake=data_counts_raw.get('train_fake', 0),
            val_legit=data_counts_raw.get('val_legit', 0),
            val_fake=data_counts_raw.get('val_fake', 0),
            total_train=data_counts_raw.get('total_train', 0),
            total_val=data_counts_raw.get('total_val', 0),
            total=data_counts_raw.get('total', 0),
        )
    
    return ModelMetricsResponse(
        model_version=metadata.get('model_version', 'unknown'),
        created_at=metadata.get('created_at', ''),
        base_model=metadata.get('base_model', 'unknown'),
        accuracy=metrics.get('accuracy', 0),
        loss=metrics.get('loss', 0),
        auc=metrics.get('auc'),
        confusion_matrix=metrics.get('confusion_matrix'),
        training_config=training_config,
        data_counts=data_counts,
        training_mode=training_mode,
        fit_status=fit_status,
        fit_details=fit_details,
        notes=metadata.get('notes', []),
    )


@router.get("/id-verification/history")
async def get_id_verification_history():
    """
    Get full training history (epoch-by-epoch data).
    
    Useful for rendering custom charts in the frontend.
    Note: sklearn models don't have epoch-by-epoch history.
    """
    model_dir = get_model_dir()
    history_path = model_dir / "training_history.json"
    metadata_path = model_dir / "model_v1_metadata.json"
    
    # Check if this is a sklearn model (no history file)
    if not history_path.exists():
        # Check if metadata exists to determine if model is trained
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)
            
            # sklearn models don't have epoch history, return summary
            metrics = metadata.get('metrics', {})
            return {
                "epochs": 1,
                "model_type": metadata.get('training_config', {}).get('model_type', 'sklearn'),
                "note": "sklearn models do not have epoch-by-epoch training history",
                "history": [],
                "final_metrics": {
                    "accuracy": metrics.get('accuracy', 0),
                    "val_accuracy": metrics.get('accuracy', 0),
                    "loss": metrics.get('loss', 0),
                    "val_loss": metrics.get('loss', 0),
                    "auc": metrics.get('auc'),
                }
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Training history not found. Model may not be trained yet."
            )
    
    with open(history_path) as f:
        history = json.load(f)
    
    # Convert to list of epoch data
    num_epochs = len(history.get('loss', []))
    epoch_data = []
    
    for i in range(num_epochs):
        epoch_data.append(TrainingEpochData(
            epoch=i + 1,
            loss=history['loss'][i],
            val_loss=history['val_loss'][i],
            accuracy=history['accuracy'][i],
            val_accuracy=history['val_accuracy'][i],
            auc=history['auc'][i] if 'auc' in history else None,
            val_auc=history['val_auc'][i] if 'val_auc' in history else None,
            lr=history['lr'][i] if 'lr' in history else None,
        ))
    
    # Final metrics
    final_metrics = {
        'accuracy': history['accuracy'][-1],
        'val_accuracy': history['val_accuracy'][-1],
        'loss': history['loss'][-1],
        'val_loss': history['val_loss'][-1],
    }
    if 'auc' in history:
        final_metrics['auc'] = history['auc'][-1]
        final_metrics['val_auc'] = history['val_auc'][-1]
    
    return TrainingHistoryResponse(
        epochs=num_epochs,
        history=epoch_data,
        final_metrics=final_metrics,
    )


@router.get("/id-verification/curves")
async def get_id_verification_curves():
    """
    Get training curves image.
    
    Returns the pre-generated training curves PNG image.
    """
    model_dir = get_model_dir()
    curves_path = model_dir / "training_curves.png"
    
    if not curves_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Training curves image not found. Model may not be trained yet."
        )
    
    return FileResponse(
        curves_path,
        media_type="image/png",
        filename="training_curves.png"
    )


@router.get("/id-verification/curves-base64", response_model=TrainingCurvesResponse)
async def get_id_verification_curves_base64():
    """
    Get training curves as base64-encoded image.
    
    Useful for embedding directly in frontend without additional requests.
    """
    model_dir = get_model_dir()
    curves_path = model_dir / "training_curves.png"
    
    if not curves_path.exists():
        return TrainingCurvesResponse(available=False)
    
    with open(curves_path, 'rb') as f:
        image_data = f.read()
    
    return TrainingCurvesResponse(
        available=True,
        image_base64=base64.b64encode(image_data).decode('utf-8'),
        content_type="image/png"
    )
