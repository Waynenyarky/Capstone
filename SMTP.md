# SMTP Setup for OTP Emails

This backend uses Nodemailer to send one‑time verification codes by email. Configure SMTP in `backend/.env`, start the API, and run a test request to verify delivery.

## Environment Variables
In the `backend/.env` file, put the following keys. Get SMTP credentials from Wayne.
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

## Send a Test OTP Email
Use the signup start endpoint; the email is sent to the `email` field in the payload.

```
curl -X POST http://localhost:3000/api/auth/signup/start -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"recipient@example.com\",\"phoneNumber\":\"\",\"password\":\"Password123\",\"termsAccepted\":true}"
```

Expected response: `{"sent":true}`. Check the mailbox for the verification code.