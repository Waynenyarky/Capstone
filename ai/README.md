# AI Module - Machine Learning Foundation

A modular, production-ready AI foundation for data science workflows, model training, and backend integration.

## 🚀 Quick Start

**New to this project?** Start here:
- 📖 [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- 🔧 [TENSORFLOW.md](TENSORFLOW.md) - TensorFlow implementation details
- 📋 [ENVIRONMENT_MANAGEMENT.md](ENVIRONMENT_MANAGEMENT.md) - Package management

## 📁 Folder Structure

```
ai/
├── datasets/              # Input CSV datasets
├── preprocessing/         # Data cleaning & feature engineering
├── training/             # Training scripts (TensorFlow + scikit-learn)
├── models/               # Trained models (.h5, .pkl)
├── notebooks/            # Interactive Jupyter notebooks
│   ├── 00_*.ipynb       # Environment setup & verification
│   ├── 01_*.ipynb       # Data exploration & analysis
│   ├── 02_*.ipynb       # Model training experiments
│   └── 03_*.ipynb       # Interactive GUI dashboard (NEW)
├── environment.yml       # Conda environment specification
├── .env.schema          # Environment variables documentation
├── .env.local.example   # Example configuration file
└── requirements.txt     # Alternative pip dependencies
```

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **QUICKSTART.md** | 5-minute setup and first training |
| **TENSORFLOW.md** | Complete TensorFlow guide (GPU, serving, optimization) |
| **ENVIRONMENT_SETUP.md** | Anaconda and Jupyter installation |
| **ENVIRONMENT_MANAGEMENT.md** | Conda package management |
| **JUPYTER_WORKFLOWS.md** | Jupyter notebook tutorials |
| **INTEGRATION.md** | Backend API integration |
| **.env.schema** | Environment variables reference |
| **requirements.txt** | Pip dependencies (alternative to conda) |

## 🎯 Quick Start (Local)

### 1. Setup Environment
```bash
conda env create -f environment.yml
conda activate capstone-ai
```

### 2. Train a Model
```bash
cd ai
python -m training.train --csv datasets/sample_toy.csv --export models/sample_model.h5
```

### 3. Launch Jupyter
```bash
jupyter notebook  # Opens http://localhost:8888
```

## 📊 Key Features

### Data Processing
- **Load & Clean**: `load_csv()`, `clean_data()`
- **Preprocess**: Automatic train/val/test split, feature scaling
- **Flexible**: Supports numeric features, handles missing values

### Model Training
- **TensorFlow**: Sequential models with dropout, early stopping, TensorBoard logging
- **Scikit-learn**: Fallback for simplified workflows
- **Auto Framework**: Try TensorFlow first, fall back to scikit-learn automatically
- **Metrics**: Accuracy, Precision, Recall, F1-Score
- **Metadata**: Automatic training metadata saved as JSON

### Configuration
- **Environment Variables**: Full control via `.env.local`
- **GPU Support**: Automatic NVIDIA GPU detection and optimization
- **Logging**: Detailed training logs with timestamps
- **Callbacks**: Early stopping, TensorBoard visualization

### Interactive Notebooks
- **03_jupyter_gui_dashboard.ipynb**: Build interactive dashboards with ipywidgets
- **Data generation**, **visualization**, **metric tracking**

## 🔧 API Reference

### Data Preprocessing
```python
from preprocessing.preprocess import load_csv, clean_data, preprocess_for_model

df = load_csv('datasets/data.csv')
df = clean_data(df)
prep = preprocess_for_model(df)  # Returns: X_train, y_train, X_val, y_val, X_test, y_test, scaler
```

### Model Training
```python
from training.train_enhanced import main

results = main(
    csv_path='datasets/data.csv',
    export_path='models/model.h5',
    framework='auto'  # 'tensorflow', 'sklearn', or 'auto'
)
# Returns: {accuracy, precision, recall, f1_score, model_path, timestamp, ...}
```

## 🔌 Integration with Backend

### Export Model Path
```bash
MODEL_PATH=../ai/models/sample_model.h5
```

### Express.js Route
```javascript
const tf = require('@tensorflow/tfjs-node');

router.post('/predict', async (req, res) => {
    const model = await tf.loadLayersModel(`file://${process.env.MODEL_PATH}`);
    const prediction = model.predict(req.body.features);
    res.json({ prediction: prediction.dataSync()[0] });
});
```

### Flask API Server
```python
from flask import Flask, request, jsonify
import tensorflow as tf

