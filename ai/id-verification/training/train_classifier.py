#!/usr/bin/env python3
"""
ID Verification Model Training Script

Trains a binary image classifier to distinguish between legitimate ID documents
and fake/wrong documents using transfer learning.

NO GOVERNMENT DATABASE IS USED - the model only classifies based on visual appearance.
Training data consists of synthetic IDs and generated fake documents.
"""

import os
import sys
import platform

# Detect Apple Silicon
IS_APPLE_SILICON = platform.processor() == 'arm' or platform.machine() == 'arm64'

# CRITICAL: Set Keras backend BEFORE any imports
# Use JAX on Apple Silicon (more stable than TensorFlow), TensorFlow otherwise
if IS_APPLE_SILICON:
    os.environ['KERAS_BACKEND'] = 'jax'
    os.environ['JAX_PLATFORMS'] = 'cpu'  # Use CPU for stability
    print("Apple Silicon detected - using JAX backend for stability")
else:
    os.environ['KERAS_BACKEND'] = 'tensorflow'
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import argparse
import json
from datetime import datetime
from pathlib import Path

import numpy as np

# Keras 3 imports (backend-agnostic)
try:
    import keras
    from keras import layers
    from keras.applications import EfficientNetB0, MobileNetV2
    from keras.callbacks import (
        EarlyStopping,
        ModelCheckpoint,
        ReduceLROnPlateau,
    )
    print(f"Keras {keras.__version__} using {os.environ.get('KERAS_BACKEND', 'tensorflow')} backend")
except ImportError as e:
    print(f"Keras not available: {e}")
    print("Please install Keras: pip install keras")
    sys.exit(1)

# For data loading, we still need TensorFlow's data utilities or use alternatives
try:
    if IS_APPLE_SILICON:
        # Use PIL for image loading on Apple Silicon
        from PIL import Image
        USE_TF_DATA = False
        print("Using PIL for image loading")
    else:
        import tensorflow as tf
        tf.config.set_visible_devices([], 'GPU')  # Use CPU
        USE_TF_DATA = True
except:
    from PIL import Image
    USE_TF_DATA = False
    print("Using PIL for image loading")

# Constants
IMG_SIZE = 224  # Standard size for EfficientNetB0 and MobileNetV2
DEFAULT_EPOCHS = 30
SEED = 42

# Reduce batch size on Apple Silicon to prevent memory issues
if IS_APPLE_SILICON:
    BATCH_SIZE = 8  # Very small batch for stability
else:
    BATCH_SIZE = 32


def count_images_in_directory(directory):
    """Count image files in a directory."""
    count = 0
    for ext in ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.bmp']:
        count += len(list(Path(directory).glob(f'**/{ext}')))
    return count


