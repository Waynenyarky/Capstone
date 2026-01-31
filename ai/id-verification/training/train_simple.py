#!/usr/bin/env python3
"""
Simple ID Verification Model Training Script

A lightweight training script that works reliably on Apple Silicon Macs
by using sklearn instead of TensorFlow for the classifier.

Uses a simple CNN or sklearn classifier with feature extraction.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import numpy as np
from PIL import Image

# Check for sklearn
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
    from sklearn.preprocessing import StandardScaler
    import joblib
except ImportError:
    print("sklearn not found. Installing...")
    os.system("pip3 install scikit-learn joblib")
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
    from sklearn.preprocessing import StandardScaler
    import joblib

# Constants
IMG_SIZE = 64  # Smaller size for faster processing
SEED = 42


def load_images_from_directory(directory, label, max_images=None):
    """Load images from a directory and return as numpy arrays."""
    images = []
    labels = []
    
    directory = Path(directory)
    if not directory.exists():
        print(f"Warning: Directory {directory} does not exist")
        return np.array([]), np.array([])
    
    image_files = list(directory.glob('*.png')) + list(directory.glob('*.jpg')) + list(directory.glob('*.jpeg'))
    
    if max_images:
        image_files = image_files[:max_images]
    
    for img_path in image_files:
        try:
            img = Image.open(img_path).convert('RGB')
            img = img.resize((IMG_SIZE, IMG_SIZE))
            img_array = np.array(img)
            images.append(img_array)
            labels.append(label)
        except Exception as e:
            print(f"Error loading {img_path}: {e}")
            continue
    
    return np.array(images), np.array(labels)


def extract_features(images):
    """Extract simple features from images."""
    features = []
    
    for img in images:
        # Flatten image
        flat = img.flatten().astype(np.float32) / 255.0
        
        # Calculate some basic statistics for each channel
        r, g, b = img[:,:,0], img[:,:,1], img[:,:,2]
        
        stats = [
            np.mean(r), np.std(r), np.min(r), np.max(r),
            np.mean(g), np.std(g), np.min(g), np.max(g),
            np.mean(b), np.std(b), np.min(b), np.max(b),
            np.mean(img), np.std(img),
        ]
        
        # Combine flattened image with stats
        combined = np.concatenate([flat, stats])
        features.append(combined)
    
    return np.array(features)


def train_model(X_train, y_train, X_val, y_val):
    """Train a classifier."""
    print("\nTraining classifier...")
    
    # Normalize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Train a Gradient Boosting classifier (good balance of speed and accuracy)
    model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=SEED,
        verbose=1
    )
    
    model.fit(X_train_scaled, y_train)
    
    return model, scaler


def evaluate_model(model, scaler, X_val, y_val, class_names):
    """Evaluate the model."""
    X_val_scaled = scaler.transform(X_val)
    
    # Predictions
    y_pred = model.predict(X_val_scaled)
    y_proba = model.predict_proba(X_val_scaled)[:, 1]
    
    # Metrics
    accuracy = accuracy_score(y_val, y_pred)
    auc = roc_auc_score(y_val, y_proba)
    cm = confusion_matrix(y_val, y_pred)
    
    print(f"\n{'='*50}")
    print("Evaluation Results")
    print(f"{'='*50}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"AUC: {auc:.4f}")
    print(f"\nConfusion Matrix:")
    print(cm)
    print(f"\nClassification Report:")
    print(classification_report(y_val, y_pred, target_names=class_names))
    
    return {
        'accuracy': float(accuracy),
        'auc': float(auc),
        'confusion_matrix': cm.tolist(),
        'loss': float(1 - accuracy),  # Pseudo-loss for compatibility
    }


def generate_training_curves(metrics, data_counts, export_path, class_names):
    """Generate training curves visualization for sklearn model."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from sklearn.metrics import ConfusionMatrixDisplay
        
        export_path = Path(export_path)
        curves_path = export_path.parent / 'training_curves.png'
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('ID Verification Model Training Results (sklearn)', fontsize=14, fontweight='bold')
        
        # Plot 1: Performance Metrics Bar Chart
        ax1 = axes[0, 0]
        metric_names = ['Accuracy', 'AUC', 'Precision', 'Recall']
        # Calculate precision and recall from confusion matrix
        cm = np.array(metrics['confusion_matrix'])
        tn, fp, fn, tp = cm[0,0], cm[0,1], cm[1,0], cm[1,1]
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        metric_values = [metrics['accuracy'], metrics['auc'], precision, recall]
        colors = ['#52c41a' if v >= 0.9 else '#faad14' if v >= 0.7 else '#f5222d' for v in metric_values]
        
        bars = ax1.bar(metric_names, metric_values, color=colors, alpha=0.8)
        ax1.set_ylim([0, 1])
        ax1.set_ylabel('Score')
        ax1.set_title('Model Performance Metrics', fontsize=12)
        ax1.axhline(y=0.9, color='green', linestyle='--', alpha=0.5, label='Excellent (0.9)')
        ax1.axhline(y=0.7, color='orange', linestyle='--', alpha=0.5, label='Good (0.7)')
        ax1.legend(loc='lower right')
        
        # Add value labels on bars
        for bar, val in zip(bars, metric_values):
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02, 
                    f'{val:.2%}', ha='center', va='bottom', fontsize=10)
        
        # Plot 2: Confusion Matrix
        ax2 = axes[0, 1]
        cm_display = np.array(metrics['confusion_matrix'])
        im = ax2.imshow(cm_display, cmap='Blues')
        ax2.set_xticks([0, 1])
        ax2.set_yticks([0, 1])
        ax2.set_xticklabels(['Fake', 'Legit'])
        ax2.set_yticklabels(['Fake', 'Legit'])
        ax2.set_xlabel('Predicted')
        ax2.set_ylabel('Actual')
        ax2.set_title('Confusion Matrix', fontsize=12)
        
        # Add text annotations
        for i in range(2):
            for j in range(2):
                text = ax2.text(j, i, cm_display[i, j], ha='center', va='center', 
                               color='white' if cm_display[i, j] > cm_display.max()/2 else 'black',
                               fontsize=14, fontweight='bold')
        
        # Plot 3: Data Distribution
        ax3 = axes[1, 0]
        categories = ['Train\nLegit', 'Train\nFake', 'Val\nLegit', 'Val\nFake']
        counts = [
            data_counts.get('train_legit', 0),
            data_counts.get('train_fake', 0),
            data_counts.get('val_legit', 0),
            data_counts.get('val_fake', 0)
        ]
        colors = ['#52c41a', '#f5222d', '#73d13d', '#ff7875']
        ax3.bar(categories, counts, color=colors, alpha=0.8)
        ax3.set_ylabel('Number of Images')
        ax3.set_title('Training Data Distribution', fontsize=12)
        for i, (cat, count) in enumerate(zip(categories, counts)):
            ax3.text(i, count + max(counts)*0.02, str(count), ha='center', fontsize=10)
        
        # Plot 4: Summary
        ax4 = axes[1, 1]
        ax4.axis('off')
        
        summary_text = (
            f"Training Summary\n"
            f"{'─' * 35}\n"
            f"Model Type: sklearn GradientBoosting\n"
            f"Total Training Images: {data_counts.get('total_train', 0)}\n"
            f"Total Validation Images: {data_counts.get('total_val', 0)}\n"
            f"{'─' * 35}\n"
            f"Final Accuracy: {metrics['accuracy']:.2%}\n"
            f"Final AUC: {metrics['auc']:.4f}\n"
            f"Precision: {precision:.2%}\n"
            f"Recall: {recall:.2%}\n"
            f"{'─' * 35}\n"
            f"Status: {'✅ GOOD FIT' if metrics['accuracy'] > 0.85 else '⚠️ NEEDS IMPROVEMENT'}"
        )
        ax4.text(0.5, 0.5, summary_text, transform=ax4.transAxes, 
                fontsize=11, verticalalignment='center', horizontalalignment='center',
                fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.5))
        
        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        plt.savefig(curves_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"Training curves saved to: {curves_path}")
        return str(curves_path)
        
    except ImportError as e:
        print(f"matplotlib not installed - skipping training curves: {e}")
        return None
    except Exception as e:
        print(f"Warning: Failed to save training curves: {e}")
        return None


