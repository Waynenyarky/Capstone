"""Model tests: accuracy >= threshold, confusion matrix sanity."""
import numpy as np
import pytest
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

MIN_ACCURACY = 0.70


def test_model_accuracy_above_threshold(preprocessed):
    """Model accuracy on test set >= MIN_ACCURACY."""
    X_scaled, y, _ = preprocessed
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.3, stratify=y, random_state=42
    )
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    assert acc >= MIN_ACCURACY, f'Accuracy {acc:.3f} < {MIN_ACCURACY}'


def test_confusion_matrix_sanity(preprocessed):
    """Confusion matrix has reasonable structure (no total failure)."""
    X_scaled, y, _ = preprocessed
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.3, stratify=y, random_state=42
    )
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    assert cm.shape == (2, 2)
    assert cm.sum() == len(y_test)
    assert cm.diagonal().sum() > 0, 'Model predicts nothing correctly'


def test_all_six_models_train(preprocessed):
    """All 6 models train without error."""
    from sklearn.svm import SVC
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.linear_model import LogisticRegression
    from xgboost import XGBClassifier
    from sklearn.neural_network import MLPClassifier

    X_scaled, y, _ = preprocessed
    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y, test_size=0.3, stratify=y, random_state=42
    )
    models = {
        'SVM': SVC(kernel='rbf', random_state=42),
        'RF': RandomForestClassifier(n_estimators=100, random_state=42),
        'DT': DecisionTreeClassifier(random_state=42),
        'LR': LogisticRegression(max_iter=1000, random_state=42),
        'XGB': XGBClassifier(random_state=42),
        'NN': MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42),
    }
    for name, model in models.items():
        model.fit(X_train, y_train)
        acc = model.score(X_val, y_val)
        assert 0 <= acc <= 1, f'{name} acc out of range: {acc}'
