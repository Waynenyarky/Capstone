# Backend Integration Guide

This guide shows how to integrate trained AI models with the Capstone backend API.

---

## Overview

The AI module trains and exports models that the backend can serve as predictions. This guide covers:

1. **Model Export** - Training and saving models
2. **Backend Configuration** - Setting up model paths
3. **API Endpoints** - Creating prediction endpoints
4. **Model Loading** - Loading and serving models
5. **Error Handling** - Handling edge cases

---

## 1. Model Training & Export

### Train a Model

```bash
cd ai
python -m training.train \
    --csv datasets/sample_toy.csv \
    --export models/sample_model.h5
```

This creates:
- `models/sample_model.h5` - Trained model (TensorFlow format)
- `models/sample_model_metadata.json` - Training metadata

### Export Formats

#### TensorFlow (H5) - Default
```bash
# Automatically saved
models/sample_model.h5
```
**Pros**: Lightweight, Fast loading, Good for web
**Cons**: TensorFlow-specific

#### SavedModel Format
```python
model.save('models/sample_model')  # Saved as directory
```
**Pros**: Portable, TensorFlow Serving compatible
**Cons**: Larger file size

#### ONNX Format (Cross-platform)
```bash
python -m tf2onnx.convert \
    --saved-model models/sample_model \
    --output_file models/sample_model.onnx
```
**Pros**: Framework-agnostic, Portable, Fast inference
**Cons**: Extra conversion step

---

## 2. Backend Configuration

### Express.js Setup

#### Step 1: Install Dependencies

```bash
cd backend
npm install @tensorflow/tfjs-node
# or for GPU support:
npm install @tensorflow/tfjs-node-gpu
```

#### Step 2: Create .env Entry

```bash
# backend/.env or backend/.env.local
MODEL_PATH=../ai/models/sample_model.h5
MODEL_SCALER_PATH=../ai/models/sample_model_scaler.pkl
PREDICTION_THRESHOLD=0.5
```

#### Step 3: Create Model Service

```javascript
// backend/src/lib/modelService.js

const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

let model = null;

async function loadModel() {
    try {
        const modelPath = process.env.MODEL_PATH;
        if (!modelPath) {
            console.warn('MODEL_PATH not set, predictions unavailable');
            return null;
        }

        const fullPath = path.resolve(__dirname, modelPath);
        console.log(`Loading model from ${fullPath}`);

        model = await tf.keras.models.load(`file://${fullPath}`);
        console.log('Model loaded successfully');
        return model;
    } catch (error) {
        console.error('Failed to load model:', error);
        return null;
    }
}

