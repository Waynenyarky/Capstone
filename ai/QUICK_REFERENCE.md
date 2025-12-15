# Quick Reference: Anaconda, Jupyter & TensorFlow

## Quick Start (5 minutes)

```bash
# 1. Create environment
conda create -n capstone-ai python=3.10 -y

# 2. Activate environment
conda activate capstone-ai

# 3. Install packages
pip install tensorflow pandas scikit-learn jupyter notebook

# 4. Navigate to AI folder
cd ai

# 5. Launch Jupyter
jupyter notebook

# 6. Open http://localhost:8888 in your browser
```

---

## Command Reference

### Conda Commands

| Command | Purpose |
|---------|---------|
| `conda create -n capstone-ai python=3.10 -y` | Create new environment |
| `conda activate capstone-ai` | Activate environment |
| `conda deactivate` | Deactivate environment |
| `conda env list` | List all environments |
| `conda env export -n capstone-ai > environment.yml` | Export environment |
| `conda env create -f environment.yml` | Recreate from file |
| `conda remove -n capstone-ai --all -y` | Delete environment |
| `conda install -n capstone-ai package_name -y` | Install package |

### Jupyter Commands

| Command | Purpose |
|---------|---------|
| `jupyter notebook` | Start Jupyter server |
| `jupyter notebook --notebook-dir=./` | Start with specific directory |
| `jupyter notebook --port 9999` | Start on custom port |
| `jupyter notebook --generate-config` | Generate config file |
| `jupyter nbconvert --to html notebook.ipynb` | Convert to HTML |
| `jupyter nbconvert --to script notebook.ipynb` | Convert to Python |
| `pip install papermill` | Install notebook parameterizer |

### Jupyter Shortcuts (In Notebook)

| Shortcut | Action |
|----------|--------|
| `Shift + Enter` | Run cell |
| `Ctrl + Shift + Enter` | Run all cells |
| `Ctrl + S` | Save notebook |
| `A` (command mode) | Insert cell above |
| `B` (command mode) | Insert cell below |
| `M` (command mode) | Convert to Markdown |
| `Y` (command mode) | Convert to Code |
| `DD` (command mode) | Delete cell |
| `Esc` | Enter command mode |
| `Enter` | Enter edit mode |

### Jupyter Cell Magics

```python
# Time cell execution
%%time

# Run shell command
!pip list

# Run bash
%%bash
echo "hello"

# Capture output
%%capture output
print("captured")

# Load external file
%load path/to/file.py

# Run external script
%run path/to/script.py
```

---

## TensorFlow Workflow

### Check Installation

```python
import tensorflow as tf
print(tf.__version__)
print(tf.config.list_physical_devices('GPU'))
```

### Build Model

```python
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(input_dim,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
```

### Train Model

```python
history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=32,
    validation_data=(X_val, y_val),
    verbose=1
)
```

### Evaluate Model

```python
loss, accuracy = model.evaluate(X_test, y_test)
predictions = model.predict(X_test)
```

### Save & Load

```python
# Save
model.save('model.h5')

# Load
loaded_model = keras.models.load_model('model.h5')

# Export to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

---

## Environment Files

### environment.yml Example
```yaml
name: capstone-ai
channels:
  - conda-forge
dependencies:
  - python=3.10
  - pandas
  - numpy
  - scikit-learn
  - jupyter
  - pip
  - pip:
    - tensorflow==2.13.*
```

### requirements.txt Example
```
tensorflow==2.13.0
pandas==2.0.0
numpy==1.24.0
scikit-learn==1.3.0
jupyter==1.0.0
```

---

## Notebook Structure

### Recommended Organization

```
notebooks/
├── 00_anaconda_tensorflow_setup.ipynb     # Setup & verification
├── 01_data_exploration.ipynb              # EDA
├── 02_model_training.ipynb                # Training & evaluation
├── 03_model_comparison.ipynb              # Compare models
└── README.md                              # Documentation
```

### Notebook Template

```python
# Cell 1: Imports
import pandas as pd
import numpy as np
from preprocessing.preprocess import load_csv, clean_data

# Cell 2: Load Data
df = load_csv('datasets/data.csv')

# Cell 3: Explore
print(df.head())
print(df.info())

# Cell 4: Process
df_clean = clean_data(df)

# Cell 5: Visualize
import matplotlib.pyplot as plt
plt.plot(df_clean['col'])

# Cell 6: Model
# Training code

# Cell 7: Evaluate
# Evaluation code

# Cell 8: Save
import joblib
joblib.dump(model, 'models/model.pkl')
```

---

## Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'tensorflow'"
```bash
conda activate capstone-ai
pip install tensorflow --upgrade
```

### Problem: "jupyter: command not found"
```bash
conda activate capstone-ai
pip install jupyter notebook
```

### Problem: GPU not detected
```python
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))
# If empty, reinstall with CUDA:
# pip install tensorflow[and-cuda]
```

### Problem: Out of memory
```python
# Enable memory growth
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)
```

### Problem: Data leakage between train/val/test
```python
# Verify split sizes
print(f"Train: {len(y_train)}, Val: {len(y_val)}, Test: {len(y_test)}")
print(f"Total: {len(y_train) + len(y_val) + len(y_test)}")
```

---

## Best Practices

1. **Create isolated environments** - Don't use base environment
2. **Export environments** - Share `environment.yml` for reproducibility
3. **Use relative paths** - Makes notebooks portable
4. **Document assumptions** - Add markdown cells explaining logic
5. **Set random seeds** - For reproducible results
6. **Save preprocessing artifacts** - Scaler, encoder for inference
7. **Version your models** - Use naming like `model_v1_20250101.h5`
8. **Track metrics** - Document accuracy, loss, ROC AUC
9. **Save often** - `Ctrl+S` in notebooks
10. **Restart kernel** - When getting strange errors

---

## Links

- [Anaconda Documentation](https://docs.anaconda.com/)
- [Jupyter Documentation](https://jupyter.org/documentation)
- [TensorFlow Documentation](https://www.tensorflow.org/guide)
- [TensorFlow Keras API](https://www.tensorflow.org/api_docs/python/tf/keras)
- [scikit-learn Documentation](https://scikit-learn.org/stable/documentation.html)

---

## File Structure

```
ai/
├── ENVIRONMENT_SETUP.md           # Setup instructions (NEW)
├── JUPYTER_WORKFLOWS.md           # Jupyter examples (UPDATED)
├── README.md
├── INTEGRATION.md
├── datasets/
│   ├── sample_toy.csv
│   └── sample_template.csv
├── preprocessing/
│   └── preprocess.py
├── training/
│   └── train.py
├── models/
│   ├── tensorflow_model.h5
│   ├── sklearn_model.pkl
│   ├── scaler.pkl
│   └── model.tflite
├── notebooks/
│   ├── 00_anaconda_tensorflow_setup.ipynb       (NEW)
│   ├── 01_data_exploration.ipynb                (NEW)
│   ├── 02_model_training.ipynb                  (NEW)
│   └── README_NOTEBOOK.md
└── exports/
```

---

## Quick Links

- **Setup Guide**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Jupyter Workflows**: [JUPYTER_WORKFLOWS.md](JUPYTER_WORKFLOWS.md)
- **Integration**: [INTEGRATION.md](INTEGRATION.md)
- **README**: [README.md](README.md)
