#!/usr/bin/env bash
# Run BizClear Flutter app on Android emulator or connected device.
# If no Android device is running, launches the first available Android emulator.
# Usage: ./run_on_android.sh
# Prereqs: Flutter in PATH, Android SDK + at least one AVD.

set -e
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:$PATH"

# Get first Android device ID from "flutter devices" (emulator or physical)
get_android_id() {
  flutter devices 2>/dev/null | grep -i android | head -1 | sed 's/.*• \([^ •]*\) •.*/\1/' | tr -d ' '
}

ANDROID_ID=$(get_android_id)

# If no Android device yet, launch the first available Android emulator
if [ -z "$ANDROID_ID" ]; then
  EMU_ID=$(flutter emulators 2>/dev/null | grep -i android | head -1 | sed 's/ *•.*//' | sed 's/^ *//;s/ *$//')
  if [ -z "$EMU_ID" ]; then
    echo "==> No Android emulator or device found."
    echo "    Create an AVD in Android Studio (Device Manager) or run: flutter emulators --create"
    exit 1
  fi
  echo "==> Launching Android emulator: $EMU_ID"
  flutter emulators --launch "$EMU_ID" 2>/dev/null || true
  echo "==> Waiting for emulator to boot..."
  for i in $(seq 1 20); do
    sleep 3
    ANDROID_ID=$(get_android_id)
    if [ -n "$ANDROID_ID" ]; then
      echo "==> Emulator ready: $ANDROID_ID"
      break
    fi
    [ "$i" -eq 20 ] && echo "==> Timeout waiting for emulator. Try starting it from Android Studio." && exit 1
  done
fi

if [ -z "$ANDROID_ID" ]; then
  echo "==> No Android device available. Run 'flutter emulators --launch <id>' or connect a device."
  exit 1
fi

echo "==> Running on Android: $ANDROID_ID"
flutter run -d "$ANDROID_ID"
