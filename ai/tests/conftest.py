"""Pytest fixtures for AI prototype tests."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

# Ensure project root is in path for `from ai.validation import ...`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


@pytest.fixture
def dataset_path():
    return Path(__file__).parent.parent / 'datasets' / 'unified_form_validation_dataset.csv'


@pytest.fixture
def df(dataset_path):
    return pd.read_csv(dataset_path)


@pytest.fixture
def preprocessed(df):
    """Preprocess dataset as in notebook."""
    from sklearn.preprocessing import StandardScaler, LabelEncoder

    target_col = 'is_valid'
    exclude = [target_col, 'id', 'missing_field', 'wrong_tax_code', 'invalid_address', 'inconsistent_data', 'missing_prereq']
    feature_cols = [c for c in df.columns if c not in exclude]
    X = df[feature_cols].copy()
    for col in X.select_dtypes(include=['object']).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str).fillna(''))
    for col in X.select_dtypes(include=[np.number]).columns:
        X[col] = X[col].fillna(0)
    y = df[target_col]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y, feature_cols
