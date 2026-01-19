# 2FA Setup with Microsoft Authenticator

## What You’ll Need
- The Capstone mobile app installed and connected to the backend
- Microsoft Authenticator (Android/iOS) installed
- Your account email and password

## How 2FA Works
- The backend generates a per‑user TOTP secret and an `otpauth` URI. Your authenticator app uses this to produce 6‑digit codes every 30 seconds.
- During login, if 2FA is enabled, entering the password returns `mfa_required`, and the app navigates to a dedicated 2FA screen to enter the 6‑digit code.
- A correct code completes login; an incorrect code is rejected.

Backend references:
- Setup secret and QR: `backend/services/auth-service/src/routes/mfa.js:25-46`
- Verify and enable: `backend/services/auth-service/src/routes/mfa.js:101-150`
- Disable MFA: `backend/services/auth-service/src/routes/mfa.js:155-167`
- Check status: `backend/services/auth-service/src/routes/mfa.js:172-208`
- TOTP helpers: `backend/services/auth-service/src/lib/totp.js`

Mobile references:
- Login MFA navigation on `mfa_required`: `mobile/app/lib/presentation/screens/login_page.dart:366-372`
- Login MFA screen and bulk paste: `mobile/app/lib/presentation/screens/security/login_mfa_screen.dart:43-59`
- Setup screen QR and labels: `mobile/app/lib/presentation/screens/security/mfa_setup_screen.dart:114-135`, `151-169`
- Security settings auto‑open/collapse: `mobile/app/lib/presentation/screens/security/mfa_settings_screen.dart:84-97`, `100-140`

## Enable 2FA (Microsoft Authenticator)
1. Open the app → go to `Security`.
2. Select `Authenticator App`. If 2FA is already enabled, this section auto‑opens.
3. Tap to set up. The Setup screen shows a QR code and manual entry details:
   - Account Name (issuer) is shown as a label
   - Secret Key (manual entry) is provided
4. In Microsoft Authenticator:
   - Add account → Other (custom)
   - Scan the QR code or enter the Secret Key and Account Name manually
5. Tap `Verify Code` in the Setup screen, enter the current 6‑digit code from your app, and submit.
6. On success, 2FA is enabled for your account.

Notes on the Setup screen:
- QR code uses the standard `otpauth://totp/...` format compatible with Microsoft Authenticator
- Labels are presented as `Account Name` and `Secret Key` for clarity

## Login with 2FA
- Enter your email and password.
- If 2FA is enabled, the backend responds with `mfa_required`. The app navigates to the dedicated 2FA page.
- Enter the 6‑digit code from Microsoft Authenticator.
- Bulk paste is supported: pasting 6 digits fills all boxes automatically.
- On success, you are signed in.

Mobile flow references:
- Navigate on `mfa_required`: `mobile/app/lib/presentation/screens/login_page.dart:366-372`
- 2FA input behavior (bulk paste): `mobile/app/lib/presentation/screens/security/login_mfa_screen.dart:43-59`

## Disable 2FA
1. Open the app → `Security` → `Authenticator App`.
2. Toggle off. A confirmation dialog appears:
   - “Are you sure you want to disable the Authenticator App? You will no longer receive verification codes at login.”
3. Confirm to disable. The section auto‑collapses and status updates.

References:
- UI toggle and confirmation: `mobile/app/lib/presentation/screens/security/mfa_settings_screen.dart:100-140`
- Backend disable endpoint: `backend/src/routes/auth/mfa.js:68-82`

## Backend Internals (for admins)
- `POST /api/auth/mfa/setup`: generates `mfaSecret` and returns `otpauthUri`, `issuer` (`backend/services/auth-service/src/routes/mfa.js:25-46`)
- `POST /api/auth/mfa/verify`: verifies a 6‑digit TOTP and sets `mfaEnabled=true` (`backend/services/auth-service/src/routes/mfa.js:101-150`)
- `POST /api/auth/mfa/disable`: clears `mfaSecret` and disables MFA (`backend/services/auth-service/src/routes/mfa.js:155-167`)
- `GET /api/auth/mfa/status`: returns `{ enabled }` (`backend/services/auth-service/src/routes/mfa.js:172-208`)
- TOTP generation/verification: `backend/services/auth-service/src/lib/totp.js` (`generateSecret`, `otpauthUri`, `verifyTotp`)
- Login MFA check: login step returns `mfa_required` if enabled (`backend/services/auth-service/src/routes/login.js`)
- Login TOTP verification: `POST /api/auth/login/verify-totp` completes login on valid code