def save_model(model, scaler, export_path, metrics, data_counts, class_names):
    """Save the model and metadata."""
    export_path = Path(export_path)
    export_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save model using joblib (sklearn's recommended method)
    model_path = export_path.with_suffix('.joblib')
    joblib.dump({'model': model, 'scaler': scaler, 'class_names': class_names}, model_path)
    print(f"\nModel saved to: {model_path}")
    
    # Generate training curves visualization
    curves_path = generate_training_curves(metrics, data_counts, export_path, class_names)
    
    # Also save as .h5 path placeholder for compatibility
    # Create empty file as marker
    h5_path = export_path.with_suffix('.h5')
    h5_path.touch()
    
    # Calculate training mode
    total_train = data_counts.get('total_train', 0)
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
        'base_model': 'GradientBoosting',
        'img_size': IMG_SIZE,
        'class_names': class_names,
        'metrics': metrics,
        'training_mode': training_mode,
        'training_config': {
            'epochs': 100,  # n_estimators
            'model_type': 'sklearn_gradient_boosting',
        },
        'data_counts': data_counts,
        'fit_status': 'good' if metrics['accuracy'] > 0.7 else 'underfitting',
        'fit_details': f"Model accuracy: {metrics['accuracy']:.2%}. AUC: {metrics['auc']:.4f}",
        'notes': [
            'This model classifies images as legitimate ID documents or fake/wrong documents.',
            'NO government database is used - classification is based on visual appearance only.',
            'Training data consists of synthetic IDs and generated fake documents.',
            'Uses sklearn GradientBoosting classifier for Apple Silicon compatibility.',
        ]
    }
    
    metadata_path = export_path.parent / f"{export_path.stem}_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to: {metadata_path}")
    
    return metadata


