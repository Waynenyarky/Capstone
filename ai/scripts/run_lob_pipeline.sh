#!/usr/bin/env bash
# Run full LOB pipeline: split → train → evaluate (and save metrics).
# Use after updating ai/datasets/lob_recommendation_dataset.json.
#
# Usage:
#   ./ai/scripts/run_lob_pipeline.sh [--dataset PATH] [--no-tune]
#
# Optional env (overridden by args):
#   LOB_DATASET_PATH  — default dataset
#   LOB_NO_TUNE       — set to 1 to skip hyperparameter tuning

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$AI_ROOT")"
cd "$REPO_ROOT"

if [ -f "$AI_ROOT/datasets/lob_recommendation_dataset_balanced_4000.json" ]; then
  DEFAULT_DATASET="$AI_ROOT/datasets/lob_recommendation_dataset_balanced_4000.json"
else
  DEFAULT_DATASET="$AI_ROOT/datasets/lob_recommendation_dataset.json"
fi

DATASET="${LOB_DATASET_PATH:-$DEFAULT_DATASET}"
NO_TUNE="${LOB_NO_TUNE:-0}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dataset)
      DATASET="$2"
      shift 2
      ;;
    --no-tune)
      NO_TUNE=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 [--dataset PATH] [--no-tune]" >&2
      exit 1
      ;;
  esac
done

echo "=== LOB pipeline: split → train → evaluate ==="
echo "Dataset: $DATASET"
echo ""

# 80% train / 20% test for a standard held-out evaluation split
echo "--- 1. Split ---"
python3 "$SCRIPT_DIR/split_lob_dataset.py" --dataset "$DATASET" --test-size 0.2 --seed 42

echo ""
echo "--- 2. Train ---"
if [ "$NO_TUNE" = "1" ]; then
  python3 "$SCRIPT_DIR/train_lob_model.py" --no-tune
else
  python3 "$SCRIPT_DIR/train_lob_model.py"
fi

echo ""
echo "--- 3. Evaluate (and save metrics) ---"
python3 "$SCRIPT_DIR/evaluate_lob_model.py" --output-json "$AI_ROOT/models/evaluation_metrics.json"

echo ""
echo "=== Pipeline complete. Metrics saved to ai/models/evaluation_metrics.json ==="
