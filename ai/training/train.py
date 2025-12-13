
import os, sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import accuracy_score
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model

def train_with_tensorflow(prep, model_path):
    try:
        import tensorflow as tf
        from tensorflow import keras
    except Exception as e:
        raise ImportError('TensorFlow not available: ' + str(e))
    X_train, y_train = prep['X_train'], prep['y_train']
    X_val, y_val = prep['X_val'], prep['y_val']
    input_dim = X_train.shape[1]
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(16, activation='relu'),
        keras.layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train, y_train, epochs=15, batch_size=32, validation_data=(X_val, y_val), verbose=0)
    # evaluate on test
    X_test, y_test = prep['X_test'], prep['y_test']
    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f'TensorFlow model test acc: {acc:.4f} loss: {loss:.4f}')
    model.save(model_path)
    return dict(framework='tensorflow', accuracy=acc, model_path=model_path)

def train_with_sklearn(prep, model_path):
    from sklearn.linear_model import LogisticRegression
    import joblib
    X_train, y_train = prep['X_train'], prep['y_train']
    X_val, y_val = prep['X_val'], prep['y_val']
    clf = LogisticRegression(max_iter=200)
    clf.fit(X_train, y_train)
    X_test, y_test = prep['X_test'], prep['y_test']
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    joblib.dump(clf, model_path)
    print(f'Sklearn model test acc: {acc:.4f}')
    return dict(framework='sklearn', accuracy=acc, model_path=model_path)

def main(csv_path, export_path):
    df = load_csv(csv_path)
    df = clean_data(df)
    prep = preprocess_for_model(df)
    os.makedirs(os.path.dirname(export_path), exist_ok=True)
    # try TF first
    try:
        res = train_with_tensorflow(prep, export_path)
    except Exception as e:
        print('TensorFlow training failed or not available, falling back to scikit-learn. Error:', e)
        res = train_with_sklearn(prep, export_path)
    print('Training result:', res)

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--csv', required=True)
    p.add_argument('--export', required=True)
    args = p.parse_args()
    main(args.csv, args.export)