def create_data_generators(data_dir, img_size=IMG_SIZE, batch_size=BATCH_SIZE, validation_split=0.2):
    """
    Create training and validation data generators with augmentation.
    
    Expects data_dir to have structure:
        data_dir/
            train/
                legit/
                fake/
            val/
                legit/
                fake/
    
    Or if no val folder, will split train automatically.
    
    Returns:
        train_ds, val_ds, class_names, data_counts
    """
    data_path = Path(data_dir)
    train_dir = data_path / 'train'
    val_dir = data_path / 'val'
    
    # Count images for metadata
    data_counts = {
        'train_legit': 0,
        'train_fake': 0,
        'val_legit': 0,
        'val_fake': 0,
        'total_train': 0,
        'total_val': 0,
        'total': 0,
    }
    
    # Check if we have separate train/val or need to split
    if val_dir.exists():
        # Use separate directories
        print(f"Using separate train ({train_dir}) and validation ({val_dir}) directories")
        
        # Count images
        data_counts['train_legit'] = count_images_in_directory(train_dir / 'legit')
        data_counts['train_fake'] = count_images_in_directory(train_dir / 'fake')
        data_counts['val_legit'] = count_images_in_directory(val_dir / 'legit')
        data_counts['val_fake'] = count_images_in_directory(val_dir / 'fake')
        
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_dir,
            labels='inferred',
            label_mode='binary',
            image_size=(img_size, img_size),
            batch_size=batch_size,
            shuffle=True,
            seed=SEED,
        )
        
        val_ds = tf.keras.utils.image_dataset_from_directory(
            val_dir,
            labels='inferred',
            label_mode='binary',
            image_size=(img_size, img_size),
            batch_size=batch_size,
            shuffle=False,
            seed=SEED,
        )
    else:
        # Split training data
        print(f"Splitting data from {train_dir} (validation_split={validation_split})")
        
        # Count images (will be split)
        data_counts['train_legit'] = int(count_images_in_directory(train_dir / 'legit') * (1 - validation_split))
        data_counts['train_fake'] = int(count_images_in_directory(train_dir / 'fake') * (1 - validation_split))
        data_counts['val_legit'] = int(count_images_in_directory(train_dir / 'legit') * validation_split)
        data_counts['val_fake'] = int(count_images_in_directory(train_dir / 'fake') * validation_split)
        
        train_ds = tf.keras.utils.image_dataset_from_directory(
            train_dir,
            labels='inferred',
            label_mode='binary',
            image_size=(img_size, img_size),
            batch_size=batch_size,
            shuffle=True,
            seed=SEED,
            validation_split=validation_split,
            subset='training',
        )
        
        val_ds = tf.keras.utils.image_dataset_from_directory(
            train_dir,
            labels='inferred',
            label_mode='binary',
            image_size=(img_size, img_size),
            batch_size=batch_size,
            shuffle=False,
            seed=SEED,
            validation_split=validation_split,
            subset='validation',
        )
    
    # Calculate totals
    data_counts['total_train'] = data_counts['train_legit'] + data_counts['train_fake']
    data_counts['total_val'] = data_counts['val_legit'] + data_counts['val_fake']
    data_counts['total'] = data_counts['total_train'] + data_counts['total_val']
    
    print(f"Data counts: {data_counts['total_train']} training, {data_counts['total_val']} validation")
    
    # Get class names
    class_names = train_ds.class_names
    print(f"Classes: {class_names}")
    
    # Data augmentation layer
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),  # +/- 10% rotation
        layers.RandomZoom(0.1),      # +/- 10% zoom
        layers.RandomContrast(0.1),  # +/- 10% contrast
        layers.RandomBrightness(0.1),  # +/- 10% brightness
    ], name='data_augmentation')
    
    # Apply augmentation to training data only
    def augment(image, label):
        return data_augmentation(image, training=True), label
    
    train_ds = train_ds.map(augment, num_parallel_calls=tf.data.AUTOTUNE)
    
    # Optimize performance
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)
    
    return train_ds, val_ds, class_names, data_counts


def build_model(base_model_name='efficientnet', num_classes=1, fine_tune_layers=0):
    """
    Build a transfer learning model.
    
    Args:
        base_model_name: 'efficientnet' or 'mobilenet'
        num_classes: 1 for binary classification (sigmoid), >1 for multi-class (softmax)
        fine_tune_layers: Number of layers to fine-tune from the top of the base model
    
    Returns:
        Compiled Keras model
    """
    # Input layer with preprocessing
    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    
    # Select base model
    if base_model_name.lower() == 'efficientnet':
        # EfficientNetB0 includes preprocessing
        base_model = EfficientNetB0(
            include_top=False,
            weights='imagenet',
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
        )
        preprocess = layers.Rescaling(1.0)  # EfficientNet handles its own preprocessing
    else:
        # MobileNetV2 requires preprocessing to [-1, 1]
        base_model = MobileNetV2(
            include_top=False,
            weights='imagenet',
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
        )
        preprocess = layers.Rescaling(1./127.5, offset=-1)  # Scale to [-1, 1]
    
    # Freeze base model initially
    base_model.trainable = False
    
    # Build model
    x = preprocess(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    
    # Output layer
    if num_classes == 1:
        outputs = layers.Dense(1, activation='sigmoid')(x)
        loss = 'binary_crossentropy'
        metrics = ['accuracy', keras.metrics.AUC(name='auc')]
    else:
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        loss = 'sparse_categorical_crossentropy'
        metrics = ['accuracy']
    
    model = keras.Model(inputs, outputs)
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss=loss,
        metrics=metrics,
    )
    
    print(f"Built model with base: {base_model_name}")
    print(f"Total parameters: {model.count_params():,}")
    print(f"Trainable parameters: {sum(tf.keras.backend.count_params(w) for w in model.trainable_weights):,}")
    
    return model, base_model


def fine_tune_model(model, base_model, fine_tune_layers=20, learning_rate=1e-5):
    """
    Unfreeze top layers of base model for fine-tuning.
    
    Args:
        model: The full model
        base_model: The base model (EfficientNet or MobileNet)
        fine_tune_layers: Number of layers to unfreeze from the top
        learning_rate: Learning rate for fine-tuning (should be low)
    """
    # Unfreeze base model
    base_model.trainable = True
    
    # Freeze all layers except the top `fine_tune_layers`
    for layer in base_model.layers[:-fine_tune_layers]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss=model.loss,
        metrics=['accuracy', keras.metrics.AUC(name='auc')],
    )
    
    print(f"Fine-tuning top {fine_tune_layers} layers of base model")
    print(f"Trainable parameters: {sum(tf.keras.backend.count_params(w) for w in model.trainable_weights):,}")
    
    return model


