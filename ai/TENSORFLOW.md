# TensorFlow Implementation & Integration

This guide covers the TensorFlow implementation, GPU setup, and integration with the backend API.

---

## Quick Start

### 1. Install TensorFlow

```bash
# Activate environment
conda activate capstone-ai

# Install TensorFlow (CPU version)
conda install -c conda-forge tensorflow

# OR for GPU support (NVIDIA CUDA required)
conda install -c conda-forge tensorflow[and-cuda]

# Verify installation
python -c "import tensorflow as tf; print(f'TensorFlow {tf.__version__}')"
```

### 2. Create .env Configuration

```bash
# Copy the schema
cp ai/.env.schema ai/.env.local

# Edit with your settings
# nano ai/.env.local
```

### 3. Run Training

```bash
# Navigate to project
cd ai

# Train with default settings
python -m training.train --csv datasets/sample_toy.csv --export models/sample_model.h5

# Custom training with arguments
python -m training.train \
  --csv datasets/sample_toy.csv \
  --export models/my_model.h5 \
  --epochs 20 \
  --batch-size 16 \
  --framework tensorflow
```

---

## TensorFlow Implementation Details

### Current Architecture

The training module (`training/train.py`) implements:

```
Input Layer (dynamic)
    ↓
Dense(32, relu) - Feature Learning
    ↓
Dense(16, relu) - Feature Compression
    ↓
Dense(1, sigmoid) - Binary Classification Output
```

**Model Specifications:**
- **Framework**: TensorFlow/Keras Sequential API
- **Optimizer**: Adam (adaptive learning rate)
- **Loss Function**: Binary Cross-Entropy
- **Metrics**: Accuracy
- **Training**: 15 epochs, batch size 32

### Workflow

1. **Data Loading**: `preprocessing.preprocess.load_csv()`
2. **Data Cleaning**: `preprocessing.preprocess.clean_data()`
3. **Preprocessing**: `preprocessing.preprocess.preprocess_for_model()`
   - Train/Val/Test split (80/10/10)
   - StandardScaler normalization
   - Returns dict with all splits + scaler
4. **Training**: 
   - Tries TensorFlow first
   - Falls back to scikit-learn if TF unavailable
5. **Evaluation**: Test accuracy and loss
6. **Export**: Model saved as `.h5` (Keras) or `.pkl` (sklearn)

---

## Configuration with Environment Variables

### Load Environment Variables in Python

```python
import os
from dotenv import load_dotenv

# Load .env.local
load_dotenv('ai/.env.local')

# Access configuration
tf_gpu_enabled = os.getenv('TF_GPU_ENABLED', '0') == '1'
epochs = int(os.getenv('EPOCHS', '15'))
batch_size = int(os.getenv('BATCH_SIZE', '32'))
learning_rate = float(os.getenv('LEARNING_RATE', '0.001'))
random_seed = int(os.getenv('RANDOM_SEED', '42'))
```

### Enhanced Training Script with Config

```python
import os
from dotenv import load_dotenv
import tensorflow as tf
from tensorflow import keras

load_dotenv('ai/.env.local')

def train_with_config(prep, model_path):
    """Train with environment-based configuration"""
    
    # Load config
    epochs = int(os.getenv('EPOCHS', '15'))
    batch_size = int(os.getenv('BATCH_SIZE', '32'))
    learning_rate = float(os.getenv('LEARNING_RATE', '0.001'))
    validation_split = float(os.getenv('VALIDATION_SPLIT', '0.2'))
    
    # Configure TensorFlow
    if os.getenv('TF_GPU_ENABLED') == '1':
        gpus = tf.config.list_physical_devices('GPU')
        print(f'GPUs available: {len(gpus)}')
    
    # Build model
    X_train = prep['X_train']
    input_dim = X_train.shape[1]
    
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(16, activation='relu'),
        keras.layers.Dense(1, activation='sigmoid')
    ])
    
    # Compile with config
    optimizer = keras.optimizers.Adam(learning_rate=float(learning_rate))
    model.compile(
        optimizer=optimizer,
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    # Train with config
    history = model.fit(
        X_train, prep['y_train'],
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(prep['X_val'], prep['y_val']),
        verbose=1
    )
    
    # Evaluate
    loss, acc = model.evaluate(prep['X_test'], prep['y_test'])
    
    # Save
    model.save(model_path)
    
    return {
        'framework': 'tensorflow',
        'accuracy': acc,
        'loss': loss,
        'epochs': epochs,
        'model_path': model_path
    }
```

---

## GPU Setup (Optional)

### System Requirements

- **NVIDIA GPU** (CUDA-compatible, compute capability 3.5+)
- **CUDA Toolkit** 11.8+
- **cuDNN** 8.6+

### Installation Steps

#### 1. Install CUDA & cuDNN

**Windows:**
```bash
# Using conda (easiest)
conda install -c conda-forge cudatoolkit=11.8 cudnn=8.6
```

**macOS (with Apple Silicon):**
```bash
# Metal Performance Shaders (automatic with tensorflow-macos)
conda install -c conda-forge tensorflow-macos
```

**Linux:**
```bash
# NVIDIA CUDA Repo
cuda_repo_url=$(distribution=$(. /etc/os-release;echo $ID$VERSION_ID); echo https://developer.download.nvidia.com/compute/cuda/repos/$distribution/x86_64)
apt-key adv --fetch-keys $cuda_repo_url/3bf863cc.pub
apt-get update && apt-get install -y cuda
```

#### 2. Verify GPU Detection

```bash
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

#### 3. Configure GPU Memory

```python
import tensorflow as tf

