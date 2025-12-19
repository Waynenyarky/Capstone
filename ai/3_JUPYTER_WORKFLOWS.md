# AI Foundation: Jupyter Notebook Workflows

This guide demonstrates how to use Jupyter Notebook for exploratory data analysis, preprocessing, and model training.

---

## Starting Jupyter

```bash
# Activate environment
conda activate capstone-ai

# Navigate to ai folder
cd ai

# Launch Jupyter
jupyter notebook
```

This opens `http://localhost:8888` in your browser.

---

## Workflow 1: Data Exploration & Preprocessing

Use Jupyter for interactive data analysis before building your model.

### Create a New Notebook
1. In Jupyter, click **New → Python 3**
2. Rename it: `01_data_exploration.ipynb`

### Notebook Content

**Cell 1 - Import Libraries**
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model

# Set display options
pd.set_option('display.max_columns', None)
sns.set_style("darkgrid")
%matplotlib inline
```

**Cell 2 - Load & Inspect Data**
```python
# Load your dataset
df = load_csv('datasets/sample_toy.csv')

print(f"Dataset shape: {df.shape}")
print(f"\nFirst few rows:")
print(df.head())
print(f"\nData types:")
print(df.dtypes)
print(f"\nMissing values:")
print(df.isnull().sum())
```

**Cell 3 - Data Statistics**
```python
# Summary statistics
print(df.describe())

# Check label distribution
print(f"\nLabel distribution:")
print(df['label'].value_counts())
```

**Cell 4 - Visualize Data**
```python
# Distribution of labels
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)
df['label'].value_counts().plot(kind='bar')
plt.title('Label Distribution')
plt.ylabel('Count')

# Numeric features correlation with label
plt.subplot(1, 2, 2)
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
if 'label' in numeric_cols:
    numeric_cols.remove('label')
    corr_with_label = df[numeric_cols + ['label']].corr()['label'].drop('label').sort_values()
    corr_with_label.plot(kind='barh')
    plt.title('Feature Correlation with Label')
    plt.xlabel('Correlation')

plt.tight_layout()
plt.show()
```

**Cell 5 - Data Cleaning**
```python
# Apply preprocessing
df_clean = clean_data(df)
print(f"Cleaned dataset shape: {df_clean.shape}")
print(f"Rows removed: {len(df) - len(df_clean)}")
print(f"Missing values after cleaning:")
print(df_clean.isnull().sum())
```

**Cell 6 - Prepare for Model**
```python
# Preprocess for training
prep = preprocess_for_model(df_clean, label_col='label')

print("Data splits created:")
for key, val in prep.items():
    if isinstance(val, (np.ndarray, list)):
        print(f"  {key}: {val.shape}")
    else:
        print(f"  {key}: {type(val).__name__}")

# Inspect training data
print(f"\nTraining set - Features: {prep['X_train'].shape}, Labels: {prep['y_train'].shape}")
print(f"Validation set - Features: {prep['X_val'].shape}, Labels: {prep['y_val'].shape}")
print(f"Test set - Features: {prep['X_test'].shape}, Labels: {prep['y_test'].shape}")
```

---

## Workflow 2: Model Training with TensorFlow

Create a notebook to train and evaluate models interactively.

### Create Notebook
Name it: `02_model_training.ipynb`

### Notebook Content

**Cell 1 - Setup**
```python
import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model
import matplotlib.pyplot as plt
import os

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
```

**Cell 2 - Load & Prepare Data**
```python
# Load dataset
df = load_csv('datasets/sample_toy.csv')
df = clean_data(df)

# Preprocess
prep = preprocess_for_model(df, label_col='label')

X_train, y_train = prep['X_train'], prep['y_train']
X_val, y_val = prep['X_val'], prep['y_val']
X_test, y_test = prep['X_test'], prep['y_test']

print(f"Training: {X_train.shape}, Validation: {X_val.shape}, Test: {X_test.shape}")
```

**Cell 3 - Build Model**
```python
# Build neural network
input_dim = X_train.shape[1]

model = keras.Sequential([
    keras.layers.Input(shape=(input_dim,)),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')  # Binary classification
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print(model.summary())
```

**Cell 4 - Train Model**
```python
# Train with early stopping
early_stop = keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=3,
    restore_best_weights=True
)

history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=32,
    validation_data=(X_val, y_val),
    callbacks=[early_stop],
    verbose=1
)
```

**Cell 5 - Plot Training History**
```python
# Plot loss and accuracy
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].plot(history.history['loss'], label='Train Loss')
axes[0].plot(history.history['val_loss'], label='Validation Loss')
axes[0].set_title('Model Loss')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Loss')
axes[0].legend()
axes[0].grid()

