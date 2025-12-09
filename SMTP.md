# SMTP Setup for OTP Emails

This backend uses Nodemailer to send one‑time verification codes by email. Configure SMTP in `backend/.env`, start the API, and run a test request to verify delivery.

## Prerequisites
- An SMTP account that allows programmatic sending
- If your mailbox uses 2‑step verification, create an app password
- The `from` address must be authorized to send via your provider

## Environment Variables
Create `backend/.env` with the following keys. Only one of `EMAIL_USE_SSL` or `EMAIL_USE_TLS` should be true depending on your provider and port.

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_SSL=false
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=Your Name <your_email@gmail.com>
VERIFICATION_CODE_TTL_MIN=10
VERIFICATION_RESEND_COOLDOWN_SEC=60
VERIFICATION_MAX_ATTEMPTS=5
```

Alternative variable names are supported and map to the same values:
- `SMTP_HOST` → `EMAIL_HOST`
- `SMTP_PORT` → `EMAIL_PORT`
- `SMTP_USER` → `EMAIL_HOST_USER`
- `SMTP_PASS` → `EMAIL_HOST_PASSWORD`

## Provider Settings
- Gmail: `EMAIL_HOST=smtp.gmail.com`, use `PORT=587` with `EMAIL_USE_TLS=true` or `PORT=465` with `EMAIL_USE_SSL=true`. Use an app password.
- Outlook/Office365: `EMAIL_HOST=smtp.office365.com`, `PORT=587`, `EMAIL_USE_TLS=true`. Use mailbox password or app password.
- Yahoo: `EMAIL_HOST=smtp.mail.yahoo.com`, `PORT=587` with TLS or `PORT=465` with SSL. Use an app password.
- Custom SMTP: Use the host and port from your provider and set SSL/TLS to match the port.

## How It Works
- Code location: `backend/src/lib/mailer.js`
- `createTransport` reads SMTP env vars and creates a Nodemailer transport
- `sendOtp({ to, code, subject, from })` sends the email containing the 6‑digit code
- Signup flow triggers email sending at `POST /api/auth/signup/start`

## Start the Backend
```
cd backend
npm install
npm run dev
```

The server runs on `http://localhost:3000` by default.

## Send a Test OTP Email
Use the signup start endpoint; the email is sent to the `email` field in the payload.

```
curl -X POST http://localhost:3000/api/auth/signup/start -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"recipient@example.com\",\"phoneNumber\":\"\",\"password\":\"Password123\",\"termsAccepted\":true}"
```

Expected response: `{"sent":true}`. Check the mailbox for the verification code.

## Troubleshooting
- Authentication failed: verify `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
- SSL/TLS mismatch: use `EMAIL_USE_SSL=true` for port 465, `EMAIL_USE_TLS=true` for port 587
- From address rejected: set `DEFAULT_FROM_EMAIL` to an allowed sender or the mailbox address
- Connection blocked: ensure firewall allows outbound SMTP to your host/port

## Notes
- `.env` is loaded by `dotenv` in `backend/src/index.js`
- `.env` files are ignored by Git (`backend/.gitignore`), do not commit secrets
- Adjust `VERIFICATION_CODE_TTL_MIN`, `VERIFICATION_RESEND_COOLDOWN_SEC`, and `VERIFICATION_MAX_ATTEMPTS` for your security policy

