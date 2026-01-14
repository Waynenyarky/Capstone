# Phase 1 Testing Guide

This guide explains how to test Phase 1: Security Foundations features.

## Prerequisites

1. **Backend server running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **MongoDB running** (or use in-memory for tests)

3. **Test user account** (will be created automatically in tests)

## Running Automated Tests

### Run All Phase 1 Tests

```bash
cd backend
npm test -- phase1-security.test.js
```

### Run Specific Test Suites

```bash
# Password strength validation only
npm test -- phase1-security.test.js -t "Password Strength"

# Account lockout only
npm test -- phase1-security.test.js -t "Account Lockout"

# Session invalidation only
npm test -- phase1-security.test.js -t "Session Invalidation"
```

## Manual Testing Guide

### 1. Test Password Strength Validation

**Test Weak Passwords:**

```bash
# Test with curl or Postman
POST http://localhost:3000/api/auth/change-password-authenticated
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "YourCurrentPassword123!",
  "newPassword": "weak"  // Should fail
}
```

**Expected:** 400 error with `weak_password` code and list of validation errors

**Test Strong Password:**

```bash
POST http://localhost:3000/api/auth/change-password-authenticated
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "YourCurrentPassword123!",
  "newPassword": "NewStrongPass123!"  // Should succeed
}
```

**Expected:** 200 success, password changed

### 2. Test Password History

**Test Password Reuse:**

1. Change password to `Password123!`
2. Try to change it back to `Password123!`

**Expected:** 400 error with `password_reused` code

**Test Different Password:**

1. Change password to `Password123!`
2. Change to `DifferentPass456!` (should succeed)
3. Change back to `Password123!` (should succeed - it's not in recent 5)

### 3. Test Session Invalidation

**Steps:**

1. Login and get a token
2. Change password using that token
3. Try to use the same token for another request

**Expected:** 401 error with `token_invalidated` code

**Test Script:**

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"OldPass123!"}' \
  | jq -r '.token')

# 2. Change password (this will invalidate the token)
curl -X POST http://localhost:3000/api/auth/change-password-authenticated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!"
  }'

# 3. Try to use old token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized
```

### 4. Test Account Lockout

**Steps:**

1. Attempt verification 5 times with wrong code
2. Try to verify again

**Expected:** Account locked, must wait 15 minutes or admin unlock

**Note:** This requires the verification service (Phase 2), but the lockout mechanism can be tested directly:

```javascript
// In Node.js console or test
const { incrementFailedAttempts, checkLockout } = require('./src/lib/accountLockout')

// Simulate 5 failed attempts
for (let i = 0; i < 5; i++) {
  await incrementFailedAttempts(userId)
}

// Check lockout status
const status = await checkLockout(userId)
console.log(status) // { locked: true, lockedUntil: Date, remainingMinutes: number }
```

### 5. Test Input Sanitization

**Test XSS Prevention:**

```bash
POST http://localhost:3000/api/auth/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "firstName": "<script>alert('xss')</script>John",
  "lastName": "Doe"
}
```

**Expected:** Script tags removed, only "John" saved

### 6. Test File Upload Validation

**Test Valid File:**

```bash
POST http://localhost:3000/api/auth/profile/id-upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [valid JPEG image < 5MB]
```

**Expected:** 200 success, file uploaded

**Test Invalid File:**

```bash
POST http://localhost:3000/api/auth/profile/id-upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [executable file or file > 5MB]
```

**Expected:** 400 error with validation error

### 7. Test Rate Limiting

**Test Profile Update Rate Limit:**

```bash
# Make 11 requests quickly (limit is 10 per minute)
for i in {1..11}; do
  curl -X PATCH http://localhost:3000/api/auth/profile \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber": "1234567890"}'
done
```

**Expected:** 11th request returns 429 Too Many Requests

## Testing Checklist

- [ ] Password strength validation rejects weak passwords
- [ ] Password strength validation accepts strong passwords
- [ ] Password history prevents reusing last 5 passwords
- [ ] Session invalidation works (old tokens rejected after password change)
- [ ] Account lockout activates after 5 failed attempts
- [ ] Account lockout clears after 15 minutes
- [ ] Input sanitization removes XSS vectors
- [ ] File upload validation rejects invalid files
- [ ] File upload validation accepts valid files
- [ ] Rate limiting works on all endpoints
- [ ] MFA re-enrollment flag set after password change

## Troubleshooting

### Tests failing with "Cannot find module"

```bash
cd backend
npm install
```

### Tests failing with database connection

Make sure MongoDB is running or tests are using in-memory database (MongoMemoryServer).

### Rate limiting not working

Check that `DISABLE_RATE_LIMIT` is not set to `true` in your `.env` file.

### Token validation failing

Check that `JWT_SECRET` is set in your `.env` file and matches between test and server.

## Next Steps

After Phase 1 testing passes, proceed to Phase 2: Core Features (Verification Service, Business Owner endpoints, etc.)
