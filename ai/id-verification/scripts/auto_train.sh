#!/bin/bash
#
# Auto-Training Script for ID Verification Model
#
# This script checks if a trained model exists, and if not:
# 1. Generates synthetic training data
# 2. Trains the model
# 3. Saves metrics and training curves
#
# Usage:
#   ./auto_train.sh [--force]  # Use --force to retrain even if model exists
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths (relative to this script's directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
AI_DIR="$PROJECT_ROOT/ai/id-verification"
MODEL_DIR="$PROJECT_ROOT/ai/models/id_verification"
MODEL_PATH="$MODEL_DIR/model_v1.h5"
DATA_DIR="$AI_DIR/data"

# Parse arguments
FORCE_RETRAIN=false
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE_RETRAIN=true
            shift
            ;;
        --quick|-q)
            QUICK_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  ID Verification Auto-Training${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if model already exists
if [ -f "$MODEL_PATH" ] && [ "$FORCE_RETRAIN" = false ]; then
    echo -e "${GREEN}✅ Model already exists at: $MODEL_PATH${NC}"
    echo -e "${YELLOW}   Use --force to retrain${NC}"
    
    # Show model info if metadata exists
    METADATA_PATH="${MODEL_PATH%.h5}_metadata.json"
    if [ -f "$METADATA_PATH" ]; then
        echo ""
        echo -e "${CYAN}Model Info:${NC}"
        python3 -c "import json; m=json.load(open('$METADATA_PATH')); print(f\"  Version: {m.get('model_version', 'unknown')}\"); print(f\"  Created: {m.get('created_at', 'unknown')}\"); acc=m.get('metrics',{}).get('accuracy'); print(f\"  Accuracy: {acc:.2%}\" if acc else '  Accuracy: N/A')"
    fi
    exit 0
fi

# Create directories
mkdir -p "$MODEL_DIR"
mkdir -p "$DATA_DIR/train/legit"
mkdir -p "$DATA_DIR/train/fake"
mkdir -p "$DATA_DIR/val/legit"
mkdir -p "$DATA_DIR/val/fake"

# Check Python and dependencies
echo -e "${CYAN}Checking dependencies...${NC}"
cd "$AI_DIR"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Install dependencies if needed (in virtual environment if available)
if [ -f "requirements.txt" ]; then
    pip3 install -q -r requirements.txt 2>/dev/null || true
fi

# Set data counts based on mode
if [ "$QUICK_MODE" = true ]; then
    TRAIN_COUNT=100
    VAL_COUNT=20
    EPOCHS=5
    echo -e "${YELLOW}⚡ Quick mode: Using minimal data for fast training${NC}"
else
    TRAIN_COUNT=500
    VAL_COUNT=100
    EPOCHS=30
fi

# Step 1: Generate synthetic data
echo ""
echo -e "${CYAN}Step 1/3: Generating synthetic training data...${NC}"

# Check if data already exists
EXISTING_LEGIT=$(find "$DATA_DIR/train/legit" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
EXISTING_FAKE=$(find "$DATA_DIR/train/fake" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')

if [ "$EXISTING_LEGIT" -ge "$TRAIN_COUNT" ] && [ "$EXISTING_FAKE" -ge "$TRAIN_COUNT" ] && [ "$FORCE_RETRAIN" = false ]; then
    echo -e "${GREEN}   ✅ Training data already exists (${EXISTING_LEGIT} legit, ${EXISTING_FAKE} fake)${NC}"
else
    echo -e "${BLUE}   Generating $TRAIN_COUNT legit training images...${NC}"
    python3 generators/synthetic_id_generator.py --output "$DATA_DIR/train/legit" --count $TRAIN_COUNT
    
    echo -e "${BLUE}   Generating $TRAIN_COUNT fake training images...${NC}"
    python3 generators/fake_document_collector.py --output "$DATA_DIR/train/fake" --count $TRAIN_COUNT
    
    echo -e "${BLUE}   Generating $VAL_COUNT legit validation images...${NC}"
    python3 generators/synthetic_id_generator.py --output "$DATA_DIR/val/legit" --count $VAL_COUNT
    
    echo -e "${BLUE}   Generating $VAL_COUNT fake validation images...${NC}"
    python3 generators/fake_document_collector.py --output "$DATA_DIR/val/fake" --count $VAL_COUNT
    
    echo -e "${GREEN}   ✅ Data generation complete${NC}"
fi

# Step 2: Train the model
echo ""
echo -e "${CYAN}Step 2/3: Training the model...${NC}"
echo -e "${BLUE}   This may take several minutes...${NC}"

# Detect if running on Apple Silicon
if [[ "$(uname -m)" == "arm64" ]]; then
    echo -e "${YELLOW}   Detected Apple Silicon - using sklearn classifier for stability${NC}"
    
    # Use the simple sklearn-based trainer (no TensorFlow needed)
    python3 training/train_simple.py \
        --data-dir "$DATA_DIR" \
        --export "$MODEL_PATH" \
        --epochs $EPOCHS
else
    # Use TensorFlow on other platforms
    export TF_CPP_MIN_LOG_LEVEL=2
    export TF_ENABLE_ONEDNN_OPTS=0
    
    python3 training/train_classifier.py \
        --data-dir "$DATA_DIR" \
        --export "$MODEL_PATH" \
        --epochs $EPOCHS \
        --base-model efficientnet \
        --fine-tune \
        --fine-tune-epochs 5
fi

echo -e "${GREEN}   ✅ Model training complete${NC}"

# Step 3: Verify the model was created
echo ""
echo -e "${CYAN}Step 3/3: Verifying model...${NC}"

if [ -f "$MODEL_PATH" ]; then
    MODEL_SIZE=$(du -h "$MODEL_PATH" | cut -f1)
    echo -e "${GREEN}   ✅ Model created: $MODEL_PATH ($MODEL_SIZE)${NC}"
    
    # Show metrics
    METADATA_PATH="${MODEL_PATH%.h5}_metadata.json"
    if [ -f "$METADATA_PATH" ]; then
        echo ""
        echo -e "${CYAN}Training Results:${NC}"
        python3 -c "
import json
with open('$METADATA_PATH') as f:
    m = json.load(f)
    metrics = m.get('metrics', {})
    print(f\"  Accuracy: {metrics.get('accuracy', 0):.2%}\")
    print(f\"  AUC: {metrics.get('auc', 0):.4f}\" if metrics.get('auc') else '')
    print(f\"  Loss: {metrics.get('loss', 0):.4f}\")
"
    fi
    
    # Check for training curves
    CURVES_PATH="$MODEL_DIR/training_curves.png"
    if [ -f "$CURVES_PATH" ]; then
        echo -e "${GREEN}   ✅ Training curves saved: $CURVES_PATH${NC}"
    fi
else
    echo -e "${RED}   ❌ Model not found at $MODEL_PATH${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Auto-Training Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
