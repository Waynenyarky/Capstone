# Phase 1 Manual Testing Guide

Quick guide to manually test Phase 1 features using your API or frontend.

## Prerequisites

1. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Have a test user account** (or create one via signup)

3. **Get an auth token** (login via API or frontend)

## Quick Test Scenarios

### 1. Test Password Strength Validation

**Using curl:**

```bash
# Replace YOUR_TOKEN with actual token
TOKEN="your_jwt_token_here"

# Test weak password (should fail)
curl -X POST http://localhost:3000/api/auth/change-password-authenticated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "YourCurrentPassword123!",
    "newPassword": "weakpass"
  }'

# Expected: 400 error with "weak_password" code
```

**Test cases to try:**
- `weakpass` - No uppercase, number, special char → Should fail
- `WEAKPASS` - No lowercase, number, special char → Should fail  
- `WeakPass` - No number, special char → Should fail
- `WeakPass123` - No special char → Should fail
- `WeakPass123!` - ✅ Should succeed

### 2. Test Password History

**Steps:**

1. Change password to `Password123!`
2. Try to change it back to `Password123!` immediately

**Expected:** Error saying "You cannot reuse a recently used password"

3. Change to `DifferentPass456!` (should work)
4. Change to `AnotherPass789!` (should work)
5. Change back to `Password123!` (should work - it's not in last 5)

### 3. Test Session Invalidation

**Steps:**

1. Login and save your token
2. Change your password
3. Try to use the old token for any API call

**Using curl:**

```bash
# 1. Login and save token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"OldPassword123!"}' \
  | jq -r '.token')

# 2. Change password (this invalidates the token)
curl -X POST http://localhost:3000/api/auth/change-password-authenticated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'

# 3. Try to use old token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized with "token_invalidated" code
```

### 4. Test MFA Re-enrollment Flag

**Steps:**

1. Change your password
2. Check your user profile

**Expected:** 
- `mfaReEnrollmentRequired: true`
- `mfaEnabled: false`
- Must re-setup MFA on next login

### 5. Test Input Sanitization

**Test XSS prevention:**

```bash
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<script>alert(\"xss\")</script>John",
    "lastName": "Doe"
  }'

# Check database - script tags should be removed
```

### 6. Test Rate Limiting

**Test profile update rate limit (10 per minute):**

```bash
# Make 11 rapid requests
for i in {1..11}; do
  curl -X PATCH http://localhost:3000/api/auth/profile \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\": \"123456789$i\"}"
  echo "Request $i"
done

# Expected: 11th request returns 429 Too Many Requests
```

### 7. Test Account Lockout

**Note:** This requires the verification service (Phase 2), but you can test the mechanism:

```javascript
// In Node.js console (connect to your DB)
const { incrementFailedAttempts, checkLockout } = require('./src/lib/accountLockout')
const User = require('./src/models/User')

// Get a test user ID
const user = await User.findOne({ email: 'test@example.com' })

// Simulate 5 failed attempts
for (let i = 0; i < 5; i++) {
  await incrementFailedAttempts(user._id)
}

// Check lockout status
const status = await checkLockout(user._id)
console.log(status) 
// Should show: { locked: true, lockedUntil: Date, remainingMinutes: 15 }
```

## Testing Checklist

- [ ] ✅ Password strength validation works (weak passwords rejected)
- [ ] ✅ Strong passwords accepted
- [ ] ✅ Password history prevents reuse
- [ ] ✅ Session invalidation works (old tokens rejected)
- [ ] ✅ MFA re-enrollment flag set after password change
- [ ] ✅ Input sanitization removes XSS
- [ ] ✅ Rate limiting works
- [ ] ✅ Account lockout mechanism works

## What to Look For

### Success Indicators:
- Weak passwords are rejected with clear error messages
- Strong passwords are accepted
- Old tokens don't work after password change
- User must re-login after password change
- MFA must be re-setup after password change
- XSS attempts are sanitized
- Rate limits are enforced

### Common Issues:
- **Token still works after password change** → Check tokenVersion increment
- **Weak password accepted** → Check password validator integration
- **Rate limit not working** → Check DISABLE_RATE_LIMIT env var
- **Tests failing** → Make sure MongoDB is running or using in-memory DB

## Next Steps

Once Phase 1 testing passes, you can proceed to Phase 2: Core Features (Verification Service, Business Owner endpoints, etc.)
