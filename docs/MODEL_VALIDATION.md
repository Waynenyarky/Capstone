# AI Model Validation & Auto-Training

## Problem (Fixed)

Previously, the ID verification model could become incompatible with the AI service due to package version mismatches (e.g., sklearn 1.7.2 vs 1.8.0), causing all IDs to be incorrectly rejected.

## Solution

### 1. Automated Model Validation

**File**: `ai/id-verification/scripts/validate_model.py`

- Checks if the model file exists
- Validates model compatibility with current package versions  
- Attempts a test prediction to catch version mismatch issues
- Returns clear exit codes:
  - `0`: Model valid and compatible
  - `1`: Model doesn't exist
  - `2`: Model incompatible (version mismatch)
  - `3`: Model corrupted/invalid

### 2. Smart Auto-Training in start.sh

**File**: `start.sh` (lines 152-217)

When you run `./start.sh`, it now:

1. **Validates the existing model** using `validate_model.py`
2. **Auto-retrains if needed** when:
   - Model doesn't exist
   - Model is incompatible (version mismatch)
   - Model validation fails
3. **Uses quick mode by default** (~200 images, 5 epochs, ~1-2 min)
4. **Shows model info** (version, accuracy, training data size)

### 3. Training Modes

```bash
# Quick training (default if model missing/incompatible)
./start.sh              # Auto-trains in quick mode if needed
./start.sh --retrain    # Force retrain in quick mode

# Full training (better accuracy)
./start.sh --full-train # 1000 images, 30 epochs, ~10-15 min

# Skip AI validation (faster startup for testing)
./start.sh --skip-ai
```

## Technical Details

### Model Format

- **Primary**: sklearn `.joblib` files (compatible with Docker Linux container)
- **Fallback**: TensorFlow `.h5` files (requires TensorFlow installed)
- The system prioritizes sklearn models for consistency

### Validation Process

```python
# Example from validate_model.py
1. Load model file
2. Check metadata
3. Attempt test prediction
4. Catch version mismatch exceptions
5. Return status code
```

### Integration with start.sh

```bash
# Validation flow
if model exists:
    validate_model.py $MODEL_PATH
    if validation fails (exit code 2 or 3):
        echo "Model incompatible - retraining..."
        auto_train.sh --quick
else:
    echo "Model not found - training..."
    auto_train.sh --quick
```

## Benefits

✅ **No more broken models** - Auto-detects and fixes version mismatches  
✅ **Zero manual intervention** - Trains automatically on first run  
✅ **Fast startup** - Quick mode trains in 1-2 minutes  
✅ **Always compatible** - Retrains with current sklearn version  
✅ **Clear feedback** - Shows model status during startup  

## Common Scenarios

### First Time Setup
```bash
./start.sh --dev
# Output:
# 🤖 Checking AI model...
#    ⚠️  Model not found
#    Starting auto-training in QUICK mode (~200 images, 5 epochs)...
#    ✅ Model valid: GradientBoostingClassifier, sklearn 1.8.0
```

### After Package Update
```bash
./start.sh --dev
# Output:
# 🤖 Checking AI model...
#    ⚠️  Model incompatible: trained with different sklearn version
#    🔄 Model incompatible - will retrain automatically...
#    ✅ Model valid: GradientBoostingClassifier, sklearn 1.8.0
```

### Force Retrain for Better Accuracy
```bash
./start.sh --full-train --dev
# Output:
# 🤖 Checking AI model...
#    Forcing FULL model retraining (1000 images, 30 epochs)...
#    This will take 10-15 minutes...
#    ✅ Final Accuracy: 99.00%
```

## Troubleshooting

### Model keeps retraining every startup
- Check if `validate_model.py` has execute permissions: `chmod +x ai/id-verification/scripts/validate_model.py`
- Verify sklearn version in container matches training environment

### "No space left on device" during Docker build
- Clean Docker: `docker system prune -af --volumes`
- The AI service uses sklearn (lightweight) not TensorFlow (large)

### ID verification always fails
- Check AI service logs: `docker logs capstone-ai-service`
- Manually validate model: `python3 ai/id-verification/scripts/validate_model.py ai/models/id_verification/model_v1.h5`
- Force retrain: `./start.sh --retrain`

## Files Modified

- ✅ `start.sh` - Added model validation logic
- ✅ `ai/id-verification/scripts/validate_model.py` - New validation script
- ✅ `backend/services/ai-service/requirements.txt` - Clarified sklearn-only approach

## Next Steps

This system ensures model compatibility going forward. If you upgrade Python packages:

1. The validator will detect incompatibility
2. `start.sh` will auto-retrain with the new versions
3. No manual intervention needed

For production deployments, consider running `./start.sh --full-train` once to get a high-accuracy model (99%+).