def train_model(model, train_ds, val_ds, epochs, checkpoint_path, log_dir=None, 
                fine_tune=False, base_model=None, fine_tune_epochs=10):
    """
    Train the model with callbacks.
    
    Args:
        model: Keras model to train
        train_ds: Training dataset
        val_ds: Validation dataset
        epochs: Number of epochs for initial training
        checkpoint_path: Path to save best model
        log_dir: Directory for TensorBoard logs
        fine_tune: Whether to fine-tune after initial training
        base_model: Base model for fine-tuning
        fine_tune_epochs: Additional epochs for fine-tuning
    
    Returns:
        Training history
    """
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        ),
        ModelCheckpoint(
            checkpoint_path,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
    ]
    
    if log_dir:
        callbacks.append(TensorBoard(log_dir=log_dir, histogram_freq=1))
    
    print(f"\n{'='*50}")
    print(f"Starting initial training for {epochs} epochs")
    print(f"{'='*50}\n")
    
    # Initial training (base model frozen)
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Fine-tuning phase
    if fine_tune and base_model is not None:
        print(f"\n{'='*50}")
        print(f"Starting fine-tuning for {fine_tune_epochs} epochs")
        print(f"{'='*50}\n")
        
        model = fine_tune_model(model, base_model)
        
        fine_tune_history = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=fine_tune_epochs,
            initial_epoch=len(history.history['loss']),
            callbacks=callbacks,
            verbose=1
        )
        
        # Merge histories
        for key in history.history:
            history.history[key].extend(fine_tune_history.history.get(key, []))
    
    return history, model


