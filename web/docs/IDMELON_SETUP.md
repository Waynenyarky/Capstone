# ID Melon Authenticator Setup Guide

This guide explains how to set up and use ID Melon Authenticator for passkey authentication in this application.

## What is ID Melon Authenticator?

ID Melon Authenticator transforms your smartphone into a FIDO2 security key, allowing you to:
- Use your phone to approve/deny login requests
- Receive push notifications when someone tries to log in
- Access your account securely without passwords
- Use your phone as a roaming security key across devices

## Complete Setup Process

### Step 1: Install ID Melon Authenticator on Your Phone

**For Android:**
1. Open Google Play Store
2. Search for "ID Melon Authenticator"
3. Install the app: [Download from Play Store](https://play.google.com/store/apps/details?id=com.idmelon.authenticator)

**For iOS:**
1. Open App Store
2. Search for "ID Melon Authenticator"
3. Install the app: [Download from App Store](https://apps.apple.com/la/app/idmelon-authenticator/id1511376376)

### Step 2: Install ID Melon Pairing Tool on Your Computer

1. Visit [idmelon.com](https://www.idmelon.com)
2. Download the ID Melon Pairing Tool for your operating system:
   - Windows
   - macOS
   - Linux
3. Install the Pairing Tool on your computer
4. Launch the ID Melon Pairing Tool

### Step 3: Pair Your Smartphone with Your Computer

1. **Enable Bluetooth** on both your computer and smartphone
2. **Open ID Melon Authenticator** on your phone
3. **Open ID Melon Pairing Tool** on your computer
4. Follow the on-screen pairing instructions:
   - The Pairing Tool will show a QR code or pairing code
   - Use the ID Melon Authenticator app to scan the QR code or enter the code
   - Wait for the pairing to complete
5. Once paired, your smartphone will act as a security key for your computer

### Step 4: Register Your Passkey with ID Melon

**Option A: Using Platform Authenticator (Recommended)**

1. **Sign in to your account** using your email and password
2. Go to **Settings & Profile** → **Security** → **Passkeys**
3. Click **"Register New Passkey"** or **"Add Passkey"**
4. When prompted to select an authenticator:
   - Choose **ID Melon Authenticator** from the list
   - If ID Melon is properly paired, it will appear as an option
5. **Approve the registration** on your phone when ID Melon sends a notification
6. Your passkey is now registered with ID Melon!

**Option B: Using Cross-Device Authentication (QR Code)**

1. **Sign in to your account** using your email and password
2. Go to **Settings & Profile** → **Security** → **Passkeys**
3. Click **"Register New Passkey"**
4. On the login page, select **"Use a phone or tablet"**
5. **Scan the QR code with ID Melon Authenticator app** (not your camera app)
6. **ID Melon will automatically extract pairing information** from the QR code URL:
   - The QR code contains a URL with all pairing fields as query parameters
   - **Challenge** (automatically extracted from URL parameter)
   - **RP ID** (Relying Party ID - automatically extracted from URL parameter)
   - **Session ID** (automatically extracted from URL parameter)
   - **Type** (register/authenticate - automatically extracted from URL parameter)
   - **RP Name** (automatically extracted from URL parameter)
7. **All pairing fields are pre-filled** - ID Melon reads them from the QR code URL parameters!
8. If ID Melon shows pairing fields, they should already be filled automatically. If not, you can manually copy from the URL.
8. **Approve the registration** on your phone
9. Your passkey is now registered with ID Melon!

## Using ID Melon for Login

After setup, logging in with ID Melon is simple:

### Method 1: Platform Authenticator (Paired Device)

**On the Login Page:**

1. Enter your **email address**
2. Click **"Sign in with Windows Hello, ID Melon, or security key"**
3. Select **"Windows Hello, ID Melon, or external security key"** (not the phone/tablet option)
4. Click **"Authenticate"**

**What Happens Next:**

1. **ID Melon sends a notification** to your paired smartphone
2. **Open the notification** on your phone
3. **Review the login request**:
   - See which website/service is requesting access
   - See the email address
   - See the timestamp
4. **Approve or Deny** the request:
   - Tap **"Approve"** to complete the login
   - Tap **"Deny"** to cancel the login
5. **Your computer will automatically complete the login** after approval

### Method 2: Cross-Device Authentication (QR Code)

**On the Login Page:**

1. Enter your **email address**
2. Click **"Sign in with Windows Hello, ID Melon, or security key"**
3. Select **"Use a phone or tablet"**
4. **Scan the QR code with ID Melon Authenticator app**
   - Open ID Melon Authenticator on your phone
   - Use the app's QR scanner (not your camera app)
   - Point at the QR code on your computer screen
5. **ID Melon automatically extracts pairing information** from the QR code:
   - Challenge ✓ (auto-filled)
   - RP ID ✓ (auto-filled)
   - Session ID ✓ (auto-filled)
   - All other fields ✓ (auto-filled)
6. **No manual entry needed!** ID Melon reads everything from the QR code
7. **Approve the login** on your phone
8. **Your computer will automatically complete the login** after approval

## Features

### ✅ Bluetooth Proximity Check
- ID Melon ensures your phone and computer are near each other
- This prevents unauthorized access if your phone is far away
- Bluetooth must be enabled on both devices

### ✅ Push Notifications
- Receive instant notifications when login is attempted
- No need to keep the app open
- Notifications work even when the app is closed

### ✅ Offline Support
- ID Melon can work offline for authentication
- Your passkeys are stored securely on your device

### ✅ Multi-Device Support
- Pair ID Melon with multiple computers
- Use the same phone for multiple devices
- Manage all paired devices from the app

## Troubleshooting

### ID Melon Doesn't Appear as an Option

**Problem:** ID Melon doesn't show up when registering a passkey.

**Solutions:**
1. ✅ Make sure ID Melon Pairing Tool is installed and running
2. ✅ Ensure your phone and computer are paired
3. ✅ Check that Bluetooth is enabled on both devices
4. ✅ Restart the ID Melon Pairing Tool
5. ✅ Re-pair your devices if needed

### Notification Not Received on Phone

**Problem:** You don't receive a notification when trying to log in.

**Solutions:**
1. ✅ Check that ID Melon Authenticator is installed on your phone
2. ✅ Verify your devices are still paired (open Pairing Tool)
3. ✅ Ensure Bluetooth is enabled
4. ✅ Check phone notification settings for ID Melon Authenticator
5. ✅ Make sure the app has permission to send notifications

### Authentication Fails

**Problem:** Login fails even after approving on phone.

**Solutions:**
1. ✅ Ensure both devices are on the same network (or Bluetooth is working)
2. ✅ Check that ID Melon Pairing Tool is running
3. ✅ Verify your passkey was registered with ID Melon (check Settings)
4. ✅ Try re-pairing your devices
5. ✅ Restart both the Pairing Tool and the Authenticator app

### Bluetooth Connection Issues

**Problem:** Devices won't pair or connection drops.

**Solutions:**
1. ✅ Make sure Bluetooth is enabled on both devices
2. ✅ Check that devices are within Bluetooth range (usually ~10 meters)
3. ✅ Disable and re-enable Bluetooth on both devices
4. ✅ Remove old pairing and create a new one
5. ✅ Update ID Melon apps to the latest version

## Security Best Practices

1. **Keep ID Melon apps updated** - Updates include security fixes
2. **Don't approve unknown login requests** - Always verify the website/service
3. **Keep your phone secure** - Use a lock screen (PIN, fingerprint, face unlock)
4. **Review paired devices** - Remove devices you no longer use
5. **Enable phone lock screen** - Required for ID Melon to work securely

## Difference from Cross-Device Authentication

**ID Melon Authenticator:**
- Requires pairing with the computer first
- Works through the browser's WebAuthn API
- Sends push notifications to your phone
- Requires Bluetooth connection
- Your phone acts as a security key

**Cross-Device Authentication (QR Code):**
- No pairing needed
- Uses QR code scanning
- Works with any mobile browser
- Requires WiFi network
- Uses your phone's built-in passkey storage

Both methods are secure! Choose the one that works best for you.

## Getting Help

- **ID Melon Documentation:** [docs.idmelon.com](https://docs.idmelon.com)
- **ID Melon Support:** Visit [idmelon.com](https://www.idmelon.com) for support
- **App Store Links:**
  - [Android](https://play.google.com/store/apps/details?id=com.idmelon.authenticator)
  - [iOS](https://apps.apple.com/la/app/idmelon-authenticator/id1511376376)
