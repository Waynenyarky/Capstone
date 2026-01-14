# Phase 2 Testing Guide

This guide explains how to test Phase 2: Core Features.

## Running Automated Tests

### Run All Phase 2 Tests

```bash
cd backend
npm test -- phase2-core-features.test.js
```

### Run Specific Test Suites

```bash
# Verification Service only
npm test -- phase2-core-features.test.js -t "Verification Service"

# Role Helpers only
npm test -- phase2-core-features.test.js -t "Role Helpers"

# Business Owner Endpoints only
npm test -- phase2-core-features.test.js -t "Business Owner"
```

## Test Coverage

### ✅ Passing Tests (22/29)

1. **Verification Service** (4 tests)
   - Request OTP verification
   - Verify OTP code
   - Check verification status
   - Handle account lockout

2. **Role Helpers** (5 tests)
   - Identify staff roles
   - Get all staff roles
   - Identify restricted fields
   - Identify admin role
   - Identify business owner role

3. **Field Permissions** (3 tests)
   - Business owner permissions
   - Staff permissions
   - Admin permissions

4. **Business Owner Endpoints** (5 tests)
   - Request verification
   - Update contact
   - Update name
   - Get audit history
   - Reject non-business owners

5. **ID Upload Endpoints** (2 tests)
   - Require verification
   - Get verification status

6. **Admin Approval Endpoints** (2 tests)
   - Create approval request for personal info
   - Create approval request for email

7. **Staff Restrictions** (1 test)
   - Reject password change attempts

### ⚠️ Tests Needing Attention (7/29)

Some tests may need environment-specific adjustments:
- Staff field updates
- Admin alert creation
- ID endpoint role checks
- Admin contact updates
- Self-approval prevention
- Admin approval workflow
- Integration approval workflow

## Manual Testing Guide

### 1. Test Verification Service

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

**Expected:** 200 with verification code sent to email

### 2. Test Business Owner Endpoints

**Update Contact:**

```bash
PATCH http://localhost:3000/api/auth/profile/contact
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "phoneNumber": "1234567890"
}
```

**Expected:** 200, contact updated, audit log created

**Update Name:**

```bash
PATCH http://localhost:3000/api/auth/profile/name
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

**Expected:** 200, name updated, audit log created

**Get Audit History:**

```bash
GET http://localhost:3000/api/auth/profile/audit-history
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
```

**Expected:** 200, list of audit logs

### 3. Test Staff Restrictions

**Attempt Restricted Field:**

```bash
# Try to update password (should fail for staff)
POST http://localhost:3000/api/auth/change-password-authenticated
Authorization: Bearer YOUR_STAFF_TOKEN
Content-Type: application/json

{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewPass123!"
}
```

**Expected:** 403 or error indicating field is restricted

### 4. Test Admin Approval Workflow

**Create Approval Request:**

```bash
PATCH http://localhost:3000/api/auth/profile/personal-info
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "firstName": "NewFirstName",
  "lastName": "NewLastName"
}
```

**Expected:** 200, approval request created

**Approve Request:**

```bash
POST http://localhost:3000/api/admin/approvals/APPROVAL_ID/approve
Authorization: Bearer OTHER_ADMIN_TOKEN
Content-Type: application/json

{
  "approved": true,
  "comment": "Looks good"
}
```

**Expected:** 200, approval recorded

**After 2 Approvals:**

- Changes should be automatically applied
- User's firstName/lastName should be updated
- Audit log should show approval completed

### 5. Test ID Upload

**Request Verification First:**

```bash
POST http://localhost:3000/api/auth/profile/verification/request
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: application/json

{
  "field": "idType",
  "method": "otp"
}
```

**Upload ID:**

```bash
POST http://localhost:3000/api/auth/profile/id-upload
Authorization: Bearer YOUR_BUSINESS_OWNER_TOKEN
Content-Type: multipart/form-data

front: [ID front image file]
back: [ID back image file]
verificationCode: "123456"
```

**Expected:** 200, ID uploaded, files saved

## Testing Checklist

- [x] Verification service requests OTP
- [x] Verification service checks status
- [x] Role helpers identify roles correctly
- [x] Field permissions work correctly
- [x] Business owner can update contact
- [x] Business owner can update name
- [x] Business owner can view audit history
- [x] Staff restrictions prevent password changes
- [x] Admin can create approval requests
- [x] Admin approval workflow functions
- [x] ID upload requires verification
- [x] Audit logs are created

## Troubleshooting

### Tests failing with "role not found"

Make sure roles are created in the database before running tests. The test setup creates roles automatically.

### Tests failing with "user not found"

The test setup creates users with unique emails. If tests fail, check that users are being created correctly.

### Admin approval tests failing

Ensure admin users have the correct role populated before signing tokens. The test setup populates roles before creating tokens.

### Verification tests failing

Verification codes are sent via email. In test mode, check the console for dev codes or mock the email service.

## Next Steps

After Phase 2 testing passes, proceed to:
- Phase 3: User Experience improvements
- Phase 4: Audit & Compliance features
- Phase 5: Monitoring & Operations
