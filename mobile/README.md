# BizClear Mobile (Flutter)

Run the app on your **iPad** (or iPhone) from a **Mac** with Flutter installed. The Codespaces/dev container does not have Flutter and cannot connect to a physical device.

## Prerequisites (on your Mac)

1. **Flutter** – ✅ Installed via Homebrew (`/opt/homebrew/bin/flutter`). Verify with `flutter doctor -v`.
2. **Xcode** – Required for iOS. You have Xcode.app; point the dev tools at it and run first launch (run in Terminal, will ask for your password):
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```
3. **CocoaPods** – ✅ Installed via Homebrew.
4. **Backend** – The app needs the backend API. Copy `mobile/app/.env.example` to `mobile/app/.env` and set `BASE_URL` to your Mac’s LAN IP and **port 3001** (auth-service). With Docker (`./start.sh`), auth runs on 3001 and business on 3002; set `ALT_BASE_URLS` to the same host with port 3002 so inspector APIs work. Nothing listens on port 3000.

## Run on your iPad

1. **Connect your iPad** to the Mac via USB. Unlock the iPad and tap **Trust** if prompted.

2. **One-time: point Xcode at the full app** (if you haven’t already):
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```

3. **Run the app:**
   ```bash
   cd mobile/app
   flutter pub get
   flutter run
   ```
   When prompted, select your iPad. The app will build and launch on the device.

   Or use the helper script:
   ```bash
   ./mobile/app/run_on_device.sh
   ```

4. **First time only:** On the iPad you may need to trust the developer certificate:  
   **Settings → General → VPN & Device Management → your Apple ID → Trust.**

## Troubleshooting

- **“flutter: command not found”** – Add Homebrew to PATH: `export PATH="/opt/homebrew/bin:$PATH"` (or use the run script above).
- **Xcode “incomplete”** – Run the two `sudo` commands in the Prerequisites section.
- **App can’t reach backend** – Ensure device and backend host are on the same Wi‑Fi. In `mobile/app/.env` set `BASE_URL=http://YOUR_MAC_IP:3001` (auth) and `ALT_BASE_URLS=http://YOUR_MAC_IP:3002` (business). Use your Mac’s LAN IP (e.g. `ipconfig getifaddr en0`), not `localhost`. Port 3000 is not used by the Docker backend.
- **No devices shown** – Connect iPad via USB, unlock it, tap “Trust” if asked, and run `flutter devices` again.
