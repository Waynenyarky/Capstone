# BizClear API Documentation

## Base URLs

| Service | Port | Base Path |
|---------|------|-----------|
| Auth Service | 3001 | `/api/auth` |
| Business Service | 3002 | `/api/business` |
| Admin Service | 3003 | `/api/admin` |
| Audit Service | 3004 | `/api/audit` |
| AI Service | 5001 | `/predict`, `/train`, `/evaluate` |

---

## 1. Auth Service (`/api/auth`)

### 1.1 Login Flow

**Start Login:**
```
POST /api/auth/login/start
Content-Type: application/json

{
  "email": "user@example.com",    // required, valid email
  "password": "TempPass123!"      // required, 6–200 chars
}
```
- Rate limited: 5 requests per 10 min per email
- Returns `{ requiresMfa: true/false, mfaType: "totp"|"passkey"|null }` on success
- Returns `401 invalid_credentials` on wrong email/password (generic — no info leakage)

**Verify OTP:**
```
POST /api/auth/login/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"               // exactly 6 digits
}
```
- Rate limited: 10 requests per 10 min per email
- Returns `{ token, expiresAt }` on success

**Verify TOTP (MFA):**
```
POST /api/auth/login/verify-totp
Content-Type: application/json

{
  "email": "user@example.com",
  "totpCode": "123456"
}
```

### 1.2 Session Management

**Logout:**
```
POST /api/auth/logout
Authorization: Bearer <JWT>
```

**Get Session History:**
```
GET /api/auth/session/history
Authorization: Bearer <JWT>
```

**Invalidate Specific Session:**
```
POST /api/auth/session/invalidate
Authorization: Bearer <JWT>
Content-Type: application/json

{ "sessionId": "<session_id>" }
```

**Invalidate All Other Sessions:**
```
POST /api/auth/session/invalidate-all
Authorization: Bearer <JWT>
```

### 1.3 MFA

**Setup TOTP:**
```
POST /api/auth/mfa/setup
Authorization: Bearer <JWT>
```
Returns QR code data for authenticator app.

**Verify TOTP Setup:**
```
POST /api/auth/mfa/verify
Authorization: Bearer <JWT>
Content-Type: application/json

{ "totpCode": "123456" }
```

**Disable MFA:**
```
POST /api/auth/mfa/disable
Authorization: Bearer <JWT>
Content-Type: application/json

{ "password": "current_password" }
```

### 1.4 Profile

**Get Profile:**
```
GET /api/auth/profile
Authorization: Bearer <JWT>
```

**Update Name:**
```
PATCH /api/auth/profile/name
Authorization: Bearer <JWT>
X-CSRF-Token: <csrf_token>
Content-Type: application/json

{ "firstName": "John", "lastName": "Doe" }
```
- Names sanitized: only letters, spaces, hyphens, apostrophes (max 100 chars)

**Update Contact:**
```
PATCH /api/auth/profile/contact
Authorization: Bearer <JWT>
X-CSRF-Token: <csrf_token>
Content-Type: application/json

{ "phoneNumber": "09171234567" }
```

**Change Password:**
```
PUT /api/auth/profile/password
Authorization: Bearer <JWT>
X-CSRF-Token: <csrf_token>
Content-Type: application/json

{ "currentPassword": "old", "newPassword": "new" }
```
- Rate limited: 3 per hour
- Checks password history (last 5)

### 1.5 CSRF Token

**Get CSRF Token:**
```
GET /api/auth/csrf-token
```
Returns `csrf-token` cookie. SPA reads cookie and sends in `X-CSRF-Token` header for all mutating requests.

---

## 2. AI Service (port 5001)

**Predict LOB:**
```
POST /predict
Content-Type: application/json

{
  "businessDescription": "Small restaurant serving Filipino food",
  "topK": 5,                    // optional, 1–10, default 5
  "threshold": 0.01,            // optional, 0–1, default 0.01
  "minConfidence": 0.50         // optional, 0–1, default 0.50
}
```
Returns:
```json
{
  "recommendations": [
    {
      "taxCode": "D01",
      "lineOfBusiness": "Restaurants / Food Services",
      "detailedLine": "Restaurant",
      "psicCode": "5610",
      "confidence": 0.9234
    }
  ]
}
```
If confidence below `minConfidence`: returns `{ "recommendations": [], "noConfidentMatch": true }`.

**Health Check:**
```
GET /health
```

**Evaluate Model (admin only):**
```
GET /evaluate
X-LOB-Admin-Token: <token>
```

**Retrain Model (admin only):**
```
POST /train
X-LOB-Admin-Token: <token>
Content-Type: application/json

{ "dataset": [ { "businessDescription": "...", "recommendations": [...] } ] }
```

---

## 3. Common Patterns

### Authentication
All protected endpoints require `Authorization: Bearer <JWT>` header. The JWT is validated by `requireJwt()` middleware which checks signature, expiry, and `tokenVersion`.

### CSRF Protection
All POST/PUT/PATCH/DELETE requests (except login and CSRF token endpoint) require `X-CSRF-Token` header matching the `csrf-token` cookie.

### Error Format
```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request",
    "details": [
      { "message": "\"email\" must be a valid email", "path": ["email"], "type": "string.email" }
    ]
  }
}
```

### Rate Limit Response
```json
HTTP 429
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests"
  }
}
```

### Role-Based Access
- `admin` — Full system access
- `staff` / `lgu_officer` — Business processing, inspections assignment
- `business_owner` — Own applications, payments, appeals
- `inspector` — Assigned inspections (mobile app only)
