#!/usr/bin/env bash
# Run BizClear Flutter app on a connected device (e.g. iPad).
# Prereqs: Flutter in PATH, Xcode selected, iPad connected via USB and trusted.

set -e
cd "$(dirname "$0")"

# Ensure Flutter is on PATH (Homebrew)
export PATH="/opt/homebrew/bin:$PATH"

echo "==> Checking Flutter..."
flutter --version

echo ""
echo "==> Devices:"
flutter devices

echo ""
echo "==> Running on device (use the device ID if you have multiple)..."
flutter run --device-timeout=60
