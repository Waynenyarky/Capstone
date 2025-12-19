"""
Enhanced TensorFlow/ML Training Module with Environment Configuration

This module provides configurable training for both TensorFlow and scikit-learn,
with support for environment variables, logging, and advanced features.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
ENV_FILE = os.path.join(os.path.dirname(__file__), '../.env.local')
if os.path.exists(ENV_FILE):
    load_dotenv(ENV_FILE)
    logger.info(f"Loaded environment from {ENV_FILE}")
else:
    logger.warning(f"No .env.local file found at {ENV_FILE}, using defaults")

# Configuration
CONFIG = {
    'framework': os.getenv('MODEL_FRAMEWORK', 'auto'),
    'epochs': int(os.getenv('EPOCHS', '15')),
    'batch_size': int(os.getenv('BATCH_SIZE', '32')),
    'learning_rate': float(os.getenv('LEARNING_RATE', '0.001')),
    'validation_split': float(os.getenv('VALIDATION_SPLIT', '0.2')),
    'test_size': float(os.getenv('TEST_SIZE', '0.2')),
    'random_seed': int(os.getenv('RANDOM_SEED', '42')),
    'gpu_enabled': os.getenv('TF_GPU_ENABLED', '0') == '1',
    'tensorboard_enabled': os.getenv('TENSORBOARD_ENABLED', 'true').lower() == 'true',
    'tensorboard_log_dir': os.getenv('TENSORBOARD_LOG_DIR', './logs/tensorboard'),
    'export_format': os.getenv('EXPORT_FORMAT', 'h5'),
    'debug': os.getenv('DEBUG', 'false').lower() == 'true'
}

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model


def setup_tensorflow():
    """Configure TensorFlow based on environment variables"""
    try:
        import tensorflow as tf
        
        logger.info("TensorFlow found, configuring...")
        
        # Set logging level
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = os.getenv('TF_CPP_MIN_LOG_LEVEL', '2')
        
        # Configure GPU
        if CONFIG['gpu_enabled']:
            gpus = tf.config.list_physical_devices('GPU')
            if gpus:
                logger.info(f"GPUs detected: {len(gpus)}")
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
            else:
                logger.warning("GPU requested but no GPUs found")
        else:
            logger.info("GPU disabled (TF_GPU_ENABLED=0)")
        
        return tf
    except ImportError:
        logger.warning("TensorFlow not available")
        return None


def train_with_tensorflow(prep, model_path, callbacks=None):
    """
    Train with TensorFlow/Keras
    
    Args:
        prep (dict): Preprocessed data from preprocess_for_model()
        model_path (str): Path to save model
        callbacks (list): Optional Keras callbacks
    
    Returns:
        dict: Training results with metrics
    """
    tf = setup_tensorflow()
    if tf is None:
        raise ImportError('TensorFlow not available')
    
    from tensorflow import keras
    
    logger.info("Training with TensorFlow...")
    
    # Prepare data
    X_train, y_train = prep['X_train'], prep['y_train']
    X_val, y_val = prep['X_val'], prep['y_val']
    X_test, y_test = prep['X_test'], prep['y_test']
    
    input_dim = X_train.shape[1]
    
    logger.info(f"Model input dimension: {input_dim}")
    logger.info(f"Training samples: {len(X_train)}")
    logger.info(f"Validation samples: {len(X_val)}")
    logger.info(f"Test samples: {len(X_test)}")
    
    # Build model
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(32, activation='relu', name='dense_1'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(16, activation='relu', name='dense_2'),
        keras.layers.Dropout(0.1),
        keras.layers.Dense(1, activation='sigmoid', name='output')
    ])
    
    # Compile with config
    optimizer = keras.optimizers.Adam(learning_rate=CONFIG['learning_rate'])
    model.compile(
        optimizer=optimizer,
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    # Build callbacks list
    model_callbacks = callbacks or []
    
    # TensorBoard callback
    if CONFIG['tensorboard_enabled']:
        os.makedirs(CONFIG['tensorboard_log_dir'], exist_ok=True)
        tensorboard_cb = keras.callbacks.TensorBoard(
            log_dir=CONFIG['tensorboard_log_dir'],
            histogram_freq=1,
            write_graph=True
        )
        model_callbacks.append(tensorboard_cb)
        logger.info(f"TensorBoard logging enabled: {CONFIG['tensorboard_log_dir']}")
    
    # Early stopping
    early_stop_cb = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True
    )
    model_callbacks.append(early_stop_cb)
    
    # Train
    logger.info(f"Training for {CONFIG['epochs']} epochs, batch size {CONFIG['batch_size']}...")
    history = model.fit(
        X_train, y_train,
        epochs=CONFIG['epochs'],
        batch_size=CONFIG['batch_size'],
        validation_data=(X_val, y_val),
        callbacks=model_callbacks,
        verbose=1 if CONFIG['debug'] else 0
    )
    
    # Evaluate
    logger.info("Evaluating on test set...")
    loss, acc, precision, recall = model.evaluate(X_test, y_test, verbose=0)
    
    # Predictions for detailed metrics
    y_pred_probs = model.predict(X_test, verbose=0)
    y_pred = (y_pred_probs > 0.5).astype(int).flatten()
    
    f1 = f1_score(y_test, y_pred)
    
    # Log results
    logger.info(f"Test Accuracy: {acc:.4f}")
    logger.info(f"Test Precision: {precision:.4f}")
    logger.info(f"Test Recall: {recall:.4f}")
    logger.info(f"Test F1-Score: {f1:.4f}")
    logger.info(f"Test Loss: {loss:.4f}")
    
    # Save model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    model.save(model_path)
    logger.info(f"Model saved to {model_path}")
    
    # Prepare results
    results = {
        'framework': 'tensorflow',
        'accuracy': float(acc),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'loss': float(loss),
        'epochs_trained': len(history.history['loss']),
        'model_path': model_path,
        'timestamp': datetime.now().isoformat(),
        'config': {
            'epochs': CONFIG['epochs'],
            'batch_size': CONFIG['batch_size'],
            'learning_rate': CONFIG['learning_rate']
        }
    }
    
    return results


def train_with_sklearn(prep, model_path):
    """
    Train with scikit-learn (fallback)
    
    Args:
        prep (dict): Preprocessed data from preprocess_for_model()
        model_path (str): Path to save model
    
    Returns:
        dict: Training results with metrics
    """
    from sklearn.linear_model import LogisticRegression
    import joblib
    
    logger.info("Training with scikit-learn...")
    
    # Prepare data
    X_train, y_train = prep['X_train'], prep['y_train']
    X_test, y_test = prep['X_test'], prep['y_test']
    
    logger.info(f"Training samples: {len(X_train)}")
    logger.info(f"Test samples: {len(X_test)}")
    
    # Train
    clf = LogisticRegression(
        max_iter=200,
        random_state=CONFIG['random_seed'],
        verbose=1 if CONFIG['debug'] else 0
    )
    clf.fit(X_train, y_train)
    
    # Evaluate
    logger.info("Evaluating on test set...")
    y_pred = clf.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    logger.info(f"Test Accuracy: {acc:.4f}")
    logger.info(f"Test Precision: {precision:.4f}")
    logger.info(f"Test Recall: {recall:.4f}")
    logger.info(f"Test F1-Score: {f1:.4f}")
    
    # Save model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(clf, model_path)
    logger.info(f"Model saved to {model_path}")
    
    # Prepare results
    results = {
        'framework': 'sklearn',
        'accuracy': float(acc),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'model_path': model_path,
        'timestamp': datetime.now().isoformat(),
        'config': {
            'algorithm': 'LogisticRegression',
            'max_iterations': 200
        }
    }
    
    return results


def main(csv_path, export_path, framework=None):
    """
    Main training pipeline
    
    Args:
        csv_path (str): Path to CSV dataset
        export_path (str): Path to save trained model
        framework (str, optional): 'tensorflow', 'sklearn', or 'auto' (default from config)
    
    Returns:
        dict: Training results
    """
    logger.info("=" * 60)
    logger.info("TRAINING PIPELINE")
    logger.info("=" * 60)
    
    # Use provided framework or config default
    framework = framework or CONFIG['framework']
    
    # Load and preprocess data
    logger.info(f"Loading data from {csv_path}...")
    df = load_csv(csv_path)
    logger.info(f"Loaded data shape: {df.shape}")
    
    logger.info("Cleaning data...")
    df = clean_data(df)
    logger.info(f"Cleaned data shape: {df.shape}")
    
    logger.info("Preprocessing data...")
    prep = preprocess_for_model(
        df,
        test_size=CONFIG['test_size'],
        random_state=CONFIG['random_seed']
    )
    logger.info(f"Preprocessing complete")
    
    # Train
    logger.info("=" * 60)
    
    try:
        if framework == 'tensorflow' or framework == 'auto':
            try:
                results = train_with_tensorflow(prep, export_path)
            except ImportError as e:
                if framework == 'auto':
                    logger.warning(f"TensorFlow not available: {e}")
                    logger.info("Falling back to scikit-learn...")
                    results = train_with_sklearn(prep, export_path)
                else:
                    raise
        elif framework == 'sklearn':
            results = train_with_sklearn(prep, export_path)
        else:
            raise ValueError(f"Unknown framework: {framework}")
    
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        raise
    
    # Save results
    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info(json.dumps(results, indent=2))
    logger.info("=" * 60)
    
    # Save metadata
    metadata_path = export_path.rsplit('.', 1)[0] + '_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(results, f, indent=2)
    logger.info(f"Metadata saved to {metadata_path}")
    
    return results


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Train ML models with TensorFlow or scikit-learn'
    )
    parser.add_argument('--csv', required=True, help='Path to CSV dataset')
    parser.add_argument('--export', required=True, help='Path to save model')
    parser.add_argument(
        '--framework',
        choices=['tensorflow', 'sklearn', 'auto'],
        default=None,
        help='Training framework (default: from config)'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=None,
        help='Number of epochs (overrides config)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=None,
        help='Batch size (overrides config)'
    )
    
    args = parser.parse_args()
    
    # Override config if arguments provided
    if args.epochs:
        CONFIG['epochs'] = args.epochs
    if args.batch_size:
        CONFIG['batch_size'] = args.batch_size
    
    try:
        results = main(args.csv, args.export, framework=args.framework)
        sys.exit(0)
    except Exception as e:
        logger.error(f"Failed: {e}")
        sys.exit(1)
