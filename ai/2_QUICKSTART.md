# AI Quick Start Guide

Get started with the Capstone AI module in 5 minutes.

---

## Prerequisites

- Python 3.10+
- Anaconda/Miniconda
- ~5GB free disk space (for TensorFlow and models)
- Internet connection (for downloading packages)

---

## Installation (5 minutes)

### 1. Set Up Environment

```bash
# Navigate to project
cd c:\Xapolion\Capstone

# Create conda environment
conda env create -f ai/environment.yml

# Activate
conda activate capstone-ai
```

### 2. Verify Installation

```bash
# Test Python
python --version

# Test key packages
python -c "import tensorflow as tf; print(f'TensorFlow {tf.__version__}')"
python -c "import pandas; print(f'Pandas {pandas.__version__}')"
python -c "import jupyter; print('✓ Jupyter ready')"
```

### 3. Configure Environment (Optional)

```bash
# Copy environment template
cp ai/.env.schema ai/.env.local

# Edit settings (optional, defaults work fine)
# nano ai/.env.local
```

---

## Quick Test (2 minutes)

### Run a Quick Training

```bash
cd ai

# Train on sample dataset
python -m training.train \
    --csv datasets/sample_toy.csv \
    --export models/quick_test_model.h5
```

**Expected Output:**
```
TensorFlow model test acc: 0.8234 loss: 0.3456
Training result: {'framework': 'tensorflow', 'accuracy': 0.8234, 'model_path': 'models/quick_test_model.h5'}
```

### Using Scikit-Learn (Fallback)

If TensorFlow is not available, the script automatically falls back:
```
Sklearn model test acc: 0.7890
Training result: {'framework': 'sklearn', 'accuracy': 0.7890, 'model_path': 'models/quick_test_model.pkl'}
```

---

## Launch Jupyter Notebooks

### Start Jupyter

```bash
conda activate capstone-ai
cd ai
jupyter notebook
```

Opens browser to `http://localhost:8888`

### Available Notebooks

1. **00_anaconda_tensorflow_setup.ipynb** - Environment verification
2. **01_data_exploration.ipynb** - Data analysis and visualization
3. **02_model_training.ipynb** - Training experiments
4. **03_jupyter_gui_dashboard.ipynb** - Interactive widgets (NEW)

### Run All Notebooks Example

```bash
# In notebook: load sample data
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model

df = load_csv('datasets/sample_toy.csv')
df = clean_data(df)
prep = preprocess_for_model(df)

print(f"Training set shape: {prep['X_train'].shape}")
print(f"Test set shape: {prep['X_test'].shape}")
```

---

## Training Your Own Data

### Step 1: Prepare CSV

Create `datasets/my_data.csv` with structure:
```csv
Feature1,Feature2,Feature3,label
1.2,3.4,5.6,0
2.1,4.3,6.7,1
```

**Requirements:**
- Must have a `label` column (target variable)
- Numeric features preferred (categorical needs preprocessing)
- No missing values (cleaned automatically)

### Step 2: Train Model

```bash
cd ai
python -m training.train \
    --csv datasets/my_data.csv \
    --export models/my_model.h5
```

### Step 3: Check Results

Model saved to `models/my_model.h5`
- TensorFlow format for deep learning
- Compatible with backend API
- Load with: `tf.keras.models.load_model('models/my_model.h5')`

---

## Common Commands

### Data Exploration

```bash
conda activate capstone-ai
cd ai
python -c "
from preprocessing.preprocess import load_csv, clean_data
df = load_csv('datasets/sample_toy.csv')
print('Shape:', df.shape)
print(df.describe())
"
```

### List Available Models

```bash
ls -la models/
```

### Delete Old Models

```bash
rm models/old_model.h5
```

### Reset Environment

```bash
conda env remove --name capstone-ai
conda env create -f ai/environment.yml
conda activate capstone-ai
```

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'tensorflow'`

**Solution:**
```bash
conda activate capstone-ai
conda install -c conda-forge tensorflow
```

### Issue: Training very slow

**Solution:**
```bash
# Enable GPU (if available)
# Edit ai/.env.local and set TF_GPU_ENABLED=1

# Or reduce data size
python -m training.train \
    --csv datasets/sample_toy.csv \
    --export models/quick_model.h5
```

### Issue: Out of Memory (OOM)

**Solution:**
```bash
# Reduce batch size in code
# Or run preprocessing separately to check data size
python -c "import pandas; df = pandas.read_csv('datasets/my_data.csv'); print(df.memory_usage().sum())"
```

### Issue: `jupyter` command not found

**Solution:**
```bash
conda activate capstone-ai
conda install jupyter
jupyter notebook
```

---

## Integration with Backend

### 1. Export Model Path

```bash
# Train and get path
MODEL_PATH=models/sample_model.h5
```

### 2. Backend API Route

```javascript
// backend/src/routes/predict.js
const tf = require('@tensorflow/tfjs-node');

router.post('/predict', async (req, res) => {
    const model = await tf.loadLayersModel(`file://${process.env.MODEL_PATH}`);
    const prediction = model.predict(req.body.features);
    res.json({ prediction: prediction.dataSync()[0] });
});
```

### 3. Update Backend .env

```bash
MODEL_PATH=../ai/models/sample_model.h5
```

---

## Next Steps

1. **Explore Data**: Launch `01_data_exploration.ipynb`
2. **Train Models**: Run `02_model_training.ipynb`
3. **Build Dashboard**: Use `03_jupyter_gui_dashboard.ipynb`
4. **Deploy**: See backend README for API integration
5. **Optimize**: Read [TENSORFLOW.md](TENSORFLOW.md) for advanced config

---

## Key Files

| File | Purpose |
|------|---------|
| `environment.yml` | Conda environment specification |
| `.env.schema` | Environment variables documentation |
| `TENSORFLOW.md` | TensorFlow implementation guide |
| `ENVIRONMENT_MANAGEMENT.md` | Package management guide |
| `preprocessing/preprocess.py` | Data cleaning & preprocessing |
| `training/train.py` | Training script |
| `notebooks/` | Interactive Jupyter notebooks |
| `datasets/` | Input data (CSV files) |
| `models/` | Trained models (h5/pkl files) |

---

## Performance Expectations

### Sample Data (sample_toy.csv)
- **Training Time**: ~2-5 seconds
- **Accuracy**: 80-90%
- **Model Size**: ~1MB

### Large Data (1M+ rows)
- **Training Time**: 2-10 minutes (CPU), 30s-2min (GPU)
- **Memory**: 2-8GB RAM recommended
- **Model Size**: 5-50MB

---

## Resources

- [TensorFlow Docs](https://www.tensorflow.org/docs) - Official TensorFlow documentation
- [Keras API Guide](https://keras.io/) - Neural network building guide
- [Pandas Documentation](https://pandas.pydata.org/docs/) - Data manipulation
- [Jupyter Documentation](https://jupyter.org/documentation) - Notebook tutorials
- [TENSORFLOW.md](TENSORFLOW.md) - Advanced TensorFlow setup and optimization

---

## Support

- Check **ENVIRONMENT_MANAGEMENT.md** for package issues
- Read **TENSORFLOW.md** for training/GPU issues
- See **JUPYTER_WORKFLOWS.md** for notebook patterns
- Review **INTEGRATION.md** for backend integration

Get started and happy learning! 🚀
