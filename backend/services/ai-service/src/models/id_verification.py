"""
ID Verification Model Service

Handles loading and inference for the ID verification model.

IMPORTANT: This model does NOT verify IDs against any government database.
It only classifies based on visual appearance - whether an image looks like
a legitimate ID document or not.

Supports both TensorFlow (.h5) and sklearn (.joblib) models.
"""
import os
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

import numpy as np
from PIL import Image

from ..config import settings

logger = logging.getLogger(__name__)

# Global model instance
_model = None
_model_scaler = None  # For sklearn models
_model_type = None  # 'tensorflow' or 'sklearn'
_model_metadata = None

# Image size for sklearn model (smaller for efficiency)
SKLEARN_IMG_SIZE = 64


def get_model_path() -> Path:
    """Get the path to the ID verification model."""
    return Path(settings.ID_VERIFICATION_MODEL_PATH)


def load_model() -> bool:
    """
    Load the ID verification model.
    
    Supports both TensorFlow (.h5) and sklearn (.joblib) models.
    
    Returns:
        True if model loaded successfully, False otherwise.
    """
    global _model, _model_scaler, _model_type, _model_metadata
    
    model_path = get_model_path()
    joblib_path = model_path.with_suffix('.joblib')
    
    # Try loading sklearn model first (preferred for Apple Silicon)
    if joblib_path.exists():
        try:
            import joblib
            
            logger.info(f"Loading sklearn model from {joblib_path}")
            loaded = joblib.load(str(joblib_path))
            _model = loaded['model']
            _model_scaler = loaded.get('scaler')
            _model_type = 'sklearn'
            logger.info("sklearn ID verification model loaded successfully")
            
            # Load metadata
            metadata_path = model_path.parent / f"{model_path.stem}_metadata.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    _model_metadata = json.load(f)
                logger.info(f"Model metadata loaded: version={_model_metadata.get('model_version', 'unknown')}")
            
            return True
            
        except Exception as e:
            logger.warning(f"Failed to load sklearn model: {e}")
    
    # Fall back to TensorFlow model
    if model_path.exists():
        try:
            import tensorflow as tf
            
            logger.info(f"Loading TensorFlow model from {model_path}")
            _model = tf.keras.models.load_model(str(model_path))
            _model_type = 'tensorflow'
            logger.info("TensorFlow ID verification model loaded successfully")
            
            # Load metadata if available
            metadata_path = model_path.parent / f"{model_path.stem}_metadata.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    _model_metadata = json.load(f)
                logger.info(f"Model metadata loaded: version={_model_metadata.get('model_version', 'unknown')}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load TensorFlow model: {e}")
    
    logger.warning(f"ID verification model not found at {model_path} or {joblib_path}")
    logger.info("ID verification will run in mock mode (returning random predictions)")
    _model = None
    _model_type = None
    return False


def is_model_loaded() -> bool:
    """Check if the model is loaded."""
    return _model is not None


def get_model_info() -> Dict[str, Any]:
    """Get information about the loaded model."""
    if _model_metadata:
        return {
            'loaded': True,
            'version': _model_metadata.get('model_version', 'unknown'),
            'created_at': _model_metadata.get('created_at'),
            'base_model': _model_metadata.get('base_model'),
            'img_size': _model_metadata.get('img_size', settings.IMG_SIZE),
            'class_names': _model_metadata.get('class_names', ['fake', 'legit']),
            'notes': _model_metadata.get('notes', []),
        }
    elif _model is not None:
        return {
            'loaded': True,
            'version': 'unknown',
            'notes': ['Model loaded without metadata file'],
        }
    else:
        return {
            'loaded': False,
            'version': None,
            'notes': ['Model not loaded - running in mock mode'],
        }


