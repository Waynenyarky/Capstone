# AI Foundation: Environment Setup

This guide covers setting up the Anaconda environment for the AI foundation using the committed environment specification.

## Prerequisites

- **Windows, macOS, or Linux** operating system
- **Anaconda or Miniconda** installed ([anaconda.com](https://www.anaconda.com/download))
- Internet connection for downloading packages

---

## Quick Start: Create Environment from Spec

The environment configuration is stored in `ai/environment.yml` and is committed to the repository for reproducibility.

### Step 1: Navigate to Project Root
```bash
cd path/to/Capstone
```

### Step 2: Create Environment from Spec
```bash
conda env create -f ai/environment.yml
```

This will create an environment named `capstone-ai` with all required dependencies.

### Step 3: Activate Environment
```bash
conda activate capstone-ai
```

### Step 4: Verify Installation
```bash
python -c "import tensorflow as tf; print(f'TensorFlow: {tf.__version__}')"
python -c "import jupyter; print(f'Jupyter available')"
python -c "import pandas; print(f'Pandas: {pd.__version__}')"
```

---

## Environment Contents

The `ai/environment.yml` includes:

- **Python 3.10** - Recommended for TensorFlow compatibility
- **Core Data Science**: pandas, numpy, scikit-learn, scipy
- **Deep Learning**: tensorflow (CPU included)
- **Notebooks**: jupyter, jupyterlab, notebook, ipython, ipywidgets
- **Visualization**: matplotlib, seaborn
- **Utilities**: joblib, python-dotenv
- **Development**: pip for any additional packages

---

## Troubleshooting

### Windows PowerShell: Activation Error
If environment activation fails:
```powershell
conda init powershell
# Restart PowerShell and try again
```

### Update Existing Environment
If you need to sync with the latest `ai/environment.yml`:
```bash
conda env update -f ai/environment.yml --prune
```

### Create Fresh Environment
To completely recreate:
```bash
conda env remove -n capstone-ai
conda env create -f ai/environment.yml
```

---

## Next Steps

See the following guides in order:
- **[2_DATA_SETUP.md](2_DATA_SETUP.md)** - Configure datasets and data loading
- **[3_JUPYTER_GUIDE.md](3_JUPYTER_GUIDE.md)** - Run notebooks and explore data
- **[4_MODEL_TRAINING.md](4_MODEL_TRAINING.md)** - Train and evaluate models

### Start Jupyter
```bash
# Make sure capstone-ai environment is activated
conda activate capstone-ai

# Navigate to ai folder
cd ai

# Start Jupyter
jupyter notebook
```

### Access Jupyter
- Browser opens at `http://localhost:8888`
- You can now create and run notebooks
- Notebooks are stored as `.ipynb` files

### Stop Jupyter
- Press `Ctrl+C` in the terminal and confirm

---

## Step 6: Using TensorFlow in Python & Jupyter

### Test TensorFlow
```python
import tensorflow as tf
print(f"TensorFlow version: {tf.__version__}")
print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
```

### Run Training Script
```bash
# From ai/ folder with capstone-ai activated
python -m training.train --csv datasets/sample_toy.csv --export models/sample_model.h5
```

---

## Project Structure with Anaconda

```
ai/
├── environment.yml          # Conda environment file (for sharing)
├── datasets/
│   └── your_data.csv
├── preprocessing/
│   └── preprocess.py
├── training/
│   └── train.py
├── models/
│   └── trained_model.h5
├── notebooks/
│   └── your_analysis.ipynb  # Jupyter notebooks
└── exports/
    └── packaged_models/
```

---

## Troubleshooting

### "conda: command not found"
- Restart terminal/PowerShell after installation
- Verify Anaconda is in PATH: `echo $PATH` (macOS/Linux) or `$env:PATH` (Windows)

### "No module named 'tensorflow'"
```bash
conda activate capstone-ai
conda install -c conda-forge tensorflow -y
```

### Jupyter not starting
```bash
# Reinstall Jupyter
conda install -c conda-forge jupyter notebook --force-reinstall -y

# Try starting again
jupyter notebook
```

### TensorFlow is slow / using CPU
- To use GPU, ensure NVIDIA drivers are installed and reinstall with `tensorflow[and-cuda]`
- Check GPU availability: `python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"`

---

## Next Steps

1. **Start Jupyter**: `jupyter notebook`
2. **Create a new notebook** in the `ai/notebooks/` folder
3. **Follow the examples** in [JUPYTER_WORKFLOWS.md](JUPYTER_WORKFLOWS.md)
4. **Explore your data** before training models
5. **Train and export models** using the training pipeline
