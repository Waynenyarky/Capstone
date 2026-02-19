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
- **Email**: REST API (SendGrid, Mailgun, AWS SES, Resend, Postmark)
- **Validation**: Joi
- **File Uploads**: Multer + IPFS
- **Blockchain**: Truffle Suite, Web3.js, Ethereum smart contracts

## 📂 Project Structure

The backend is organized as **microservices** in the `backend/services/` directory.

```
backend/services/
├── auth-service/          # Authentication & User Management (Port 3001)
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── lib/            # Helper libraries (Mailer, TOTP, IPFS)
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # API Route definitions
│   │   └── jobs/           # Background jobs
│   └── package.json
├── business-service/       # Business Registration (Port 3002)
│   ├── src/
│   │   ├── lib/            # Business validation, IPFS, PDF
│   │   ├── models/         # BusinessProfile model
│   │   └── routes/          # Business API routes
│   └── package.json
├── admin-service/          # Admin Operations (Port 3003)
│   ├── src/
│   │   ├── lib/            # Admin utilities
│   │   ├── models/         # Admin models
│   │   └── routes/         # Admin API routes
│   └── package.json
├── audit-service/          # Audit Logging & Blockchain (Port 3004)
│   ├── src/
│   │   ├── lib/            # Blockchain services (web3.js)
│   │   ├── models/         # Audit models
│   │   └── routes/         # Audit API routes
│   └── package.json
├── package.json            # Orchestrator (runs all services)
└── README.md               # Services overview
```

## 🚀 Setup & Installation

### Quick Start (Docker - Recommended)

See [DOCKER_DEPLOY.md](../DOCKER_DEPLOY.md) for the easiest deployment method.

### Manual Setup

1. **Navigate to the services directory:**
   ```bash
   cd backend/services
   ```

2. **Install dependencies for all services:**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration:**
   Each service requires its own `.env` file. See `backend/services/.env.example` for templates.
   
   **Required Variables (per service):**
   - `MONGO_URI`: MongoDB connection string (shared across services)
   - `JWT_SECRET`: Secret key for signing tokens (auth-service)
   - `EMAIL_API_KEY`: API key for email provider (auth-service)
   - `EMAIL_API_PROVIDER`: Provider name (sendgrid, mailgun, etc.)
   - `GANACHE_RPC_URL`: Blockchain RPC URL (audit-service)
   - `DEPLOYER_PRIVATE_KEY`: Private key for blockchain transactions (audit-service)
   - Contract addresses (audit-service): `ACCESS_CONTROL_CONTRACT_ADDRESS`, `USER_REGISTRY_CONTRACT_ADDRESS`, etc.

4. **Start All Services:**
   ```bash
   npm start
   ```
   
   This starts all 4 microservices concurrently:
   - Auth Service: http://localhost:3001
   - Business Service: http://localhost:3002
   - Admin Service: http://localhost:3003
   - Audit Service: http://localhost:3004

## 🔑 Authentication & Security

The backend implements a robust authentication system:

- **Sign Up/Login**: Standard email/password flow and Google OAuth
- **JWT**: Stateless authentication using Bearer tokens
- **MFA (Multi-Factor Authentication)**:
  - **TOTP**: Time-based One-Time Passwords (compatible with Google Authenticator)
  - **WebAuthn**: Hardware keys and biometrics (Passkeys)
  - **Fingerprint**: Device biometric authentication (mobile)
  - **Backup Codes**: Recovery mechanism for lost MFA devices
- **Account Security**:
  - Account deletion scheduling (30-day grace period)
  - Password reset via email OTP
  - Email verification
  - Session management

## 📡 API Endpoints

### Auth Service (`http://localhost:3001/api/auth`)

#### Registration & Login
- `POST /signup/start`: Start signup process (sends OTP)
- `POST /signup/verify`: Verify OTP and complete signup
- `POST /login/start`: Start login (sends OTP)
- `POST /login/verify`: Verify OTP and complete login
- `POST /login/google`: Authenticate with Google OAuth
- `POST /login/verify-totp`: Verify TOTP code during login

