# Passkey Setup Using Mobile Device (Phone/Tablet)

This guide explains how to set up and use passkeys with your mobile device for cross-device authentication.

## ⚠️ Important: Network Setup for Development

**If you see "This site can't be reached" when scanning the QR code**, follow these steps:

### Step 1: Ensure Both Devices Are on the Same Network
1. **Make sure your mobile device and computer are on the same WiFi network**
   - Your phone and computer must be connected to the same WiFi router
   - Mobile data won't work - both must use WiFi

### Step 2: Verify Development Server Configuration

The Vite dev server is now configured to listen on all network interfaces (already set in `vite.config.js`).

**The backend will automatically detect your local IP address** and use it in the QR code.

### Step 3: Find Your Computer's Local IP Address

**Windows:**
1. Open Command Prompt (cmd) or PowerShell
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter (usually starts with `192.168.` or `10.`)
4. Example: `192.168.1.100`

**Mac:**
1. System Settings → Network
2. Select WiFi → click "Details"
3. See "IP Address"

**Linux:**
1. Open terminal
2. Type: `hostname -I` or `ip addr show`
3. Look for your WiFi interface address

### Step 4: Test the Connection

1. On your computer, open: `http://YOUR_IP:5173` (replace YOUR_IP with your actual IP)
   - Example: `http://192.168.1.100:5173`
2. If it loads, your mobile device should be able to connect too
3. If it doesn't load, check your firewall settings

### Step 5: Manual Configuration (If Auto-Detection Fails)

If the automatic IP detection doesn't work, manually set the `FRONTEND_URL` environment variable:

**Windows PowerShell:**
```powershell
$env:FRONTEND_URL="http://YOUR_IP:5173"
# Example: $env:FRONTEND_URL="http://192.168.1.100:5173"
```

**Windows Command Prompt:**
```cmd
set FRONTEND_URL=http://YOUR_IP:5173
```

**Mac/Linux:**
```bash
export FRONTEND_URL="http://YOUR_IP:5173"
# Example: export FRONTEND_URL="http://192.168.1.100:5173"
```

### Troubleshooting

**Still can't connect?**
1. ✅ Check both devices are on the same WiFi network
2. ✅ Verify your computer's firewall allows connections on port 5173
3. ✅ Try accessing `http://YOUR_IP:5173` directly in your phone's browser
4. ✅ Restart your development server after setting `FRONTEND_URL`
5. ✅ Check the backend console - it should show: `[WebAuthn] Using local network IP for QR code: http://...`

## Complete Flow: Setting Up Passkey on Mobile

### Step 1: Start on Desktop/Computer

1. Go to the **login page**
2. Enter your **email address**
3. Click **"Sign in with Windows Hello or a security key"**
4. In the modal, select **"Use a phone or tablet"**
5. A QR code will appear on your screen

### Step 2: Scan QR Code with Your Mobile Device

**What App to Use:**

#### Option 1: Built-in Camera (Simplest - Recommended)

**For iPhone/iPad (iOS):**
1. Open the **Camera app** on your iPhone/iPad
2. Point the camera at the QR code on your computer screen
3. A notification will appear - tap it
4. The QR code will automatically open in **Safari browser**
5. Safari will use **iCloud Keychain** to store and manage your passkey

**For Android:**
1. Open the **Camera app** or **Google Lens** on your Android device
2. Point the camera at the QR code on your computer screen
3. Tap the notification that appears
4. The QR code will automatically open in **Chrome browser**
5. Chrome will use **Google Password Manager** (built-in) to store and manage your passkey

#### Option 2: Using Google Password Manager (Android/Chrome)

**How to Use Google Password Manager for Passkeys:**

**Step-by-Step Process:**

1. **Scan the QR Code:**
   - Open your **Camera app** on your Android device
   - Point the camera at the QR code on your computer screen
   - Tap the notification that appears
   - The QR code will automatically open in **Chrome browser**

