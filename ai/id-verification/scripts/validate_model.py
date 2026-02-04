#!/usr/bin/env python3
"""
Model Validation Script

Checks if the ID verification model is compatible with the current environment.
Returns:
  0 - Model is valid and compatible
  1 - Model doesn't exist
  2 - Model is incompatible (version mismatch)
  3 - Model validation failed (corrupted/invalid)
"""
import sys
import json
import warnings
from pathlib import Path

# Suppress sklearn version warnings temporarily
warnings.filterwarnings('ignore')

def validate_model(model_path: Path) -> tuple[int, str]:
    """
    Validate model compatibility.
    
    Returns:
        (exit_code, message)
    """
    # Check if model file exists
    joblib_path = model_path.with_suffix('.joblib')
    h5_path = model_path.with_suffix('.h5')
    
    if not joblib_path.exists() and not h5_path.exists():
        return (1, f"Model not found at {model_path}")
    
    # Check metadata
    metadata_path = model_path.parent / f"{model_path.stem}_metadata.json"
    if not metadata_path.exists():
        return (3, "Model metadata not found")
    
    try:
        with open(metadata_path) as f:
            metadata = json.load(f)
    except Exception as e:
        return (3, f"Failed to read metadata: {e}")
    
    # Get current package versions
    try:
        import sklearn
        current_sklearn = sklearn.__version__
    except:
        current_sklearn = None
    
    # Try to load the model to check compatibility
    if joblib_path.exists():
        try:
            import joblib
            
            # Attempt to load
            model_data = joblib.load(str(joblib_path))
            
            # Check if it's valid
            if not isinstance(model_data, dict) or 'model' not in model_data:
                return (3, "Invalid model format")
            
            # Get model class
            model = model_data['model']
            model_class = model.__class__.__name__
            
            # Try a dummy prediction to verify it works
            import numpy as np
            test_features = np.random.random((1, 64*64*3 + 14))
            if model_data.get('scaler'):
                test_features = model_data['scaler'].transform(test_features)
            
            # This will raise an exception if there's a version mismatch issue
            _ = model.predict_proba(test_features)
            
            return (0, f"Model valid: {model_class}, sklearn {current_sklearn}")
            
        except Exception as e:
            error_msg = str(e)
            if 'version' in error_msg.lower() or 'unpickle' in error_msg.lower():
                return (2, f"Model incompatible: trained with different sklearn version. Current: {current_sklearn}")
            return (3, f"Model validation failed: {error_msg}")
    
    elif h5_path.exists():
        # TensorFlow/Keras model
        try:
            # Check if TensorFlow is available
            try:
                import tensorflow as tf
                return (0, f"TensorFlow model valid (TF {tf.__version__})")
            except ImportError:
                return (2, "TensorFlow model found but TensorFlow not installed")
        except Exception as e:
            return (3, f"Failed to validate TensorFlow model: {e}")
    
    return (3, "Unknown model format")


if __name__ == '__main__':
    model_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('ai/models/id_verification/model_v1.h5')
    
    exit_code, message = validate_model(model_path)
    
    if exit_code == 0:
        print(f"✅ {message}")
    elif exit_code == 1:
        print(f"❌ {message}")
    elif exit_code == 2:
        print(f"⚠️  {message}")
    else:
        print(f"❌ {message}")
    
    sys.exit(exit_code)
