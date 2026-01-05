# Android Keystore Activation (Multi‑Device)

This guide explains how to place, activate, and verify the Android signing keystore on any developer machine. Keep keystores and passwords secure; never commit them to source control.

## What You Need
- Java JDK installed (`keytool` available on PATH)
- Flutter/Android SDK installed
- The `.jks` keystore file
- Credentials: `storePassword`, `keyAlias`, `keyPassword` (for PKCS12, store/key password are typically the same)

## Where To Place The Keystore
- Windows recommended path for consistency across devices:
  - `C:\Keys\capstone-release.jks` (or use your existing filename)
- You can choose any path; if you do, update the project configuration to point to that path.

## Option A (Recommended): Use `android/key.properties`
1) Copy the keystore to the target machine
   - Example: copy your `.jks` to `C:\Keys\capstone-release.jks`

2) Create or edit `android/key.properties` in the project:
```
storeFile=C:\\Keys\\capstone-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
```
- Use double backslashes for Windows paths.
- `android/.gitignore` already ignores `key.properties` and `*.jks`.

3) Verify keystore is readable and alias exists:
```
keytool -list -keystore C:\Keys\capstone-release.jks
keytool -list -v -keystore C:\Keys\capstone-release.jks -alias YOUR_KEY_ALIAS
```

4) Build a signed release:
   Run these commands in your **terminal** (Command Prompt, PowerShell, or VS Code terminal).
   **Important:** Make sure you are in the `mobile/app` directory (where `pubspec.yaml` is located).

```powershell
# Navigate to the mobile app directory first
cd mobile/app

# Build APK (for direct installation)
flutter build apk --release

# Build App Bundle (for Google Play Store)
flutter build appbundle --release
```
- Outputs:
  - APK: `build\app\outputs\flutter-apk\app-release.apk`
  - AAB: `build\app\outputs\bundle\release\app-release.aab`

## Option B: Use Environment Variables (instead of `key.properties`)
Set signing values at the OS level, then build:
- Windows PowerShell (current session):
```
$env:RELEASE_STORE_FILE = 'C:\Keys\capstone-release.jks'
$env:RELEASE_STORE_PASSWORD = 'YOUR_STORE_PASSWORD'
$env:RELEASE_KEY_ALIAS = 'YOUR_KEY_ALIAS'
$env:RELEASE_KEY_PASSWORD = 'YOUR_KEY_PASSWORD'
flutter build apk --release
```
- Windows permanent (new shells only), run as your user:
```
setx RELEASE_STORE_FILE "C:\Keys\capstone-release.jks"
setx RELEASE_STORE_PASSWORD "YOUR_STORE_PASSWORD"
setx RELEASE_KEY_ALIAS "YOUR_KEY_ALIAS"
setx RELEASE_KEY_PASSWORD "YOUR_KEY_PASSWORD"
```
Reopen your terminal, then:
```
flutter build apk --release
```
- macOS/Linux:
```
export RELEASE_STORE_FILE=/Users/you/Keys/capstone-release.jks
export RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
export RELEASE_KEY_ALIAS=YOUR_KEY_ALIAS
export RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
flutter build apk --release
```

## Create a New Keystore (If You Don’t Have One)
Windows example (adjust path/alias as needed):
```
keytool -genkeypair -v ^
  -keystore C:\Keys\capstone-release.jks ^
  -alias capstone ^
  -keyalg RSA -keysize 2048 -validity 36500
```
Notes:
- For PKCS12 keystores, store and key passwords are typically identical.
- Record passwords securely and use them in `key.properties` or environment variables.

## Export Certificate / SHA Fingerprints
Use these for Play Console, Firebase, or OAuth setups:
```
keytool -list -v -keystore C:\Keys\capstone-release.jks -alias YOUR_KEY_ALIAS
keytool -exportcert -rfc -keystore C:\Keys\capstone-release.jks -alias YOUR_KEY_ALIAS -file C:\Keys\capstone-release.crt
```
The `.crt` file is text (PEM) and can be opened in your IDE.

## Security Best Practices
- Do not commit `.jks` or `key.properties`.
- Share keystores only via secure channels (encrypted, access-controlled).
- Keep an offsite backup of keystore and credentials.
- If compromised, generate a new keystore and rotate upload keys (Play App Signing supports key rotation).

## Troubleshooting
- “Keystore password was incorrect”:
  - Ensure `storePassword` is correct and matches the keystore (and `keyPassword` for PKCS12).
- “Missing signing config”:
  - Confirm `key.properties` exists and has correct values, or environment variables are set.
- Path issues on Windows:
  - Use `C:\\Keys\\...` in `key.properties`.
- Build still uses debug signing:
  - Ensure the keystore file exists, and all four values are present and non-empty.