2. **Google Password Manager Automatically Activates:**
   - When Chrome opens, Google Password Manager is **already active** (it's built-in)
   - You don't need to open a separate app or do anything extra
   - Chrome will automatically detect the passkey registration/authentication request

3. **Complete Authentication:**
   - Chrome will show a prompt asking you to create/save a passkey
   - Tap **"Continue"** or **"Save"**
   - Authenticate using your fingerprint, face unlock, or device PIN
   - Google Password Manager automatically saves the passkey to your Google account

4. **Passkey is Saved:**
   - The passkey is now stored in your Google account
   - It will sync to all your devices signed into the same Google account
   - You can view and manage it in Chrome Settings → Passwords → Passkeys

**Important Notes:**
- ❌ **You cannot scan QR codes directly from the Google Password Manager app**
- ✅ **You must scan with Camera app** → opens in Chrome → Google Password Manager handles it automatically
- ✅ **No separate app needed** - Google Password Manager is built into Chrome
- ✅ **Works automatically** - no setup or configuration required if you're signed into Chrome with your Google account

**How to Verify Google Password Manager is Active:**
- Open Chrome on your Android device
- Go to Settings → Passwords → Passkeys
- If you see passkeys listed here, Google Password Manager is working
- Make sure you're signed into Chrome with your Google account

#### Option 3: Using Other Password Managers (1Password, Bitwarden, etc.)

If you have a password manager like **1Password** or **Bitwarden** installed:

1. **Scan the QR code** using your Camera app (same as above)
2. When the browser opens, your password manager extension/app will:
   - Detect the passkey registration/authentication request
   - Offer to save/manage the passkey through the password manager
   - Store it securely in your password manager vault
3. The authentication still happens through the browser, but the passkey is managed by your password manager

### Step 3: Complete Setup on Mobile Device

After scanning the QR code:

1. Your phone's browser (Safari/Chrome) will open automatically
2. You'll see a page titled **"Approve Sign-In"**
3. The browser will prompt you to create a passkey:
   - **iOS:** Uses Face ID, Touch ID, or your device passcode
   - **Android:** Uses fingerprint, face unlock, or device PIN
4. Follow the on-screen prompts to complete the setup
5. You can click **"Deny"** at any time to cancel

### Step 4: Sign In Complete

- After approving on your mobile device, your desktop browser will automatically detect the completion
- You'll be signed in on your computer
- Your passkey is now saved and can be used for future sign-ins

## Using Passkey for Future Sign-Ins

Once you've set up a passkey:

1. On login page, click **"Sign in with Windows Hello or a security key"**
2. Select **"Use a phone or tablet"**
3. Scan the QR code with your phone's Camera app
4. Approve the sign-in on your phone
5. You're signed in!

## Requirements

### iOS (iPhone/iPad):
- **iOS 16 or later**
- **Safari browser** (built-in, no download needed)
- **Camera app** (built-in, no download needed)
- Face ID, Touch ID, or device passcode set up

### Android:
- **Android 14 or later** (for full support)
- **Chrome browser** (usually pre-installed)
- **Camera app** or **Google Lens** (built-in)
- Fingerprint, face unlock, or device PIN set up

## Troubleshooting

### "No passkeys registered" Error

If you see this error when trying to sign in:
1. The system will offer to **"Register Passkey on Mobile"**
2. Click that button to set up your first passkey
3. Follow the QR code scanning process above

### QR Code Won't Scan

- Ensure good lighting
- Hold the phone steady
- Move closer or farther from the screen
- Make sure the QR code is fully visible

### Browser Doesn't Open After Scanning

- Make sure you're using the built-in Camera app (not a third-party scanner)
- Check that your browser (Safari/Chrome) is set as default
- Try scanning again

### Can't Complete Authentication on Mobile

- Make sure Face ID/Touch ID/fingerprint is set up on your device
- Check that you have a stable internet connection
- Try refreshing the page on your mobile device

## Security Notes

- Passkeys are stored securely in:
  - **iOS:** iCloud Keychain (synced across Apple devices)
  - **Android:** Google Password Manager (synced across Google account devices)
- No passwords are stored or transmitted
- Each authentication requires your biometric or PIN
- You can deny any sign-in request at any time

## Password Managers with Passkey Support

If you prefer using a password manager, these apps support passkeys and work with your browser:

### Recommended Options:

1. **1Password** (Most Secure & User-Friendly)
   - ✅ Full passkey support
   - ✅ Cross-platform sync
   - ✅ Strong encryption
   - ✅ Works with Safari, Chrome, and other browsers
   - 📱 Download: [1Password.com](https://1password.com)

2. **Bitwarden** (Open-Source & Free)
   - ✅ Full passkey support
   - ✅ Open-source (audited)
   - ✅ Free tier available
   - ✅ Works with all major browsers
   - 📱 Download: [Bitwarden.com](https://bitwarden.com)

3. **Google Password Manager** (Built-in for Android)
   - ✅ Built into Chrome/Android
   - ✅ Automatic passkey sync
   - ✅ Free
   - ✅ Works seamlessly with Chrome

4. **iCloud Keychain** (Built-in for iOS)
   - ✅ Built into Safari/iOS
   - ✅ Automatic passkey sync across Apple devices
   - ✅ Free
   - ✅ Works seamlessly with Safari

### How Password Managers Work with Passkeys:

- Password managers **store and manage** your passkeys
- Authentication still happens through your **browser** (Safari/Chrome)
- The password manager integrates with the browser's WebAuthn API
- You get the security benefits of both: password manager encryption + browser security

## Summary: What You Need

### Option 1: Built-in (Simplest)
✅ **Built-in Camera app** on your phone  
✅ **Safari** (iOS) or **Chrome** (Android) browser  
✅ Face ID/Touch ID/fingerprint set up on your device

### Option 2: Password Manager (More Secure for Multiple Accounts)
✅ **1Password** or **Bitwarden** app installed  
✅ **Safari** (iOS) or **Chrome** (Android) browser  
✅ Face ID/Touch ID/fingerprint set up on your device

**Note:** Passkeys require a browser (Safari/Chrome) - password managers work WITH the browser, not instead of it.