# List GPUs
gpus = tf.config.list_physical_devices('GPU')
print(f'GPUs detected: {len(gpus)}')

# Option 1: Allow dynamic memory growth (recommended)
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)

# Option 2: Limit GPU memory usage
for gpu in gpus:
    tf.config.set_logical_device_configuration(
        gpu,
        [tf.config.LogicalDeviceConfiguration(memory_limit=2048)])  # 2GB limit
```

---

## Advanced TensorFlow Features

### TensorBoard Visualization

```python
from tensorflow.callbacks import TensorBoard
import os

logdir = os.getenv('TENSORBOARD_LOG_DIR', './logs/tensorboard')
os.makedirs(logdir, exist_ok=True)

tensorboard_callback = TensorBoard(
    log_dir=logdir,
    histogram_freq=1,
    write_graph=True
)

model.fit(
    X_train, y_train,
    callbacks=[tensorboard_callback],
    validation_data=(X_val, y_val)
)

# View results
# tensorboard --logdir=logs/tensorboard
```

### Custom Training Loop

```python
import tensorflow as tf

@tf.function
def train_step(x, y, model, optimizer, loss_fn):
    with tf.GradientTape() as tape:
        logits = model(x, training=True)
        loss = loss_fn(y, logits)
    
    gradients = tape.gradient(loss, model.trainable_weights)
    optimizer.apply_gradients(zip(gradients, model.trainable_weights))
    
    return loss

# Usage
for epoch in range(epochs):
    for x_batch, y_batch in train_dataset:
        loss = train_step(x_batch, y_batch, model, optimizer, loss_fn)
    
    print(f'Epoch {epoch}: loss={loss:.4f}')
```

### Model Export Formats

#### 1. SavedModel Format (Recommended)
```python
# Save
model.save('models/my_model')

# Load
loaded_model = tf.keras.models.load_model('models/my_model')
```

#### 2. HDF5 Format
```python
# Save (weights only)
model.save_weights('models/weights.h5')

# Load
model.load_weights('models/weights.h5')
```

#### 3. TensorFlow Lite (Mobile)
```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

#### 4. ONNX (Cross-platform)
```bash
# Install
pip install tf2onnx

# Convert
python -m tf2onnx.convert \
    --saved-model models/my_model \
    --output_file models/my_model.onnx
```

---

## Backend Integration

### Serve Model via Flask/FastAPI

```python
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from preprocessing.preprocess import load_csv, clean_data

app = Flask(__name__)

# Load model once at startup
MODEL = tf.keras.models.load_model('models/sample_model.h5')
SCALER = None  # Load from preprocessing

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Expected: {'features': [1.0, 2.0, 3.0, 4.0]}
    
    try:
        # Preprocess
        features = np.array(data['features']).reshape(1, -1)
        features_scaled = SCALER.transform(features)
        
        # Predict
        prediction = MODEL.predict(features_scaled, verbose=0)
        
        return jsonify({
            'success': True,
            'prediction': float(prediction[0][0]),
            'confidence': float(max(prediction[0]))
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000)
```

### Backend API Route (Express.js)

```javascript
const express = require('express');
const axios = require('axios');

const router = express.Router();
const MODEL_SERVER = process.env.MODEL_API_URL || 'http://localhost:5000';

router.post('/predict', async (req, res) => {
    try {
        const { features } = req.body;
        
        const response = await axios.post(`${MODEL_SERVER}/predict`, {
            features
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
```

---

## Performance Optimization

### Data Pipeline Optimization

```python
def create_optimized_dataset(X, y, batch_size=32):
    dataset = tf.data.Dataset.from_tensor_slices((X, y))
    
    # Shuffle with buffer
    dataset = dataset.shuffle(buffer_size=10000)
    
    # Batch
    dataset = dataset.batch(batch_size)
    
    # Prefetch (load next batch while processing current)
    dataset = dataset.prefetch(tf.data.AUTOTUNE)
    
    return dataset

train_dataset = create_optimized_dataset(X_train, y_train)
```

### Mixed Precision Training (Faster on compatible GPUs)

```python
from tensorflow.keras import mixed_precision

policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_global_policy(policy)

# Compile with loss_scale
model.compile(
    optimizer=tf.keras.optimizers.Adam(),
    loss=tf.keras.losses.BinaryCrossentropy(from_logits=False),
    metrics=['accuracy']
)
```

### Model Quantization (Smaller size, faster inference)

```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
quantized_tflite_model = converter.convert()

with open('model_quantized.tflite', 'wb') as f:
    f.write(quantized_tflite_model)
```

---

## Troubleshooting

### TensorFlow Not Found
```bash
conda activate capstone-ai
conda install -c conda-forge tensorflow --force-reinstall
```

### GPU Not Detected
```python
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))
# If empty, verify CUDA/cuDNN installation
```

### Out of Memory (OOM)
```python
# Reduce batch size
batch_size = 8

# Limit GPU memory
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)
```

### Slow Training
```python
# Enable mixed precision
from tensorflow.keras import mixed_precision
mixed_precision.set_global_policy('mixed_float16')

# Use data pipeline optimization
dataset = dataset.prefetch(tf.data.AUTOTUNE)

# Reduce validation frequency
model.fit(..., validation_freq=5)  # Validate every 5 epochs
```

---

## References

- [TensorFlow Documentation](https://www.tensorflow.org/docs)
- [Keras API Guide](https://keras.io/api/)
- [TensorFlow GPU Setup](https://www.tensorflow.org/install/gpu)
- [TensorFlow Model Export](https://www.tensorflow.org/guide/saved_model)
- [TensorFlow Performance Guide](https://www.tensorflow.org/guide/performance)
