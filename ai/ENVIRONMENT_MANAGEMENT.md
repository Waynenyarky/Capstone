# Environment Management Guide

This guide covers setting up and managing the `capstone-ai` Anaconda environment using `environment.yml`.

---

## Quick Start

### 1. Create Environment from environment.yml

```bash
# Navigate to the ai folder
cd ai

# Create the environment (one-time setup)
conda env create -f environment.yml

# Activate the environment
conda activate capstone-ai
```

### 2. Verify Installation

```bash
# Check Python version
python --version

# Verify key packages
python -c "import tensorflow as tf; print(f'TensorFlow: {tf.__version__}')"
python -c "import pandas; print(f'Pandas: {pandas.__version__}')"
python -c "import jupyter; print(f'Jupyter: {jupyter.__version__}')"
```

### 3. Launch Jupyter

```bash
# With environment activated
conda activate capstone-ai
cd ai
jupyter notebook
```

Opens browser to `http://localhost:8888`

---

## Environment Details

### Included Packages

| Package | Version | Purpose |
|---------|---------|---------|
| **python** | 3.10 | Core language |
| **pandas** | ≥1.5.0 | Data manipulation & analysis |
| **numpy** | ≥1.23.0 | Numerical computing |
| **scikit-learn** | ≥1.2.0 | Machine learning (classification, regression) |
| **scipy** | ≥1.10.0 | Scientific computing |
| **tensorflow** | ≥2.12.0 | Deep learning framework |
| **jupyter** | ≥1.0.0 | Interactive notebooks |
| **notebook** | ≥7.0.0 | Jupyter Notebook server |
| **jupyterlab** | ≥4.0.0 | Enhanced Jupyter interface (optional) |
| **ipython** | ≥8.10.0 | Enhanced Python shell |
| **matplotlib** | ≥3.7.0 | Plotting library |
| **seaborn** | ≥0.12.0 | Statistical visualization |
| **joblib** | ≥1.2.0 | Model serialization (scikit-learn) |
| **ipywidgets** | ≥8.0.0 | Interactive UI components in notebooks |

---

## Common Tasks

### Update a Package

```bash
# Update a specific package
conda activate capstone-ai
conda update tensorflow

# Update all packages in environment
conda update --all
```

### Add a New Package

```bash
conda activate capstone-ai

# Install from conda-forge
conda install -c conda-forge package_name

# Or from pip (if not available in conda)
pip install package_name
```

### Export Updated Environment

After adding/updating packages, save the new environment state:

```bash
conda activate capstone-ai
conda env export > environment.yml
```

**Commit updated `environment.yml` to version control.**

### Remove Environment

```bash
conda env remove --name capstone-ai
```

### List Installed Packages

```bash
conda activate capstone-ai
conda list
```

### Check Package Location

```bash
conda activate capstone-ai
conda info
```

---

## Platform-Specific Notes

### Windows (PowerShell)

If `conda activate capstone-ai` fails:

```powershell
# Initialize conda for PowerShell (one-time)
conda init powershell

# Restart PowerShell, then try:
conda activate capstone-ai
```

### macOS / Linux

```bash
# Standard activation
conda activate capstone-ai

# If using bash with conda prefix issues:
source activate capstone-ai
```

---

## Troubleshooting

### TensorFlow Not Importing

```bash
# Reinstall TensorFlow
conda activate capstone-ai
conda remove tensorflow
conda install -c conda-forge tensorflow
```

### Jupyter Not Found

```bash
conda activate capstone-ai
conda install jupyter notebook
jupyter notebook
```

### Environment Conflicts

```bash
# Create a fresh environment
conda env remove --name capstone-ai
conda env create -f environment.yml
conda activate capstone-ai
```

### Conda Slow Installation

```bash
# Try using mamba (faster resolver)
conda install mamba
mamba env create -f environment.yml
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: AI Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: conda-incubator/setup-miniconda@v2
        with:
          miniconda-version: latest
          environment-file: ai/environment.yml
          activate-environment: capstone-ai
      - name: Run tests
        run: |
          conda activate capstone-ai
          python -m training.train --csv datasets/sample_toy.csv
```

---

## Reproducibility

The `environment.yml` file locks dependency versions to ensure reproducibility across:

- **Different machines** (Windows, macOS, Linux)
- **Different team members**
- **CI/CD pipelines**
- **Production environments**

**Best Practice:** Keep `environment.yml` updated in version control whenever packages are added/updated.

---

## References

- [Anaconda Documentation](https://docs.anaconda.com/)
- [Conda Environment Management](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)
- [TensorFlow Installation](https://www.tensorflow.org/install)
- [Jupyter Documentation](https://jupyter.org/documentation)
