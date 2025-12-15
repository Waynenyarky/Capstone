# AI Foundation: Environment Setup with Anaconda

This guide covers setting up Anaconda, Jupyter Notebook, and TensorFlow for the AI foundation.

## Prerequisites

- **Windows, macOS, or Linux** operating system
- Administrator access to install software
- Internet connection for downloading packages

---

## Step 1: Install Anaconda

### Windows & macOS
1. Download from [anaconda.com](https://www.anaconda.com/download)
2. Run the installer and follow the default installation steps
3. **Important**: During installation, check "Add Anaconda to PATH" (Windows) or use the graphical installer defaults (macOS)
4. Restart your terminal/PowerShell

### Verify Installation
```bash
conda --version
python --version
```

---

## Step 2: Create a Project Environment

Creating a dedicated conda environment isolates dependencies and prevents conflicts.

### Create Environment
```bash
# Navigate to the project root
cd path/to/Capstone

# Create environment with Python 3.10 (recommended for TensorFlow)
conda create -n capstone-ai python=3.10 -y

# Activate environment
conda activate capstone-ai
```

### Windows PowerShell Issue?
If activation fails, run:
```powershell
conda init powershell
# Restart PowerShell and try again
```

---

## Step 3: Install Required Packages

### Install Core Dependencies
```bash
# With environment activated (capstone-ai)
conda install -c conda-forge pandas numpy scikit-learn jupyter notebook -y
```

### Install TensorFlow (Option A: CPU - Faster Setup)
```bash
conda install -c conda-forge tensorflow -y
```

### Install TensorFlow (Option B: GPU - For Fast Training)
Requires NVIDIA GPU and CUDA toolkit:
```bash
# GPU version (NVIDIA only)
conda install -c conda-forge tensorflow[and-cuda] -y
```

### Verify Installation
```bash
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "import jupyter; print(jupyter.__version__)"
```

---

## Step 4: Create environment.yml for Reproducibility

Save your environment configuration:

```bash
# Generate environment file
conda env export > environment.yml
```

**To recreate environment on another machine:**
```bash
conda env create -f environment.yml
conda activate capstone-ai
```

---

## Step 5: Launch Jupyter Notebook

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