def main():
    parser = argparse.ArgumentParser(description='Train ID verification model (simple version)')
    parser.add_argument('--data-dir', '-d', type=str, default='data', help='Data directory')
    parser.add_argument('--export', '-e', type=str, default='../models/id_verification/model_v1.h5', help='Export path')
    parser.add_argument('--epochs', type=int, default=100, help='Number of estimators')
    parser.add_argument('--base-model', '-b', type=str, default='mobilenet', help='Ignored (for compatibility)')
    parser.add_argument('--fine-tune', action='store_true', help='Ignored (for compatibility)')
    parser.add_argument('--fine-tune-epochs', type=int, default=10, help='Ignored (for compatibility)')
    
    args = parser.parse_args()
    
    np.random.seed(SEED)
    
    print(f"\n{'='*50}")
    print("ID Verification Model Training (Simple)")
    print(f"{'='*50}")
    print(f"Data directory: {args.data_dir}")
    print(f"Export path: {args.export}")
    print(f"{'='*50}\n")
    
    data_path = Path(args.data_dir)
    
    # Load training data
    print("Loading training data...")
    X_legit, y_legit = load_images_from_directory(data_path / 'train' / 'legit', label=1)
    X_fake, y_fake = load_images_from_directory(data_path / 'train' / 'fake', label=0)
    
    if len(X_legit) == 0 or len(X_fake) == 0:
        print("Error: No training data found!")
        sys.exit(1)
    
    X_train = np.concatenate([X_legit, X_fake])
    y_train = np.concatenate([y_legit, y_fake])
    
    print(f"Training data: {len(X_legit)} legit, {len(X_fake)} fake")
    
    # Load validation data
    print("Loading validation data...")
    X_val_legit, y_val_legit = load_images_from_directory(data_path / 'val' / 'legit', label=1)
    X_val_fake, y_val_fake = load_images_from_directory(data_path / 'val' / 'fake', label=0)
    
    if len(X_val_legit) == 0 or len(X_val_fake) == 0:
        # Split training data
        print("No validation data found, splitting training data...")
        X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=SEED)
    else:
        X_val = np.concatenate([X_val_legit, X_val_fake])
        y_val = np.concatenate([y_val_legit, y_val_fake])
    
    print(f"Validation data: {len(X_val)} images")
    
    # Extract features
    print("\nExtracting features...")
    X_train_features = extract_features(X_train)
    X_val_features = extract_features(X_val)
    print(f"Feature shape: {X_train_features.shape}")
    
    # Train model
    model, scaler = train_model(X_train_features, y_train, X_val_features, y_val)
    
    # Evaluate
    class_names = ['fake', 'legit']
    metrics = evaluate_model(model, scaler, X_val_features, y_val, class_names)
    
    # Data counts
    data_counts = {
        'train_legit': len(X_legit),
        'train_fake': len(X_fake),
        'val_legit': len(X_val_legit) if len(X_val_legit) > 0 else int(len(X_val) * 0.5),
        'val_fake': len(X_val_fake) if len(X_val_fake) > 0 else int(len(X_val) * 0.5),
        'total_train': len(X_train),
        'total_val': len(X_val),
        'total': len(X_train) + len(X_val),
    }
    
    # Save
    save_model(model, scaler, args.export, metrics, data_counts, class_names)
    
    print(f"\n{'='*50}")
    print("Training Complete!")
    print(f"{'='*50}")
    print(f"Final Accuracy: {metrics['accuracy']:.4f}")
    print(f"Final AUC: {metrics['auc']:.4f}")


if __name__ == '__main__':
    main()
