"""
AI Inference Demo

This script demonstrates how to load a trained model and perform inference.
Configuration is read from environment variables for security and flexibility.

Usage:
    python inference_demo.py
    
Environment Variables:
    MODEL_PATH: Path to the trained model file (default: models/sample_model.h5)
    DATA_PATH: Path to input data for inference (default: datasets/sample_toy.csv)
    OUTPUT_PATH: Path to save inference results (default: models/inference_output.csv)
"""

import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from preprocessing.preprocess import load_csv, preprocess_for_model


def load_environment_config():
    """Load configuration from environment variables."""
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env.local'))
    
    config = {
        'model_path': os.getenv('MODEL_PATH', 'models/sample_model.h5'),
        'data_path': os.getenv('DATA_PATH', 'datasets/sample_toy.csv'),
        'output_path': os.getenv('OUTPUT_PATH', 'models/inference_output.csv'),
    }
    
    return config


def load_model(model_path):
    """Load a trained TensorFlow/Keras model."""
    try:
        import tensorflow as tf
        
        # Check if path is relative to current file
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.path.dirname(__file__), model_path)
        
        if not os.path.exists(model_path):
            print(f"[!] Model not found at: {model_path}")
            print("    Using sample model for demonstration purposes.")
            return None
        
        model = tf.keras.models.load_model(model_path)
        print(f"[OK] Model loaded from: {model_path}")
        return model
    
    except ImportError:
        print("[!] TensorFlow not available. Skipping model loading.")
        return None
    except Exception as e:
        print(f"[ERROR] Error loading model: {e}")
        return None


def load_inference_data(data_path):
    """Load data for inference."""
    try:
        # Check if path is relative to current file
        if not os.path.isabs(data_path):
            data_path = os.path.join(os.path.dirname(__file__), data_path)
        
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Data file not found: {data_path}")
        
        df = load_csv(data_path)
        print(f"[OK] Data loaded from: {data_path}")
        print(f"     Shape: {df.shape}")
        return df
    
    except Exception as e:
        print(f"[ERROR] Error loading data: {e}")
        return None


def preprocess_inference_data(df):
    """Preprocess data for inference."""
    try:
        df_processed = preprocess_for_model(df)
        print(f"[OK] Data preprocessed")
        print(f"     Processed shape: {df_processed.shape}")
        return df_processed
    
    except Exception as e:
        print(f"[!] Error preprocessing data: {e}")
        print("    Using raw data for demonstration.")
        return df


def run_inference(model, data):
    """Run inference on preprocessed data."""
    if model is None:
        print("\n[!] No model available. Generating dummy predictions.")
        # Generate dummy predictions for demonstration
        predictions = np.random.rand(len(data), 1)
        return predictions
    
    try:
        predictions = model.predict(data, verbose=0)
        print(f"[OK] Inference completed")
        print(f"     Predictions shape: {predictions.shape}")
        return predictions
    
    except Exception as e:
        print(f"[ERROR] Error during inference: {e}")
        return None


def save_results(df_original, predictions, output_path):
    """Save inference results to CSV."""
    try:
        # Check if path is relative to current file
        if not os.path.isabs(output_path):
            output_path = os.path.join(os.path.dirname(__file__), output_path)
        
        # Create output directory if needed
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create results dataframe
        results_df = df_original.copy()
        
        # Add predictions
        if predictions.ndim == 1:
            results_df['predictions'] = predictions
        else:
            for i in range(predictions.shape[1]):
                results_df[f'prediction_{i}'] = predictions[:, i]
        
        # Save to CSV
        results_df.to_csv(output_path, index=False)
        print(f"[OK] Results saved to: {output_path}")
        return output_path
    
    except Exception as e:
        print(f"[ERROR] Error saving results: {e}")
        return None


def main():
    """Main inference pipeline."""
    print("=" * 60)
    print("AI Inference Demo")
    print("=" * 60)
    
    # Load configuration
    print("\n1. Loading Configuration...")
    config = load_environment_config()
    print(f"  Model path: {config['model_path']}")
    print(f"  Data path: {config['data_path']}")
    print(f"  Output path: {config['output_path']}")
    
    # Load model
    print("\n2. Loading Model...")
    model = load_model(config['model_path'])
    
    # Load data
    print("\n3. Loading Data...")
    df = load_inference_data(config['data_path'])
    if df is None:
        print("[ERROR] Failed to load inference data. Exiting.")
        return
    
    # Preprocess data
    print("\n4. Preprocessing Data...")
    df_processed = preprocess_inference_data(df)
    if df_processed is None:
        print("[ERROR] Failed to preprocess data. Exiting.")
        return
    
    # Run inference
    print("\n5. Running Inference...")
    predictions = run_inference(model, df_processed.values)
    if predictions is None:
        print("[ERROR] Inference failed. Exiting.")
        return
    
    # Save results
    print("\n6. Saving Results...")
    save_results(df, predictions, config['output_path'])
    
    print("\n" + "=" * 60)
    print("Inference Complete!")
    print("=" * 60)
    
    # Display sample results
    print("\nSample Predictions (first 5 rows):")
    results_df = df.copy()
    if predictions.ndim == 1:
        results_df['prediction'] = predictions
    else:
        for i in range(predictions.shape[1]):
            results_df[f'prediction_{i}'] = predictions[:, i]
    
    print(results_df.head())


if __name__ == '__main__':
    main()