def evaluate_model(model, val_ds, class_names):
    """Evaluate the model and print metrics."""
    print(f"\n{'='*50}")
    print("Evaluation Results")
    print(f"{'='*50}\n")
    
    # Evaluate
    results = model.evaluate(val_ds, verbose=0)
    
    print(f"Loss: {results[0]:.4f}")
    print(f"Accuracy: {results[1]:.4f}")
    if len(results) > 2:
        print(f"AUC: {results[2]:.4f}")
    
    # Get predictions for confusion matrix
    y_true = []
    y_pred = []
    
    for images, labels in val_ds:
        predictions = model.predict(images, verbose=0)
        y_true.extend(labels.numpy().flatten())
        y_pred.extend((predictions > 0.5).astype(int).flatten())
    
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    
    # Confusion matrix
    from sklearn.metrics import confusion_matrix, classification_report
    
    cm = confusion_matrix(y_true, y_pred)
    print(f"\nConfusion Matrix:")
    print(cm)
    
    print(f"\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))
    
    return {
        'loss': float(results[0]),
        'accuracy': float(results[1]),
        'auc': float(results[2]) if len(results) > 2 else None,
        'confusion_matrix': cm.tolist(),
    }


def save_training_curves(history, export_path):
    """
    Generate and save training curves (loss and accuracy over epochs).
    
    Args:
        history: Keras training history object
        export_path: Path to model file (curves saved alongside)
    """
    try:
        import matplotlib
        matplotlib.use('Agg')  # Non-interactive backend
        import matplotlib.pyplot as plt
        
        export_path = Path(export_path)
        curves_path = export_path.parent / 'training_curves.png'
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('ID Verification Model Training Results', fontsize=14, fontweight='bold')
        
        epochs = range(1, len(history.history['loss']) + 1)
        
        # Plot 1: Training & Validation Loss
        ax1 = axes[0, 0]
        ax1.plot(epochs, history.history['loss'], 'b-', label='Training Loss', linewidth=2)
        ax1.plot(epochs, history.history['val_loss'], 'r-', label='Validation Loss', linewidth=2)
        ax1.set_title('Loss Over Epochs', fontsize=12)
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend(loc='upper right')
        ax1.grid(True, alpha=0.3)
        
        # Highlight overfitting region if detected
        train_loss = history.history['loss']
        val_loss = history.history['val_loss']
        for i in range(len(train_loss)):
            if val_loss[i] > train_loss[i] * 1.2:  # 20% higher val loss
                ax1.axvline(x=i+1, color='orange', linestyle='--', alpha=0.5)
        
        # Plot 2: Training & Validation Accuracy
        ax2 = axes[0, 1]
        ax2.plot(epochs, history.history['accuracy'], 'b-', label='Training Accuracy', linewidth=2)
        ax2.plot(epochs, history.history['val_accuracy'], 'r-', label='Validation Accuracy', linewidth=2)
        ax2.set_title('Accuracy Over Epochs', fontsize=12)
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Accuracy')
        ax2.set_ylim([0, 1])
        ax2.legend(loc='lower right')
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: Learning Rate (if available)
        ax3 = axes[1, 0]
        if 'lr' in history.history:
            ax3.plot(epochs, history.history['lr'], 'g-', linewidth=2)
            ax3.set_title('Learning Rate Over Epochs', fontsize=12)
            ax3.set_xlabel('Epoch')
            ax3.set_ylabel('Learning Rate')
            ax3.set_yscale('log')
            ax3.grid(True, alpha=0.3)
        else:
            # Show overfitting/underfitting analysis instead
            final_train_loss = train_loss[-1]
            final_val_loss = val_loss[-1]
            gap = final_val_loss - final_train_loss
            
            ax3.bar(['Training', 'Validation'], [final_train_loss, final_val_loss], 
                   color=['blue', 'red'], alpha=0.7)
            ax3.set_title('Final Loss Comparison', fontsize=12)
            ax3.set_ylabel('Loss')
            
            # Add analysis text
            if gap > 0.3:
                status = "⚠️ OVERFITTING: Model memorizes training data"
                color = 'red'
            elif final_train_loss > 0.5:
                status = "⚠️ UNDERFITTING: Model needs more training"
                color = 'orange'
            else:
                status = "✅ GOOD FIT: Model generalizes well"
                color = 'green'
            ax3.text(0.5, -0.15, status, transform=ax3.transAxes, 
                    ha='center', fontsize=10, color=color, fontweight='bold')
            ax3.grid(True, alpha=0.3, axis='y')
        
        # Plot 4: AUC (if available) or Summary Stats
        ax4 = axes[1, 1]
        if 'auc' in history.history:
            ax4.plot(epochs, history.history['auc'], 'b-', label='Training AUC', linewidth=2)
            ax4.plot(epochs, history.history['val_auc'], 'r-', label='Validation AUC', linewidth=2)
            ax4.set_title('AUC Over Epochs', fontsize=12)
            ax4.set_xlabel('Epoch')
            ax4.set_ylabel('AUC')
            ax4.set_ylim([0, 1])
            ax4.legend(loc='lower right')
            ax4.grid(True, alpha=0.3)
        else:
            # Show summary statistics
            ax4.axis('off')
            final_train_acc = history.history['accuracy'][-1]
            final_val_acc = history.history['val_accuracy'][-1]
            
            summary_text = (
                f"Training Summary\n"
                f"{'─' * 30}\n"
                f"Total Epochs: {len(epochs)}\n"
                f"Final Training Accuracy: {final_train_acc:.2%}\n"
                f"Final Validation Accuracy: {final_val_acc:.2%}\n"
                f"Final Training Loss: {train_loss[-1]:.4f}\n"
                f"Final Validation Loss: {val_loss[-1]:.4f}\n"
                f"{'─' * 30}\n"
                f"Accuracy Gap: {(final_train_acc - final_val_acc):.2%}\n"
                f"Loss Gap: {gap:.4f}"
            )
            ax4.text(0.5, 0.5, summary_text, transform=ax4.transAxes, 
                    fontsize=11, verticalalignment='center', horizontalalignment='center',
                    fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.5))
        
        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        plt.savefig(curves_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"Training curves saved to: {curves_path}")
        return str(curves_path)
        
    except ImportError:
        print("matplotlib not installed - skipping training curves")
        return None
    except Exception as e:
        print(f"Warning: Failed to save training curves: {e}")
        return None


def save_training_history(history, export_path):
    """Save raw training history as JSON for later analysis."""
    export_path = Path(export_path)
    history_path = export_path.parent / 'training_history.json'
    
    # Convert numpy types to Python types
    history_dict = {}
    for key, values in history.history.items():
        history_dict[key] = [float(v) for v in values]
    
    with open(history_path, 'w') as f:
        json.dump(history_dict, f, indent=2)
    
    print(f"Training history saved to: {history_path}")
    return str(history_path)


