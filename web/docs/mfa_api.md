MFA API Contract

This document contains the canonical backend API contract for the frontend MFA implementation (email OTP, TOTP, WebAuthn).

Summary of endpoints

- POST /api/auth/login/start
- POST /api/auth/login
- POST /api/auth/login/verify
- POST /api/auth/login/verify-totp
- POST /api/auth/mfa/setup
- POST /api/auth/mfa/verify
- POST /api/auth/mfa/disable
- GET  /api/auth/mfa/status
- POST /api/auth/webauthn/register/start
- POST /api/auth/webauthn/register/complete
- POST /api/auth/webauthn/authenticate/start
- POST /api/auth/webauthn/authenticate/complete

Detailed examples and field expectations (copyable JSON):

1) POST /api/auth/login/start

Request:

{ "email": "user@example.com", "password": "password" }

Success (OTP started):

{
  "devCode": "123456",
  "expires_in": 300,
  "retryAfter": 90,
  "lockedUntil": "2025-12-11T14:20:05.647Z"
}

Error examples:

{ "message": "Too many requests", "retryAfter": 60 }
{ "error": "Account locked", "lockedUntil": "2025-12-11T14:20:05.647Z" }

2) POST /api/auth/login

Request:

{ "email": "user@example.com", "password": "password" }

Success (authenticated user):

{
  "id": "user_123",
  "email": "user@example.com",
  "role": "user",
  "token": "<jwt-or-session-token>",
  "expiresAt": 1700000000000
}

Client-side validation: frontend requires at least one of `id`/`userId`/`_id`, or `email`, or `role`, or a token field. Otherwise the response is treated as invalid and will not be persisted.

3) POST /api/auth/login/verify and /verify-totp

Request (OTP): { "email": "user@example.com", "code": "123456" }
Request (TOTP): { "email": "user@example.com", "code": "654321" }

On success return the authenticated `user` object (same shape as POST /api/auth/login).

4) TOTP setup

POST /api/auth/mfa/setup
Request body: { "method": "authenticator" } + optional header `x-user-email`

Response example:

{
  "secret": "S3CR3TBASE32",
  "otpauthUri": "otpauth://totp/YourApp:user@example.com?secret=S3CR3TBASE32&issuer=YourApp"
}

Frontend expectations: keep `secret` only in memory. Provide `otpauthUri` for QR generation.

5) WebAuthn

- register/start returns PublicKeyCreationOptions; binary fields are base64url-encoded.
- authenticate/start returns PublicKeyRequestOptions; binary fields are base64url-encoded.

Example (register/start):

{
  "publicKey": {
    "challenge": "base64url-challenge",
    "rp": { "name": "YourApp" },
    "user": { "id": "base64url-userid", "name": "user@example.com", "displayName": "User" }
  }
}

Error and lockout fields the frontend recognizes: retryAfter, retryAfterMs, lockedUntil (ISO), lockedUntilMs, expires_in, expiresAt.

Security recommendations:
- Keep secrets server-side.
- Use proper rate limits and status codes (429, 423, etc.).
- Return consistent field formats where possible (ISO timestamps or epoch ms).

Client code that consumes these endpoints:
- web/src/features/authentication/services/authService.js
- web/src/features/authentication/services/mfaService.js
- web/src/features/authentication/services/webauthnService.js
- web/src/features/authentication/hooks/useLogin.js
- web/src/features/authentication/hooks/useLoginFlow.js

If you want this content copied back into `web/README_MFA.md` instead of `web/docs/mfa_api.md`, tell me and I'll perform the replacement.