axes[1].plot(history.history['accuracy'], label='Train Accuracy')
axes[1].plot(history.history['val_accuracy'], label='Validation Accuracy')
axes[1].set_title('Model Accuracy')
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('Accuracy')
axes[1].legend()
axes[1].grid()

plt.tight_layout()
plt.show()
```

**Cell 6 - Evaluate on Test Set**
```python
# Evaluate
loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Loss: {loss:.4f}")
print(f"Test Accuracy: {accuracy:.4f}")

# Get predictions
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob > 0.5).astype(int).flatten()

# Classification metrics
from sklearn.metrics import classification_report, confusion_matrix
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("\nConfusion Matrix:")
print(cm)
```

**Cell 7 - Save Model**
```python
# Create models directory if needed
os.makedirs('models', exist_ok=True)

# Save model
model_path = 'models/tensorflow_model_v1.h5'
model.save(model_path)
print(f"Model saved to {model_path}")

# Also save preprocessing scaler
import joblib
scaler_path = 'models/scaler_v1.pkl'
joblib.dump(prep['scaler'], scaler_path)
print(f"Scaler saved to {scaler_path}")
```

---

## Workflow 3: Model Comparison

Compare TensorFlow vs scikit-learn models interactively.

### Create Notebook
Name it: `03_model_comparison.ipynb`

### Key Cells

**Cell 1-2**: Load and prepare data (same as Workflow 2)

**Cell 3 - TensorFlow Model**
```python
# TensorFlow neural network
from tensorflow import keras

model_tf = keras.Sequential([
    keras.layers.Dense(32, activation='relu', input_shape=(X_train.shape[1],)),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')
])

model_tf.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model_tf.fit(X_train, y_train, epochs=15, batch_size=32, validation_data=(X_val, y_val), verbose=0)

tf_acc = model_tf.evaluate(X_test, y_test, verbose=0)[1]
print(f"TensorFlow Accuracy: {tf_acc:.4f}")
```

**Cell 4 - scikit-learn Model**
```python
# scikit-learn logistic regression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

model_sk = LogisticRegression(max_iter=200)
model_sk.fit(X_train, y_train)

sk_acc = accuracy_score(y_test, model_sk.predict(X_test))
print(f"scikit-learn Accuracy: {sk_acc:.4f}")
```

**Cell 5 - Compare**
```python
# Side-by-side comparison
comparison = pd.DataFrame({
    'Framework': ['TensorFlow', 'scikit-learn'],
    'Accuracy': [tf_acc, sk_acc]
})
print(comparison)

plt.figure(figsize=(8, 4))
plt.bar(comparison['Framework'], comparison['Accuracy'])
plt.ylabel('Accuracy')
plt.title('Model Comparison')
plt.ylim([0, 1])
for i, v in enumerate(comparison['Accuracy']):
    plt.text(i, v + 0.02, f'{v:.4f}', ha='center')
plt.show()
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Run cell | `Shift + Enter` |
| Run all cells | `Ctrl + Shift + Enter` |
| Add cell below | `B` (in command mode) |
| Delete cell | `D D` (in command mode) |
| Convert to Markdown | `M` (in command mode) |
| Convert to Code | `Y` (in command mode) |
| Command Mode | `Esc` |
| Edit Mode | `Enter` |

---

## Best Practices

1. **Use markdown cells** to document your analysis
2. **Write one idea per cell** for easier debugging
3. **Name notebooks clearly** (e.g., `01_`, `02_`, `03_`)
4. **Save frequently** with `Ctrl + S`
5. **Restart kernel** if you get strange errors: Kernel → Restart
6. **Use relative paths** for imports (e.g., `'datasets/file.csv'`)
7. **Export models** from notebooks into the `models/` folder
8. **Document parameters** used for training (learning rate, batch size, etc.)

---

## Tips

- Use `%%time` magic to measure cell execution time
- Use `?function_name` to view documentation
- Use `!pip list` to check installed packages
- Use `%load_ext autoreload; %autoreload 2` for auto-reload imports

---

## Next Steps

1. Copy one of these notebook templates
2. Modify for your dataset
3. Run cells interactively
4. Save trained models to `models/`
5. Integrate with backend via Flask/FastAPI endpoint
