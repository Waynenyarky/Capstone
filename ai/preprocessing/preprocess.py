
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import os, json

def load_csv(path):
    return pd.read_csv(path)

def clean_data(df):
    # Generic cleaning: drop completely empty columns, drop duplicates, fill na with median for numeric.
    df = df.copy()
    df = df.loc[:, df.notna().any()]
    df = df.drop_duplicates()
    for c in df.columns:
        if df[c].dtype.kind in 'biufc':
            df[c] = df[c].fillna(df[c].median())
    return df

def split_features_label(df, label_col='label'):
    X = df.drop(columns=[label_col])
    y = df[label_col].values
    return X, y

def preprocess_for_model(df, label_col='label', test_size=0.2, val_size=0.1, random_state=42):
    X, y = split_features_label(df, label_col=label_col)
    # simple: numeric features only. If non-numeric exists, user should extend this module.
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    X = X[numeric_cols]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_temp, y_train, y_temp = train_test_split(X_scaled, y, test_size=(test_size+val_size), random_state=random_state, stratify=y)
    relative_val = val_size / (test_size+val_size)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=relative_val, random_state=random_state, stratify=y_temp)
    return dict(X_train=X_train, y_train=y_train, X_val=X_val, y_val=y_val, X_test=X_test, y_test=y_test, scaler=scaler, feature_columns=numeric_cols)

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--csv', required=True)
    args = p.parse_args()
    df = load_csv(args.csv)
    df = clean_data(df)
    prep = preprocess_for_model(df)
    print('Prepared splits: ', {k: v.shape for k,v in prep.items() if isinstance(v, (list, tuple, np.ndarray))})