def preprocess_image_tensorflow(image: Image.Image) -> np.ndarray:
    """Preprocess image for TensorFlow model."""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    image = image.resize((settings.IMG_SIZE, settings.IMG_SIZE), Image.Resampling.LANCZOS)
    img_array = np.array(image, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def preprocess_image_sklearn(image: Image.Image) -> np.ndarray:
    """Preprocess image for sklearn model with feature extraction."""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    image = image.resize((SKLEARN_IMG_SIZE, SKLEARN_IMG_SIZE), Image.Resampling.LANCZOS)
    img_array = np.array(image)
    
    # Extract features (same as training)
    flat = img_array.flatten().astype(np.float32) / 255.0
    
    # Calculate statistics for each channel
    r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
    
    stats = [
        np.mean(r), np.std(r), np.min(r), np.max(r),
        np.mean(g), np.std(g), np.min(g), np.max(g),
        np.mean(b), np.std(b), np.min(b), np.max(b),
        np.mean(img_array), np.std(img_array),
    ]
    
    # Combine flattened image with stats
    features = np.concatenate([flat, stats])
    
    return features.reshape(1, -1)


def _check_document_characteristics(image: Image.Image) -> Tuple[bool, float, list]:
    """
    Check if image has document-like characteristics.
    This helps when the ML model (trained on synthetic data) fails on real photos.
    
    Returns:
        (looks_like_document, confidence_boost, notes)
    """
    notes = []
    confidence_boost = 0.0
    
    width, height = image.size
    aspect_ratio = width / height if height > 0 else 0
    
    # Check 1: ID-like aspect ratio (typical IDs are ~1.5-1.7 width:height)
    # Also accept portrait orientation (0.6-0.7)
    if 1.4 <= aspect_ratio <= 1.8:
        confidence_boost += 0.2
        notes.append("ID-like landscape aspect ratio")
    elif 0.55 <= aspect_ratio <= 0.75:
        confidence_boost += 0.2
        notes.append("ID-like portrait aspect ratio")
    
    # Check 2: Reasonable resolution (not too small, not huge)
    pixels = width * height
    if 50000 <= pixels <= 20000000:  # ~224x224 to ~4500x4500
        confidence_boost += 0.1
        notes.append("Reasonable image resolution")
    
    # Check 3: Image has sufficient detail (not blank/solid color)
    img_array = np.array(image.convert('RGB'))
    std_dev = np.std(img_array)
    if std_dev > 30:  # Has visual variation
        confidence_boost += 0.2
        notes.append("Image has visual detail")
    
    # Check 4: Not predominantly one color (likely a document with text/photos)
    unique_colors = len(np.unique(img_array.reshape(-1, 3), axis=0))
    if unique_colors > 1000:
        confidence_boost += 0.1
        notes.append("Rich color variation (document-like)")
    
    looks_like_document = confidence_boost >= 0.3
    return looks_like_document, min(confidence_boost, 0.5), notes


def predict(image: Image.Image) -> Tuple[bool, float, Optional[str]]:
    """
    Make a prediction on an image.
    
    IMPORTANT: This prediction is based solely on visual appearance.
    It does NOT verify the ID against any government database.
    
    Args:
        image: PIL Image object
        
    Returns:
        Tuple of (is_legit, confidence, document_type)
        - is_legit: True if the image appears to be a legitimate ID
        - confidence: Confidence score (0-1)
        - document_type: Detected document type (optional, may be None)
    """
    global _model, _model_scaler, _model_type
    
    if _model is None:
        # Mock mode - return random prediction for testing
        logger.warning("ID verification model not loaded - returning mock prediction")
        import random
        confidence = random.uniform(0.3, 0.95)
        is_legit = confidence > settings.LEGIT_THRESHOLD
        return is_legit, confidence, None
    
    try:
        # First, check document characteristics (helps with real photos)
        looks_like_doc, doc_confidence_boost, doc_notes = _check_document_characteristics(image)
        
        if _model_type == 'sklearn':
            # sklearn model
            features = preprocess_image_sklearn(image)
            
            # Scale features if scaler is available
            if _model_scaler is not None:
                features = _model_scaler.transform(features)
            
            # Get prediction and probability
            prediction = _model.predict(features)[0]
            probabilities = _model.predict_proba(features)[0]
            
            # Class 1 is 'legit' (label=1 in training)
            model_confidence = float(probabilities[1])  # Probability of legit
            
            # If model gives very low confidence but image looks like a document,
            # boost confidence (model trained on synthetic data struggles with real photos)
            if model_confidence < 0.3 and looks_like_doc:
                logger.info(f"Model uncertain ({model_confidence:.4f}), but image looks like document. Boosting confidence.")
                logger.info(f"Document characteristics: {doc_notes}")
                confidence = min(model_confidence + doc_confidence_boost, 0.85)
                is_legit = confidence >= settings.LEGIT_THRESHOLD
            else:
                confidence = model_confidence
                is_legit = prediction == 1
            
        else:
            # TensorFlow model
            img_array = preprocess_image_tensorflow(image)
            prediction = _model.predict(img_array, verbose=0)
            model_confidence = float(prediction[0][0])
            
            # Apply same boost logic for TensorFlow
            if model_confidence < 0.3 and looks_like_doc:
                confidence = min(model_confidence + doc_confidence_boost, 0.85)
            else:
                confidence = model_confidence
            is_legit = confidence >= settings.LEGIT_THRESHOLD
        
        logger.info(f"ID verification prediction ({_model_type}): legit={is_legit}, confidence={confidence:.4f}")
        if doc_notes:
            logger.info(f"Document analysis: {doc_notes}")
        
        return is_legit, confidence, None
        
    except Exception as e:
        logger.error(f"ID verification prediction failed: {e}")
        raise


def verify_id_images(
    front_image: Optional[Image.Image] = None,
    back_image: Optional[Image.Image] = None
) -> Dict[str, Any]:
    """
    Verify ID images (front and optionally back).
    
    IMPORTANT: This verification is based solely on visual appearance.
    It does NOT verify the ID against any government database.
    
    Args:
        front_image: PIL Image of the front of the ID
        back_image: Optional PIL Image of the back of the ID
        
    Returns:
        Dictionary with verification results
    """
    results = {
        'legit': False,
        'confidence': 0.0,
        'documentType': None,
        'frontResult': None,
        'backResult': None,
        'modelVersion': get_model_info().get('version'),
        'notes': [
            'This verification is based on visual appearance only.',
            'No government database verification is performed.',
        ]
    }
    
    # Verify front image
    if front_image is not None:
        is_legit, confidence, doc_type = predict(front_image)
        results['frontResult'] = {
            'legit': is_legit,
            'confidence': confidence,
            'documentType': doc_type,
        }
        results['legit'] = is_legit
        results['confidence'] = confidence
        results['documentType'] = doc_type
        logger.info(f"Front ID verification: legit={is_legit}, confidence={confidence:.4f}")
    
    # Verify back image if provided
    if back_image is not None:
        is_legit, confidence, doc_type = predict(back_image)
        results['backResult'] = {
            'legit': is_legit,
            'confidence': confidence,
            'documentType': doc_type,
        }
        # Overall result: both must be legit, use minimum confidence
        if results['frontResult'] is not None:
            results['legit'] = results['frontResult']['legit'] and is_legit
            results['confidence'] = min(results['frontResult']['confidence'], confidence)
        else:
            results['legit'] = is_legit
            results['confidence'] = confidence
        logger.info(f"Back ID verification: legit={is_legit}, confidence={confidence:.4f}")
    
    logger.info(f"ID verification complete: legit={results['legit']}, confidence={results['confidence']:.4f}")
    
    return results
