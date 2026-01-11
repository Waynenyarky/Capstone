# Backend Documentation

This document provides a comprehensive overview of the backend architecture, setup, and API structure for the Capstone project.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens), Google OAuth
- **Security**: 
  - MFA (TOTP via `otplib`/`qrcode`)
  - WebAuthn (Passkeys via `@simplewebauthn/server`)
  - Bcrypt for password hashing
  - Rate Limiting (`express-rate-limit`)
- **Email**: Nodemailer
- **Validation**: Joi
- **File Uploads**: Multer

## 📂 Project Structure

The backend code is located in the `backend/` directory.

```
backend/
├── src/
│   ├── config/         # Configuration (Database connection)
│   ├── data/           # Seed data
│   ├── lib/            # Helper libraries (Mailer, TOTP, Cipher)
│   ├── middleware/     # Express middleware (Auth, Validation, Rate Limit)
│   ├── models/         # Mongoose Schemas (User, BusinessProfile)
│   ├── routes/         # API Route definitions
│   │   ├── auth/       # Authentication routes
│   │   └── business/   # Business profile routes
│   ├── services/       # Business logic layer
│   └── index.js        # Main application entry point
├── server.js           # Server bootstrap script
├── .env.example        # Environment variable template
└── package.json        # Dependencies and scripts
```

## 🚀 Setup & Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy `.env.example` to `.env` and configure the variables:
   ```bash
   cp .env.example .env
   ```
   
   **Required Variables:**
   - `MONGODB_URI`: Connection string for MongoDB.
   - `JWT_SECRET`: Secret key for signing tokens.
   - `SEED_DEV`: Set to `true` to seed initial data.
   - **Email Settings**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc.
   - **Verification Settings**: TTL and cooldowns for OTPs.

4. **Run the Server:**
   - **Development**:
     ```bash
     npm run dev
     ```
   - **Production**:
     ```bash
     npm start
     ```

## 🔑 Authentication & Security

The backend implements a robust authentication system:

- **Sign Up/Login**: Standard email/password flow and Google OAuth.
- **JWT**: Stateless authentication using Bearer tokens.
- **MFA (Multi-Factor Authentication)**:
  - **TOTP**: Time-based One-Time Passwords (compatible with Google Authenticator).
  - **WebAuthn**: Hardware keys and biometrics (Passkeys).
  - **Backup Codes**: Recovery mechanism for lost MFA devices.
- **Account Security**:
  - Account deletion scheduling (30-day grace period).
  - Password reset via email OTP.
  - Email verification.

## 📡 API Endpoints

### Auth (`/api/auth`)

#### Registration & Login
- `POST /signup`: Register a new user.
- `POST /login`: Authenticate user (supports email/password and Google ID token).
- `POST /send-verification-email`: Send a verification link to the user's email.
- `POST /verify-email-token`: Verify the email using the token from the link.

#### Account Management
- `POST /forgot-password`: Request a password reset code.
- `POST /verify-code`: Verify a reset code.
- `POST /delete-account/send-code`: Initiate account deletion (sends OTP).
- `POST /delete-account/authenticated`: Schedule account deletion (requires password).
- `POST /profile/avatar`: Upload avatar as base64 string.
- `POST /profile/avatar-file`: Upload avatar as multipart file.

#### Multi-Factor Authentication (MFA)
- `POST /mfa/setup`: Generate TOTP secret and QR code URL.
- `POST /mfa/disable-request`: Request to disable MFA (starts waiting period).
- `POST /mfa/disable-undo`: Cancel pending MFA disable request.

#### WebAuthn (Passkeys)
- `POST /webauthn/register/start`: Begin Passkey registration.
- `POST /webauthn/register/complete`: Complete Passkey registration.
- `POST /webauthn/authenticate/start`: Begin Passkey login.
- `POST /webauthn/authenticate/complete`: Complete Passkey login.

### Business (`/api/business`)
- `GET /profile`: Get the current user's business profile.
- `POST /profile`: Create or update the business profile (supports multi-step updates).

## 🗄️ Database Models

- **User**: Stores user credentials, profile info, MFA settings, and roles (`user`, `admin`, `business_owner`, etc.).
- **BusinessProfile**: Stores business details.
- **LoginRequest/SignUpRequest**: Logs for auth attempts.

## 🛡️ Middleware

- **`auth.js`**: Verifies JWT tokens and attaches user to request.
- **`validation.js`**: Validates request bodies using Joi schemas.
- **`rateLimit.js`**: Protects endpoints from brute-force attacks.
