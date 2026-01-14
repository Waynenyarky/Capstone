# Passkey User Guide

A simple, step-by-step guide for using passkeys to sign in to your account.

## What are Passkeys?

Passkeys are a modern, secure way to sign in without passwords. Instead of typing a password, you use:
- **Your fingerprint** (Touch ID)
- **Your face** (Face ID / Windows Hello)
- **Your device PIN**
- **A physical security key** (USB/NFC/Bluetooth)

### Benefits

✅ **More Secure**: No passwords to steal or leak  
✅ **Faster**: Sign in with just your fingerprint or face  
✅ **Works Across Devices**: Use your phone to sign in on your computer  
✅ **No Password to Remember**: Your device handles everything securely  

---

## Registration: Setting Up Your First Passkey

You only need to register a passkey **once per device**. After that, you can use it to sign in anytime.

### Step 1: Sign In with Email and Password

1. Go to the login page
2. Enter your **email address** and **password**
3. Click **"Sign in"**

> **Note**: You must be signed in with your password at least once before you can register a passkey.

### Step 2: Register Your Passkey

**Option A: From the Login Page (Recommended)**

1. On the login page, enter your **email address**
2. The system will automatically detect if you have a passkey registered
3. If you don't have one, you'll see a **"Register Passkey"** button
4. Click **"Register Passkey"**
5. Follow the on-screen guide
6. Click **"Start Registration"**
7. Your browser will prompt you to:
   - Choose where to save your passkey (This device or Security key)
   - Authenticate using your fingerprint, face, or PIN
8. After successful registration, you'll be automatically signed in

**Option B: From Account Settings**

1. Sign in to your account
2. Go to **Settings** → **Security** or **Multi-Factor Authentication**
3. Click **"Register Passkey"** or **"Add Passkey"**
4. Follow the browser prompts to create your passkey

### Step 3: Choose Where to Save Your Passkey

When registering, you'll see options:

- **This device** (Recommended for personal devices)
  - Saves on your current device
  - Uses Windows Hello, Touch ID, or Face ID
  - Fast and convenient

- **Security key** (Recommended for shared devices)
  - Saves on a physical USB/NFC/Bluetooth key
  - More portable
  - Can use on multiple devices

### Step 4: Complete Registration

1. Authenticate using your chosen method:
   - **Windows**: Use Windows Hello (fingerprint, face, or PIN)
   - **Mac**: Use Touch ID or Face ID
   - **Mobile**: Use fingerprint or face unlock
   - **Security Key**: Tap or insert your security key
2. Your passkey is now registered!
3. You'll be automatically signed in

---

## Signing In with Passkey

Once you've registered a passkey, signing in is quick and easy.

### Method 1: Sign In with Email (Recommended)

1. Go to the login page
2. Enter your **email address**
3. Click **"Sign in with Passkey"**
4. Your browser will prompt you to authenticate:
   - **Windows**: Windows Hello (fingerprint, face, or PIN)
   - **Mac**: Touch ID or Face ID
   - **Mobile**: Fingerprint or face unlock
   - **Security Key**: Tap or insert your security key
5. You're signed in!

### Method 2: Sign In Without Email (Userless)

1. Go to the login page
2. **Don't enter your email** - leave it blank
3. Click **"Sign in with Passkey"**
4. Your browser will show all available passkeys
5. Select the account you want to sign in to
6. Authenticate using your fingerprint, face, or PIN
7. You're signed in!

> **Note**: This method only works if you have passkeys saved in your device's keychain (iCloud Keychain, Google Password Manager, etc.)

---

## Cross-Device Sign-In (Using Your Phone)

You can use your phone to sign in on your computer, even if you haven't registered a passkey on that computer.

### Step 1: Start on Your Computer

1. Go to the login page on your computer
2. Enter your **email address** (optional)
3. Click **"Sign in with Passkey"**
4. In the modal, select **"Use a phone or tablet"**
5. A **QR code** will appear on your screen

