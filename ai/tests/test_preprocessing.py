"""Unit tests for preprocessing (feature encoding, scaling)."""
import numpy as np
import pandas as pd
import pytest


def test_dataset_loads_and_has_required_columns(df):
    """Dataset loads and contains required columns."""
    required = ['id', 'is_valid', 'tax_code', 'line_of_business', 'last_name', 'first_name', 'barangay', 'city']
    for col in required:
        assert col in df.columns, f'Missing column: {col}'


def test_preprocessing_produces_numeric_matrix(preprocessed):
    """Preprocessing produces numeric matrix with no NaN."""
    X_scaled, y, feature_cols = preprocessed
    assert X_scaled.dtype in (np.float32, np.float64)
    assert np.isfinite(X_scaled).all()
    assert X_scaled.shape[0] == len(y)
    assert X_scaled.shape[1] == len(feature_cols)


def test_preprocessing_target_is_binary(df):
    """Target is_valid is binary 0/1."""
    vals = df['is_valid'].unique()
    assert set(vals).issubset({0, 1})


def test_preprocessing_scales_to_zero_mean(preprocessed):
    """Scaled features have approximately zero mean."""
    X_scaled, _, _ = preprocessed
    assert np.abs(X_scaled.mean()) < 0.01


def test_preprocessing_no_nan_in_output(preprocessed):
    """No NaN or Inf in preprocessed output."""
    X_scaled, y, _ = preprocessed
    assert not np.isnan(X_scaled).any()
    assert not np.isnan(y).any()
