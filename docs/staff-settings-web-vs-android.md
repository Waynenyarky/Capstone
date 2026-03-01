# Staff Settings: Web vs Android Comparison

This document compares the **staff account settings** experience on the web app and the Android (mobile) app. The Android app is currently **Inspector-only** (other staff roles are redirected to login); the comparison is therefore between **web staff settings** and **Android inspector profile/settings**.

---

## Web (Staff) – What’s there

Staff (including Inspector, LGU Officer, CSO, etc.) and Admins see:

| Area | Content |
|------|--------|
| **Tabs** | **Security**, **Theme** (no General, no Notifications) |
| **Security tab** | • Two-Factor Authentication (MFA) with **Passkeys** (WebAuthn) and TOTP<br>• **Password** (change password)<br>• **Email Address** (change email)<br>• **Active Sessions** (list + invalidate single/all)<br>• **No Delete Account** (hidden for staff) |
| **Theme tab** | Theme presets (Default, Dark, Document, Blossom, Sunset, Royal) + primary color picker, Apply |

Layout: left nav (Security, Theme) + main content; staff get no “Back to dashboard” link (they use the main app shell).

---

## Android (Inspector profile) – What’s there today

Single **Profile** screen (used inside Inspector shell), same for all users:

| Section | Content |
|--------|--------|
| **Personal Information** | Read-only card: Email, First Name, Last Name, Phone |
| **Account Settings** | • Edit Profile<br>• Change Email<br>• Change Password<br>• **Delete Account** (shown to everyone) |
| **Settings** | • Multi-Factor Authentication (TOTP + Biometrics only) |
| **Logout** | Logout with confirmation |

**Device Trust**: A `_buildDeviceTrustSection()` exists and `showDeviceTrust: true` is passed for the inspector, but this section is **never rendered** in the profile body (bug).

---

## What works on Android

- **Edit Profile** – Works (name, phone, avatar).
- **Change Email** – Works (flow and verification).
- **Change Password** – Works.
- **Multi-Factor Authentication** – Works (TOTP + device biometrics). No passkey/WebAuthn (platform difference).
- **Logout** – Works.
- **Avatar** – Change/delete profile photo works.
- **Personal information** – Display matches web conceptually (no separate “General” tab on web for staff).

---

## What’s wrong or missing on Android

| Issue | Web | Android |
|-------|-----|--------|
| **Delete Account for staff** | Hidden for staff/admin | Shown to everyone (including inspector). Should be hidden for staff to match web. |
| **Device Trust** | N/A (inspector-specific on mobile) | Section built but **not shown** when `showDeviceTrust` is true. |
| **Active Sessions** | Full list + invalidate one/all | **Missing** – no list, no invalidate. |
| **Theme / Appearance** | Full Theme tab (presets + color) | **Missing** – no theme or appearance settings. |
| **Passkeys** | MFA includes passkey (WebAuthn) management | Device biometrics only; no passkey UI (expected platform difference). |

---

## Parity changes (implemented or recommended)

1. **Hide Delete Account for staff**  
   Profile page accepts `canDeleteAccount`; Inspector shell passes `canDeleteAccount: false` so staff (inspectors) do not see Delete Account. Other entry points keep default `true` if needed for other roles later.

2. **Show Device Trust when requested**  
   When `showDeviceTrust` is true, the profile body includes the existing Device Trust section (e.g. after Settings, before Logout).

3. **Active Sessions**  
   Add GET/POST calls to auth service (`/api/auth/session/active`, invalidate, invalidate-all), an “Active Sessions” screen that lists sessions and allows invalidating, and an “Active Sessions” tile in the profile (e.g. under Settings/Security).

4. **Theme / Appearance**  
   Add an “Theme” or “Appearance” entry that either opens a placeholder (“Theme options – coming soon”) or a minimal theme screen (e.g. light/dark) so structure matches web; full preset + color parity can follow later.

5. **Passkeys**  
   No change on Android; WebAuthn/passkeys are web-centric. Biometrics on mobile remain the equivalent for “something you have” on device.

---

## Summary

- **Working on Android:** Edit Profile, Change Email, Change Password, MFA (TOTP + Biometrics), Logout, avatar, personal info.
- **Fixed/added for parity:** Staff no longer see Delete Account; Device Trust section is shown for inspector; Active Sessions list + invalidate; optional Theme/Appearance entry.
- **Intent:** Align mobile settings with web so staff see the same conceptual options (except passkeys vs device biometrics and any future theme polish).
