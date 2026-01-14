# Passkey Authentication Setup Guide

This document describes how to set up and use passkey authentication in the application, including requirements for different devices and platforms.

> **📚 Related Documentation:**
> - **[Passkey Flow (Technical)](./PASSKEY_FLOW.md)** - Complete technical implementation details
> - **[Passkey User Guide](./PASSKEY_USER_GUIDE.md)** - Step-by-step user instructions

## Overview

Passkey authentication uses WebAuthn/FIDO2 standards to provide passwordless authentication. Users can sign in using:
- **Platform authenticators**: Windows Hello, Touch ID, Face ID, or external security keys
- **Cross-device authentication**: Using a phone or tablet to authenticate on a different device

## User Flow

### Sign-In Options

1. On the login page, click **"Sign in with Windows Hello or a security key"**
2. Choose your preferred method:
   - **Windows Hello or external security key**: Authenticate directly on this device
   - **Use a phone or tablet**: Scan a QR code with your mobile device

### Platform Authenticator Flow

1. Select "Windows Hello or external security key"
2. The browser will prompt you to authenticate using:
   - Windows Hello (fingerprint, face, or PIN on Windows)
   - Touch ID or Face ID (on macOS/iOS)
   - External security key (USB, NFC, or Bluetooth security keys)
3. Complete authentication and you'll be signed in

### Cross-Device Authentication Flow

1. On the login page, click **"Sign in with Windows Hello or a security key"**
2. In the modal, select **"Use a phone or tablet"**
3. A QR code will be displayed on the screen
4. On your mobile device:
   - **iOS:** Open the **Camera app** and point it at the QR code
   - **Android:** Open the **Camera app** or **Google Lens** and point it at the QR code
   - The QR code will automatically open in your browser (Safari on iOS, Chrome on Android)
5. You'll see a page with **"Approve Sign-In"** title
6. The browser will prompt you to authenticate using your device's passkey (Face ID, Touch ID, fingerprint, or PIN)
7. You can click **"Deny"** to cancel the sign-in, or complete the biometric authentication to approve
8. The desktop browser will automatically detect when authentication is complete

## Mobile Device Requirements

### iOS Devices

**Minimum Requirements:**
- iOS 16 or later
- Safari browser or apps using WebAuthn API
- Camera access for QR code scanning
- Bluetooth enabled (for proximity verification in cross-device authentication)

**How Passkeys Work on iOS:**
- Passkeys are stored in iCloud Keychain
- Automatically synced across your Apple devices
- Uses Face ID, Touch ID, or device passcode for verification

**Apps That Support Passkeys:**
- **Safari** (built-in browser) - Recommended for iOS
- **Camera app** - Can scan QR codes that open in Safari
- Any app using the WebAuthn API
- Third-party browsers that support WebAuthn (Chrome, Firefox, etc.)

**For Cross-Device Authentication:**
- Use your **Camera app** to scan the QR code
- The QR code will automatically open in **Safari** browser
- No additional apps needed - everything works through Safari

### Android Devices

**Minimum Requirements:**
- Android 14 or later (for full passkey support)
- Chrome browser or apps using WebAuthn API
- Camera access for QR code scanning
- Bluetooth enabled (for proximity verification)

**How Passkeys Work on Android:**
- Passkeys are stored in Google Password Manager
- Automatically synced across your Google account devices
- Uses fingerprint, face unlock, or device PIN for verification

**Apps That Support Passkeys:**
- **Chrome** (recommended for Android)
- **Camera app** or **Google Lens** - Can scan QR codes that open in Chrome
- Any app using the WebAuthn API
- Other browsers with WebAuthn support

**For Cross-Device Authentication:**
- Use your **Camera app** or **Google Lens** to scan the QR code
- The QR code will automatically open in **Chrome** browser
- No additional apps needed - everything works through Chrome

### For Cross-Device Scanning

When using cross-device authentication, you need:

1. **Camera Access**: To scan the QR code displayed on the desktop
2. **Modern Browser**: Safari (iOS 16+), Chrome (Android 14+), or other WebAuthn-compatible browsers
3. **Bluetooth**: Enabled for proximity verification (handled automatically by the browser)
4. **Internet Connection**: Both devices must be connected to the internet

## Desktop Browser Requirements

### Windows

- **Chrome**: Version 108 or later (recommended)
- **Edge**: Version 108 or later
- **Firefox**: Version 102 or later
- Windows Hello must be set up (fingerprint, face recognition, or PIN)