#### Account Management
- `POST /forgot-password`: Request a password reset code
- `POST /verify-code`: Verify a reset code
- `POST /delete-account/send-code`: Initiate account deletion (sends OTP)
- `POST /delete-account/authenticated`: Schedule account deletion (requires password)
- `POST /profile/avatar`: Upload avatar (base64 or multipart)
- `GET /profile`: Get user profile
- `PUT /profile`: Update user profile

#### Multi-Factor Authentication (MFA)
- `POST /mfa/setup`: Generate TOTP secret and QR code URL
- `POST /mfa/verify`: Verify TOTP code and enable MFA
- `POST /mfa/disable-request`: Request to disable MFA (starts waiting period)
- `POST /mfa/disable-undo`: Cancel pending MFA disable request
- `POST /mfa/disable`: Disable MFA (after waiting period)
- `GET /mfa/status`: Get MFA status

#### WebAuthn (Passkeys)
- `POST /webauthn/register/start`: Begin Passkey registration
- `POST /webauthn/register/complete`: Complete Passkey registration
- `POST /webauthn/authenticate/start`: Begin Passkey login
- `POST /webauthn/authenticate/complete`: Complete Passkey login

### Business Service (`http://localhost:3002/api/business`)
- `GET /profile`: Get the current user's business profile
- `POST /profile`: Create or update the business profile
- `POST /business-registration/:businessId/documents/upload-file`: Upload business documents (stores in IPFS)

### Admin Service (`http://localhost:3003/api/admin`)
- `GET /approvals`: Get pending approvals
- `POST /approvals/:id/approve`: Approve a request
- `POST /approvals/:id/reject`: Reject a request
- `GET /monitoring`: Get system monitoring data
- `POST /maintenance`: Create maintenance window

### Audit Service (`http://localhost:3004/api/audit`)
- `POST /log`: Log an audit event
- `GET /history`: Get audit history
- `POST /store-document`: Store document CID in blockchain (called by other services)
- `POST /register-user`: Register user in blockchain (called by other services)
- `GET /verify/:hash`: Verify audit hash on blockchain

## 🗄️ Database Models

- **User**: Stores user credentials, profile info, MFA settings, and roles (`user`, `admin`, `business_owner`, etc.)
- **BusinessProfile**: Stores business details and document IPFS CIDs
- **AuditLog**: Stores audit events and blockchain hashes
- **Session**: Tracks user sessions
- **LoginRequest/SignUpRequest**: Logs for auth attempts

## 🛡️ Middleware

- **`auth.js`**: Verifies JWT tokens and attaches user to request
- **`validation.js`**: Validates request bodies using Joi schemas
- **`rateLimit.js`**: Protects endpoints from brute-force attacks
- **`errorHandler.js`**: Centralized error handling
- **`correlationId.js`**: Adds correlation IDs for request tracking
- **`performanceMonitor.js`**: Tracks request performance
- **`securityMonitor.js`**: Monitors security events

## 🔗 Inter-Service Communication

Services communicate via HTTP/REST:
- Auth Service → Audit Service: Log audit events, store document CIDs
- Business Service → Audit Service: Store document CIDs in blockchain
- Admin Service → Auth Service: User management operations
- Admin Service → Audit Service: Audit logging

## 📦 Blockchain Integration

The system uses **Truffle Suite** with **Web3.js** for blockchain interactions:
- **Smart Contracts**: AccessControl, UserRegistry, DocumentStorage, AuditLog
- **Network**: Ganache (development) or Ethereum testnet/mainnet
- **Storage**: IPFS CIDs stored on-chain, full documents in IPFS
- **Service**: Audit Service handles all blockchain interactions

## 📧 Email Service

Email is sent via **REST API** (not SMTP):
- **Providers**: SendGrid, Mailgun, AWS SES, Resend, Postmark
- **Default**: SendGrid
- **Configuration**: Set `EMAIL_API_PROVIDER` and `EMAIL_API_KEY` in auth-service `.env`
- **Mock Mode**: In development, if no API key is set, emails are logged to console

## 🐳 Docker Deployment

For production deployment, see [DOCKER_DEPLOY.md](../DOCKER_DEPLOY.md).