app = Flask(__name__)
MODEL = tf.keras.models.load_model('models/model.h5')

@app.route('/predict', methods=['POST'])
def predict():
    features = request.json['features']
    prediction = MODEL.predict(features)
    return jsonify({'prediction': float(prediction[0])})
```

## 📝 Dataset Format

Create CSV files in `datasets/`:

```csv
Feature1,Feature2,Feature3,label
1.2,3.4,5.6,0
2.1,4.3,6.7,1
3.5,2.1,7.8,1
```

**Requirements:**
- Must have a `label` column (target variable)
- Numeric features preferred
- Missing values automatically handled

## 🐍 Advanced Training with Enhanced Module

```bash
# Use environment configuration
python -m training.train_enhanced \
    --csv datasets/data.csv \
    --export models/model.h5 \
    --framework tensorflow \
    --epochs 20 \
    --batch-size 16
```

**Features:**
- 📊 Detailed metrics (Precision, Recall, F1)
- 📈 TensorBoard integration
- 💾 Automatic metadata saved as JSON
- 🔧 Full environment variable support
- 🎯 Early stopping and validation

## 🐳 Using Docker (Optional)

Build containerized environment:
```bash
docker build -t capstone-ai .
docker run --gpus all -it capstone-ai
```

## 📈 Performance Expectations

| Dataset | Training Time | Accuracy | Memory |
|---------|--------------|----------|--------|
| sample_toy.csv (1k rows) | 2-5s | 80-90% | <500MB |
| Medium (100k rows) | 30-120s | 75-95% | 2-4GB |
| Large (1M+ rows) | 2-10min (CPU) / 30s-2min (GPU) | 80-98% | 4-8GB |

## 🆘 Troubleshooting

### TensorFlow Not Found
```bash
conda activate capstone-ai
conda install -c conda-forge tensorflow
```

### GPU Not Detected
```bash
# Check GPU availability
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"

# Enable in .env.local
TF_GPU_ENABLED=1
```

### Out of Memory
- Reduce batch size: `BATCH_SIZE=8`
- Use CPU only: `TF_GPU_ENABLED=0`
- Process data in smaller chunks

See [TENSORFLOW.md](TENSORFLOW.md) for more troubleshooting.

## 📚 Extending the Module

### Add Custom Preprocessing
Edit `preprocessing/preprocess.py` to add feature engineering:
```python
def custom_transform(df):
    df['new_feature'] = df['col1'] * df['col2']
    return df
```

### Build Custom Models
Create `models/custom_model.py`:
```python
def build_model(input_dim):
    return keras.Sequential([...])
```

### Use Different Datasets
Place CSV in `datasets/` and train:
```bash
python -m training.train --csv datasets/my_data.csv --export models/my_model.h5
```

## 📞 Support & Resources

- **Setup Issues**: See [ENVIRONMENT_MANAGEMENT.md](ENVIRONMENT_MANAGEMENT.md)
- **Training Help**: Read [TENSORFLOW.md](TENSORFLOW.md)
- **Notebook Tutorials**: Check [JUPYTER_WORKFLOWS.md](JUPYTER_WORKFLOWS.md)
- **Quick Reference**: [QUICKSTART.md](QUICKSTART.md)
- **Backend Integration**: [INTEGRATION.md](INTEGRATION.md)

---

**Ready to start?** → [QUICKSTART.md](QUICKSTART.md)
