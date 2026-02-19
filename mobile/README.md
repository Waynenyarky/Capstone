# BizClear Mobile (Flutter)

Run the app on your **iPad** (or iPhone) from a **Mac** with Flutter installed. The Codespaces/dev container does not have Flutter and cannot connect to a physical device.

## Prerequisites (on your Mac)

1. **Flutter** – [Install Flutter](https://docs.flutter.dev/get-started/install/macos) and ensure `flutter doctor` passes.
2. **Xcode** – Required for iOS. Install from the App Store and run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` if needed.
3. **Backend** – The app needs the backend API. Either:
   - Run the backend on your Mac (e.g. unified server on port 3000), or
   - Use a deployed backend URL.

## Run on your iPad

1. **Clone the repo** on your Mac (if not already), and open a terminal in the project root.

2. **Create `.env`** in the app folder:
   ```bash
   cd mobile/app
   cp .env.example .env
   ```
   Edit `.env` and set `BASE_URL` so the iPad can reach your backend:
   - Backend on your **Mac** (iPad on same Wi‑Fi): use your Mac’s LAN IP, e.g.  
     `BASE_URL=http://192.168.1.38:3000`  
     (Find the IP: System Settings → Network → Wi‑Fi → Details, or run `ipconfig getifaddr en0` in Terminal.)
   - Backend **deployed** elsewhere: use that URL, e.g.  
     `BASE_URL=https://your-api.example.com`

3. **Connect your iPad** to the Mac via USB (or set up [wireless debugging](https://developer.apple.com/documentation/xcode/wireless-debugging)).

4. **Install dependencies and run:**
   ```bash
   flutter pub get
   flutter run
   ```
   When prompted, select your iPad. The app will build and launch on the device.

5. **First time only:** On the iPad you may need to trust the developer certificate:  
   Settings → General → VPN & Device Management → your Apple ID → Trust.

## Troubleshooting

- **“flutter: command not found”** – You’re in an environment without Flutter (e.g. Codespaces). Use your Mac with Flutter installed.
- **App can’t reach backend** – Ensure iPad and backend host are on the same Wi‑Fi and `BASE_URL` uses the host’s LAN IP, not `localhost`.
- **No devices shown** – Connect iPad via USB, unlock it, tap “Trust” if asked, and run `flutter devices` again.
