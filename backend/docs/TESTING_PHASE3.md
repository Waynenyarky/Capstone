# Phase 3 Testing Guide

This guide explains how to test Phase 3: User Experience features.

## Running Automated Tests

### Run All Phase 3 Tests

```bash
cd backend
npm test -- phase3-user-experience.test.js
```

### Run Specific Test Suites

```bash
# Email Change Grace Period only
npm test -- phase3-user-experience.test.js -t "Email Change Grace Period"

# Email Revert Functionality only
npm test -- phase3-user-experience.test.js -t "Email Revert"

# Notification Service only
npm test -- phase3-user-experience.test.js -t "Notification Service"
```

## Test Coverage

### ✅ All Tests Passing (20/20)

1. **Email Change Grace Period** (4 tests)
   - Create email change request with grace period
   - Prevent multiple pending requests
   - Get email change status
   - Return no pending change when none exists

2. **Email Revert Functionality** (3 tests)
   - Revert email change within grace period
   - Reject revert after grace period expires
   - Reject revert for already reverted request

3. **Notification Service** (4 tests)
   - Send email change notification
   - Send password change notification
   - Send admin alert
   - Send approval notification

4. **Error Handler** (4 tests)
   - Provide user-friendly error messages
   - Handle context in error messages
   - Create safe error responses
   - Handle validation errors

5. **Integration Tests** (2 tests)
   - Create audit log when email is changed
   - Include email change request in user response

6. **Email Change Request Model** (3 tests)
   - Check if within grace period
   - Detect expired grace period
   - Detect reverted requests

## Manual Testing Guide

### 1. Test Email Change Grace Period

**Request Verification:**

```bash
POST http://localhost:3000/api/auth/profile/verification/request
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "field": "email",
  "method": "otp"
}
```

**Change Email:**

```bash
PATCH http://localhost:3000/api/auth/profile/email
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "newEmail": "newemail@example.com",
  "verificationCode": "123456"
}
```

**Expected:** 
- 200 response
- Email updated
- Email change request created with 24-hour grace period
- Notifications sent to both old and new email
- Response includes `emailChangeRequest` object with `canRevert: true`

**Check Status:**

```bash
GET http://localhost:3000/api/auth/profile/email/change-status
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
```

**Expected:** 
- 200 response
- `hasPendingChange: true`
- `emailChangeRequest` object with remaining hours

### 2. Test Email Revert

**Revert Email Change:**

```bash
POST http://localhost:3000/api/auth/profile/email/revert
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
```

**Expected:**
- 200 response
- Email reverted to old email
- Email change request marked as reverted
- Audit log created
- Notification sent

**After Grace Period Expires:**

```bash
# Wait 24+ hours or manually expire the request in database
POST http://localhost:3000/api/auth/profile/email/revert
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
```

**Expected:**
- 404 response
- Error: "No pending email change request found or grace period has expired"

### 3. Test Notifications

**Email Change Notification:**
- Check both old and new email inboxes
- Should receive notification with grace period information
- Old email should have revert link

**Password Change Notification:**
- Change password
- Check email inbox
- Should receive password change confirmation

**Admin Alert:**
- Have a staff user attempt to change password
- Check admin email inboxes
- Should receive security alert

**Approval Notification:**
- Create admin approval request
- Have another admin approve/reject
- Check requesting admin's email
- Should receive approval/rejection notification

### 4. Test Error Messages

**Test Various Error Scenarios:**

```bash
# Invalid verification code
PATCH http://localhost:3000/api/auth/profile/email
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "newEmail": "new@example.com",
  "verificationCode": "wrong"
}
```

**Expected:** Clear error message explaining verification failed

```bash
# Weak password
PATCH http://localhost:3000/api/auth/profile/password
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "CurrentPass123!",
  "newPassword": "weak"
}
```

**Expected:** Detailed error message explaining password requirements

## Testing Checklist

- [x] Email change creates grace period request
- [x] Multiple pending requests are prevented
- [x] Email change status endpoint works
- [x] Email revert works within grace period
- [x] Email revert rejected after grace period
- [x] Email notifications are sent
- [x] Password change notifications are sent
- [x] Admin alerts are sent
- [x] Approval notifications are sent
- [x] Error messages are user-friendly
- [x] Error messages include context
- [x] Audit logs are created for email changes
- [x] Email change request model methods work correctly

## Troubleshooting

### Tests timing out

If tests timeout, increase the timeout value:
```javascript
it('test name', async () => {
  // test code
}, 10000) // 10 second timeout
```

### Email notifications not sending

In test mode, emails are mocked and logged to console. Check console output for:
```
⚠️  SMTP FAILED (Mocking Send) ⚠️
```

This is expected in test mode. In production, ensure SMTP is configured.

### Email change request not found

Make sure to clean up existing requests before tests:
```javascript
await EmailChangeRequest.deleteMany({ userId: user._id })
```

### Verification code issues

Verification codes are generated and stored in memory. In tests, you may need to mock or use the dev code if available.

## Next Steps

After Phase 3 testing passes, proceed to:
- Phase 4: Audit & Compliance features
- Phase 5: Monitoring & Operations
- End-to-end integration testing