### Step 2: Scan QR Code with Your Phone

**iPhone/iPad:**
1. Open the **Camera app**
2. Point it at the QR code on your computer screen
3. Tap the notification that appears
4. The QR code will open in **Safari**

**Android:**
1. Open the **Camera app** or **Google Lens**
2. Point it at the QR code on your computer screen
3. Tap the notification that appears
4. The QR code will open in **Chrome**

### Step 3: Approve Sign-In on Your Phone

1. Your phone's browser will show an **"Approve Sign-In"** page
2. Authenticate using your phone's biometric (fingerprint, face, or PIN)
3. You can click **"Deny"** to cancel at any time
4. Your computer will automatically detect when you've approved
5. You're signed in on your computer!

---

## Managing Your Passkeys

### View Your Passkeys

1. Sign in to your account
2. Go to **Settings** → **Security** → **Passkeys**
3. You'll see a list of all your registered passkeys
4. Each passkey shows:
   - Device name (e.g., "Windows Hello", "iPhone")
   - Registration date
   - Last used date

### Register Multiple Passkeys

You can register multiple passkeys for the same account:
- One for your desktop computer
- One for your laptop
- One for your phone
- One for a physical security key

This gives you backup options if one device is unavailable.

### Delete a Passkey

1. Go to **Settings** → **Security** → **Passkeys**
2. Find the passkey you want to delete
3. Click **"Delete"** or the trash icon
4. Confirm the deletion

> **Warning**: If you delete your only passkey, you'll need to sign in with your password and register a new passkey.

---

## Troubleshooting

### "No passkeys registered" Error

**Problem**: You're trying to sign in with a passkey, but you haven't registered one yet.

**Solution**:
1. The system will automatically show a **"Register Passkey"** button
2. Click it and follow the registration steps
3. Make sure you've entered your email address first

### "WebAuthn not supported" Error

**Problem**: Your browser or device doesn't support passkeys.

**Solution**:
- **Update your browser** to the latest version
- **Use a supported browser**:
  - Chrome 108+ (Windows, Mac, Android)
  - Edge 108+ (Windows)
  - Safari 16+ (Mac, iOS)
  - Firefox 102+ (Windows, Mac, Linux)
- **Check your device** supports biometrics or security keys

### "Credential not recognized" Error

**Problem**: The passkey on your device doesn't match your account.

**Solution**:
1. Make sure you're using the correct passkey for this account
2. Try signing in with your email and password first
3. Register a new passkey if needed
4. If using multiple accounts, make sure you select the correct one

### Passkey Registration Fails

**Problem**: You can't complete passkey registration.

**Possible Causes**:
- Browser blocked the request
- Device doesn't support passkeys
- Biometric/PIN not set up on device

**Solution**:
1. **Set up biometrics/PIN** on your device:
   - **Windows**: Set up Windows Hello in Settings
   - **Mac**: Set up Touch ID or Face ID in System Preferences
   - **Mobile**: Set up fingerprint or face unlock in device settings
2. **Allow browser permissions** when prompted
3. **Try a different browser** if issues persist
4. **Use a security key** as an alternative

### QR Code Won't Scan

**Problem**: You can't scan the QR code for cross-device sign-in.

**Solution**:
1. **Ensure good lighting** - make sure the QR code is clearly visible
2. **Hold phone steady** - avoid shaking
3. **Move closer or farther** - find the right distance
4. **Use built-in Camera app** - not a third-party scanner
5. **Check both devices are on same WiFi** - required for cross-device auth

### Cross-Device Sign-In Not Completing

**Problem**: You approved on your phone, but your computer doesn't sign in.

**Solution**:
1. **Check internet connection** - both devices must be online
2. **Enable Bluetooth** - required for proximity verification
3. **Check session hasn't expired** - QR codes expire after 5 minutes
4. **Generate a new QR code** - try the process again
5. **Refresh the page** on your computer

