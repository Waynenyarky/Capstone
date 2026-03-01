#!/usr/bin/env bash
# Run BizClear Flutter app on the iOS Simulator (iPad or iPhone).
# Usage: ./run_on_simulator.sh [--iphone | --ipad]   (default: ipad)
# Prereqs: Flutter in PATH, Xcode + Simulator installed.

set -e
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:$PATH"

SIM_NAME="iPad Pro 13-inch (M5)"
for arg in "$@"; do
  case "$arg" in
    --iphone) SIM_NAME="iPhone 17 Pro"; break ;;
    --ipad)   SIM_NAME="iPad Pro 13-inch (M5)"; break ;;
  esac
done

echo "==> Booting $SIM_NAME simulator if needed..."
xcrun simctl boot "$SIM_NAME" 2>/dev/null || true
open -a Simulator 2>/dev/null || true

echo ""
echo "==> Running on $SIM_NAME simulator..."
flutter run -d "$SIM_NAME"