def save_model_with_metadata(model, export_path, class_names, metrics, args, history=None, data_counts=None):
    """Save model and metadata."""
    export_path = Path(export_path)
    export_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save model
    model.save(export_path)
    print(f"\nModel saved to: {export_path}")
    
    # Save training curves and history if available
    curves_path = None
    history_path = None
    if history is not None:
        curves_path = save_training_curves(history, export_path)
        history_path = save_training_history(history, export_path)
    
    # Determine training mode based on data count
    total_train = data_counts.get('total_train', 0) if data_counts else 0
    if total_train <= 250:
        training_mode = 'quick'
    elif total_train <= 600:
        training_mode = 'standard'
    else:
        training_mode = 'full'
    
    # Save metadata
    metadata = {
        'created_at': datetime.now().isoformat(),
        'model_version': f"v1_{datetime.now().strftime('%Y%m%d')}",
        'base_model': args.base_model,
        'img_size': IMG_SIZE,
        'class_names': class_names,
        'metrics': metrics,
        'training_config': {
            'epochs': args.epochs,
            'batch_size': BATCH_SIZE,
            'fine_tune': args.fine_tune,
            'fine_tune_epochs': args.fine_tune_epochs if args.fine_tune else 0,
            'training_mode': training_mode,
        },
        'data_counts': data_counts or {},
        'artifacts': {
            'model_path': str(export_path),
            'curves_path': curves_path,
            'history_path': history_path,
        },
        'notes': [
            'This model classifies images as legitimate ID documents or fake/wrong documents.',
            'NO government database is used - classification is based on visual appearance only.',
            'Training data consists of synthetic IDs and generated fake documents.',
            'The model does NOT verify ID authenticity against any official records.',
        ]
    }
    
    metadata_path = export_path.parent / f"{export_path.stem}_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_path}")
    
    return metadata


def main():
    parser = argparse.ArgumentParser(
        description='Train ID verification model using transfer learning'
    )
    parser.add_argument(
        '--data-dir', '-d',
        type=str,
        default='data',
        help='Directory containing train/ and optionally val/ folders'
    )
    parser.add_argument(
        '--export', '-e',
        type=str,
        default='../models/id_verification/model_v1.h5',
        help='Path to export trained model'
    )
    parser.add_argument(
        '--base-model', '-b',
        type=str,
        default='efficientnet',
        choices=['efficientnet', 'mobilenet'],
        help='Base model for transfer learning'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=DEFAULT_EPOCHS,
        help='Number of training epochs'
    )
    parser.add_argument(
        '--fine-tune',
        action='store_true',
        help='Enable fine-tuning after initial training'
    )
    parser.add_argument(
        '--fine-tune-epochs',
        type=int,
        default=10,
        help='Additional epochs for fine-tuning'
    )
    parser.add_argument(
        '--log-dir',
        type=str,
        default=None,
        help='Directory for TensorBoard logs'
    )
    parser.add_argument(
        '--gpu',
        action='store_true',
        help='Enable GPU training if available'
    )
    
    args = parser.parse_args()
    
    # Configure GPU
    if args.gpu:
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"Found {len(gpus)} GPU(s)")
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
        else:
            print("No GPU found, using CPU")
    else:
        # Disable GPU
        tf.config.set_visible_devices([], 'GPU')
        print("Using CPU")
    
    # Set random seed
    tf.random.set_seed(SEED)
    np.random.seed(SEED)
    
    print(f"\n{'='*50}")
    print("ID Verification Model Training")
    print(f"{'='*50}")
    print(f"Data directory: {args.data_dir}")
    print(f"Export path: {args.export}")
    print(f"Base model: {args.base_model}")
    print(f"Epochs: {args.epochs}")
    print(f"Fine-tune: {args.fine_tune}")
    print(f"{'='*50}\n")
    
    # Create data generators
    train_ds, val_ds, class_names, data_counts = create_data_generators(args.data_dir)
    
    # Build model
    model, base_model = build_model(base_model_name=args.base_model)
    
    # Print model summary
    model.summary()
    
    # Create checkpoint path
    checkpoint_dir = Path(args.export).parent / 'checkpoints'
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / 'best_model.h5'
    
    # Train model
    history, model = train_model(
        model=model,
        train_ds=train_ds,
        val_ds=val_ds,
        epochs=args.epochs,
        checkpoint_path=str(checkpoint_path),
        log_dir=args.log_dir,
        fine_tune=args.fine_tune,
        base_model=base_model,
        fine_tune_epochs=args.fine_tune_epochs,
    )
    
    # Evaluate model
    metrics = evaluate_model(model, val_ds, class_names)
    
    # Save model with metadata (including training curves)
    save_model_with_metadata(model, args.export, class_names, metrics, args, history, data_counts)
    
    print(f"\n{'='*50}")
    print("Training Complete!")
    print(f"{'='*50}")
    print(f"Final Accuracy: {metrics['accuracy']:.4f}")
    if metrics['auc']:
        print(f"Final AUC: {metrics['auc']:.4f}")
    print(f"Model saved to: {args.export}")


if __name__ == '__main__':
    main()