async function predict(features) {
    /**
     * Predict using loaded model
     * @param {Array<number>} features - Input features [f1, f2, f3, f4]
     * @returns {Promise<{prediction: number, confidence: number}>}
     */
    if (!model) {
        model = await loadModel();
    }

    if (!model) {
        throw new Error('Model not available');
    }

    try {
        // Ensure features is a 2D tensor [1, num_features]
        const input = tf.tensor2d([features]);
        const output = tf.tidy(() => {
            return model.predict(input);
        });

        const prediction = await output.data();
        const value = prediction[0];

        // Cleanup tensors
        input.dispose();
        output.dispose();

        return {
            prediction: Math.round(value),  // Binary classification
            confidence: value,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Prediction failed: ${error.message}`);
    }
}

async function getModelInfo() {
    if (!model) {
        model = await loadModel();
    }

    if (!model) {
        return null;
    }

    return {
        name: model.name || 'Unknown',
        inputs: model.inputs.map(i => ({
            shape: i.shape,
            dtype: i.dtype
        })),
        outputs: model.outputs.map(o => ({
            shape: o.shape,
            dtype: o.dtype
        })),
        summary: model.summary()
    };
}

module.exports = {
    loadModel,
    predict,
    getModelInfo
};
```

#### Step 4: Create Prediction Route

```javascript
// backend/src/routes/predict.js

const express = require('express');
const router = express.Router();
const { predict, getModelInfo } = require('../lib/modelService');

/**
 * POST /api/predict
 * Make a prediction using the trained model
 * 
 * Body:
 * {
 *   "features": [1.0, 2.0, 3.0, 4.0]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "prediction": 1,
 *   "confidence": 0.85,
 *   "timestamp": "2025-12-20T..."
 * }
 */
router.post('/', async (req, res) => {
    try {
        const { features } = req.body;

        if (!features || !Array.isArray(features)) {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid features array'
            });
        }

        if (features.length !== 4) {
            return res.status(400).json({
                success: false,
                error: 'Expected 4 features, got ' + features.length
            });
        }

        const result = await predict(features);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/predict/model-info
 * Get information about the loaded model
 */
router.get('/model-info', async (req, res) => {
    try {
        const info = await getModelInfo();

        if (!info) {
            return res.status(503).json({
                success: false,
                error: 'Model not available'
            });
        }

        res.json({
            success: true,
            model: info
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
```

#### Step 5: Register Route in Server

```javascript
// backend/server.js

const predictRoutes = require('./src/routes/predict');

app.use('/api/predict', predictRoutes);

// Load model on startup
const { loadModel } = require('./src/lib/modelService');
loadModel();
```

### Python/Flask Alternative

If you prefer Flask instead of Express.js:

```python
# backend/app.py

from flask import Flask, request, jsonify
import tensorflow as tf
import os
import numpy as np

app = Flask(__name__)

# Load model on startup
MODEL = None

def load_model():
    global MODEL
    model_path = os.getenv('MODEL_PATH', '../ai/models/sample_model.h5')
    if os.path.exists(model_path):
        MODEL = tf.keras.models.load_model(model_path)
        print(f'Model loaded from {model_path}')
    else:
        print(f'Model not found at {model_path}')

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        if MODEL is None:
            return jsonify({'success': False, 'error': 'Model not loaded'}), 503

        data = request.json
        features = np.array(data['features']).reshape(1, -1)

        prediction = MODEL.predict(features, verbose=0)
        confidence = float(prediction[0][0])

        return jsonify({
            'success': True,
            'prediction': int(confidence > 0.5),
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/predict/model-info', methods=['GET'])
def model_info():
    if MODEL is None:
        return jsonify({'success': False, 'error': 'Model not loaded'}), 503

    return jsonify({
        'success': True,
        'model': {
            'name': MODEL.name,
            'layers': len(MODEL.layers),
            'trainable_params': int(MODEL.count_params())
        }
    })

if __name__ == '__main__':
    load_model()
    app.run(port=3000)
```

---

## 3. Client-Side Integration

### Web Frontend (React)

```javascript
// frontend/src/hooks/useModelPrediction.js

import { useState } from 'react';

export function useModelPrediction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const predict = async (features) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            setResult(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { predict, loading, error, result };
}

// Usage in component
function PredictionForm() {
    const { predict, loading, result, error } = useModelPrediction();

    const handlePredict = async (e) => {
        e.preventDefault();
        const features = [1.0, 2.0, 3.0, 4.0];  // Get from form
        await predict(features);
    };

    return (
        <div>
            <button onClick={handlePredict} disabled={loading}>
                {loading ? 'Predicting...' : 'Predict'}
            </button>

            {result && (
                <div>
                    <p>Prediction: {result.prediction}</p>
                    <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
                </div>
            )}

            {error && <div className="error">{error}</div>}
        </div>
    );
}
```

---

## 4. Data Preprocessing in Backend

### Load Scaler from AI Module

```javascript
// backend/src/lib/scalerService.js

const fs = require('fs');
const path = require('path');

// For Python-serialized scalers, you'll need to convert to JSON
// See: ai/training/train_enhanced.py for serialization

function loadScalerConfig() {
    const scalerPath = process.env.MODEL_SCALER_PATH;
    if (!scalerPath) {
        console.warn('MODEL_SCALER_PATH not set, skipping scaler');
        return null;
    }

    // Load mean and std from JSON (need to export from Python)
    // See: ai/models/sample_model_scaler.json
    try {
        const fullPath = path.resolve(__dirname, scalerPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to load scaler:', error);
        return null;
    }
}

function scaleFeatures(features, scalerConfig) {
    if (!scalerConfig) return features;

    return features.map((value, idx) => {
        const mean = scalerConfig.mean[idx];
        const std = scalerConfig.std[idx];
        return (value - mean) / std;
    });
}

module.exports = {
    loadScalerConfig,
    scaleFeatures
};
```

### Export Scaler from Python Training

```python
# In training/train_enhanced.py, add this:

import json

def save_scaler_config(scaler, path):
    """Save scaler statistics as JSON for backend use"""
    config = {
        'mean': scaler.mean_.tolist(),
        'std': scaler.scale_.tolist(),
        'feature_names': ['Feature1', 'Feature2', 'Feature3', 'Feature4']
    }
    with open(path, 'w') as f:
        json.dump(config, f)
```

---

## 5. Model Serving Best Practices

### Caching Models

```javascript
// Load once at startup, cache for the session
const modelService = require('./lib/modelService');

app.listen(3000, async () => {
    await modelService.loadModel();
    console.log('Server ready with model loaded');
});
```

### Error Handling

```javascript
router.post('/predict', async (req, res) => {
    try {
        const result = await predict(features);
        res.json({ success: true, ...result });
    } catch (error) {
        // Log error for monitoring
        logger.error('Prediction failed:', error);

        // Return appropriate error to client
        res.status(500).json({
            success: false,
            error: 'Prediction service temporarily unavailable',
            timestamp: new Date().toISOString()
        });
    }
});
```

### Performance Optimization

```javascript
// Batch predictions if possible
async function predictBatch(featuresList) {
    const tensors = featuresList.map(f => tf.tensor2d([f]));
    const concatenated = tf.concat(tensors, 0);
    const predictions = model.predict(concatenated);
    // ... process results
    tensors.forEach(t => t.dispose());
    concatenated.dispose();
    predictions.dispose();
}
```

---

## 6. Testing

### Manual Test

```bash
# Using curl
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1.0, 2.0, 3.0, 4.0]}'
```

### Unit Tests

```javascript
// backend/tests/predict.test.js

const request = require('supertest');
const app = require('../server');

describe('POST /api/predict', () => {
    it('should return a prediction', async () => {
        const response = await request(app)
            .post('/api/predict')
            .send({ features: [1.0, 2.0, 3.0, 4.0] });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('prediction');
        expect(response.body).toHaveProperty('confidence');
    });

    it('should handle invalid input', async () => {
        const response = await request(app)
            .post('/api/predict')
            .send({ features: [1.0, 2.0] });  // Wrong size

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});
```

---

## 7. Monitoring & Logging

### Log Predictions (Optional)

```javascript
// backend/src/middleware/predictionLogger.js

async function logPrediction(req, res, next) {
    // Store prediction request/response for analysis
    const log = {
        timestamp: new Date(),
        features: req.body.features,
        // Add response after calling next middleware
    };

    const originalSend = res.send;
    res.send = function(data) {
        log.response = JSON.parse(data);
        db.collection('predictions').insertOne(log);
        originalSend.call(this, data);
    };

    next();
}

app.use(logPrediction);
```

### Monitor Model Performance

```javascript
// Track prediction accuracy over time
// Compare backend predictions with ground truth labels

async function recordPredictionAccuracy(features, prediction, actual) {
    await db.collection('accuracy_metrics').insertOne({
        timestamp: new Date(),
        prediction,
        actual,
        correct: prediction === actual
    });
}
```

---

## 8. Deployment Checklist

- [ ] Train model: `python -m training.train --csv datasets/data.csv --export models/model.h5`
- [ ] Test locally: `node -e "require('./src/lib/modelService').loadModel()"`
- [ ] Set MODEL_PATH in backend/.env
- [ ] Install TensorFlow.js: `npm install @tensorflow/tfjs-node`
- [ ] Register prediction route in server.js
- [ ] Test API endpoint: `curl http://localhost:3000/api/predict -X POST ...`
- [ ] Add error handling for model loading failures
- [ ] Configure monitoring/logging
- [ ] Set up model versioning (date-based naming)
- [ ] Document API in Swagger/OpenAPI
- [ ] Add rate limiting for predictions

---

## Troubleshooting

### Model Not Loading

```javascript
// Check file exists
const fs = require('fs');
if (!fs.existsSync(modelPath)) {
    console.error('Model file not found:', modelPath);
}

// Check file permissions
fs.accessSync(modelPath, fs.constants.R_OK);
```

### Out of Memory

```javascript
// Cleanup tensors after prediction
const output = tf.tidy(() => {
    return model.predict(input);  // All intermediate tensors auto-disposed
});
```

### Slow Predictions

- Use TensorFlow.js-node (CPU) or TensorFlow.js-node-gpu
- Batch predictions if possible
- Reduce input feature count
- Use quantized models

---

## References

- [TensorFlow.js Guide](https://www.tensorflow.org/js)
- [TensorFlow.js Node](https://github.com/tensorflow/tfjs/tree/master/tfjs-node)
- [Express.js API Guide](https://expressjs.com/)
- [Flask API Guide](https://flask.palletsprojects.com/)

---

**Status**: Ready for production integration
**Last Updated**: December 20, 2025