### macOS

- **Safari**: Version 16 or later (recommended)
- **Chrome**: Version 108 or later
- **Firefox**: Version 102 or later
- Touch ID or Face ID must be set up

### Linux

- **Chrome**: Version 108 or later
- **Firefox**: Version 102 or later
- External security keys (USB, NFC) are supported

## Setting Up Passkeys

### First-Time Setup

1. Sign in to your account using your email and password
2. Navigate to your account settings
3. Look for "Security" or "Multi-Factor Authentication" section
4. Click "Register Passkey" or "Add Passkey"
5. Follow the prompts to create your passkey:
   - Choose your preferred authenticator (Windows Hello, Touch ID, security key, etc.)
   - Complete the verification (biometric, PIN, or security key tap)
6. Your passkey is now registered and ready to use

### Registering Multiple Passkeys

You can register multiple passkeys for the same account:
- One for your desktop (Windows Hello)
- One for your phone (Face ID/Touch ID)
- One for a physical security key

This provides backup options if one device is unavailable.

## Troubleshooting

### "WebAuthn not supported" Error

- Ensure you're using a modern browser (see requirements above)
- Check that your browser is up to date
- Try a different browser if issues persist

### QR Code Not Scanning

- Ensure good lighting
- Hold the phone steady
- Try moving closer or farther from the screen
- Use a dedicated QR code scanner app if the camera app doesn't work

### Cross-Device Authentication Not Completing

- Check that both devices are connected to the internet
- Ensure Bluetooth is enabled on both devices
- Verify that the session hasn't expired (QR codes expire after 5 minutes)
- Try generating a new QR code

### Platform Authenticator Not Working

**Windows:**
- Ensure Windows Hello is set up in Windows Settings
- Check that your device supports Windows Hello (fingerprint reader, camera, etc.)
- Try using an external security key as an alternative

**macOS:**
- Ensure Touch ID or Face ID is set up in System Preferences
- Check that your Mac model supports these features
- Try using an external security key as an alternative

### Mobile Device Not Showing Approve/Deny

- Ensure you're using a supported browser (Safari on iOS 16+, Chrome on Android 14+)
- Check that your device's operating system is up to date
- Try refreshing the mobile authentication page
- Ensure you have a passkey registered for your account

## Security Considerations

1. **Device Security**: Keep your devices secure with screen locks, biometrics, or PINs
2. **Physical Security**: Don't share your devices with unauthorized users
3. **Session Timeout**: Cross-device authentication sessions expire after 5 minutes
4. **Proximity Verification**: Cross-device authentication requires devices to be physically close (via Bluetooth)
5. **Backup Options**: Register multiple passkeys to avoid being locked out

## Technical Details

### WebAuthn API Support

The application uses the WebAuthn API (`navigator.credentials`) which is supported by:
- Modern browsers (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- Mobile browsers with WebAuthn support (Safari iOS 16+, Chrome Android 14+)

### Cross-Device Authentication Protocol

Cross-device authentication uses:
- QR codes to initiate the connection
- Bluetooth Low Energy (BLE) for proximity verification
- WebAuthn for the actual authentication
- Polling mechanism to detect authentication completion

### Backend Endpoints

- `POST /api/auth/webauthn/cross-device/start` - Start cross-device session
- `GET /api/auth/webauthn/cross-device/status/:sessionId` - Check authentication status
- `POST /api/auth/webauthn/cross-device/complete` - Complete authentication (called from mobile)

## Additional Resources

### Internal Documentation
- **[Passkey Flow (Technical)](./PASSKEY_FLOW.md)** - Complete technical flow documentation with diagrams
- **[Passkey User Guide](./PASSKEY_USER_GUIDE.md)** - User-friendly step-by-step guide
- **[Passkey Mobile Setup](./PASSKEY_MOBILE_SETUP.md)** - Mobile device setup instructions

### External Resources
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 Documentation](https://fidoalliance.org/fido2/)
- [Passkeys.dev](https://passkeys.dev/) - Comprehensive passkey resources

## Support

If you encounter issues with passkey authentication:
1. Check this guide for troubleshooting steps
2. Review the [User Guide](./PASSKEY_USER_GUIDE.md) for detailed instructions
3. Ensure your device and browser meet the requirements
4. Contact support with details about your device, browser, and the error message