### Can't Sign In Without Email (Userless)

**Problem**: You're trying to sign in without entering email, but it's not working.

**Solution**:
1. **Make sure you have passkeys saved** in your device's keychain:
   - **iOS**: iCloud Keychain must be enabled
   - **Android**: Google Password Manager must be enabled
2. **Sign in with email first** - then try userless next time
3. **Check browser support** - some browsers don't support conditional UI

---

## Frequently Asked Questions (FAQ)

### Do I still need my password?

**Yes, but only as a backup**. Your password is still required for:
- First-time passkey registration
- Signing in if you lose access to all your passkeys
- Account recovery

### Can I use passkeys on multiple devices?

**Yes!** You can register a passkey on each device you use:
- Your desktop computer
- Your laptop
- Your phone
- Your tablet
- A physical security key

Each device will have its own passkey, but they all work with the same account.

### What happens if I lose my device?

**Don't worry!** You can:
1. Sign in with your **password** on a new device
2. **Delete the lost device's passkey** from your account settings
3. **Register a new passkey** on your new device

Your account remains secure because:
- The private key on the lost device can't be used without your biometric/PIN
- You can revoke access by deleting the passkey

### Can I use passkeys on shared computers?

**Yes, but be careful**. If you register a passkey on a shared computer:
- Anyone with access to that computer could potentially use your passkey
- They would still need your biometric/PIN to authenticate
- Consider using a **security key** instead for shared devices

### Are passkeys more secure than passwords?

**Yes!** Passkeys provide:
- **No password to steal** - attackers can't phish your password
- **Device-bound** - private key never leaves your device
- **Biometric protection** - requires your fingerprint, face, or PIN
- **Cryptographic security** - uses public-key cryptography

### Do passkeys work offline?

**No, you need internet** for:
- Registration (to save your public key to the server)
- Sign-in (to verify your signature with the server)

However, the actual authentication (biometric/PIN) happens on your device, so it's fast and secure.

### Can I use passkeys with password managers?

**Yes!** Many password managers support passkeys:
- **1Password** - Full passkey support
- **Bitwarden** - Full passkey support
- **Google Password Manager** - Built into Chrome/Android
- **iCloud Keychain** - Built into Safari/iOS

The password manager stores and manages your passkeys, but authentication still happens through your browser.

### What if my browser doesn't support passkeys?

**You have options**:
1. **Update your browser** to the latest version
2. **Switch to a supported browser** (Chrome, Edge, Safari, Firefox)
3. **Use your password** as a fallback
4. **Use a security key** (works with more browsers)

---

## Security Best Practices

1. **Set up biometrics/PIN** on all your devices
2. **Register multiple passkeys** for backup
3. **Delete passkeys** from devices you no longer use
4. **Use security keys** for shared or high-security devices
5. **Keep your password secure** as a backup method
6. **Don't share your devices** with unauthorized users

---

## Getting Help

If you're having trouble with passkeys:

1. **Check this guide** for troubleshooting steps
2. **Verify your device and browser** meet the requirements
3. **Try signing in with your password** as a fallback
4. **Contact support** with:
   - Your device type and OS version
   - Your browser and version
   - The exact error message you see
   - Steps you've already tried

---

## Summary: Quick Reference

### First Time Setup
1. Sign in with email and password
2. Click "Register Passkey"
3. Choose where to save (This device or Security key)
4. Authenticate with biometric/PIN
5. Done!

### Signing In
1. Enter email (optional)
2. Click "Sign in with Passkey"
3. Authenticate with biometric/PIN
4. You're in!

### Cross-Device Sign-In
1. Click "Use a phone or tablet"
2. Scan QR code with your phone
3. Approve on your phone
4. Signed in on computer!

---

**Remember**: Passkeys make signing in faster and more secure. Once you set one up, you'll wonder how you ever lived without it!
