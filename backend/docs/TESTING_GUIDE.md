# Testing Guide - Account Recovery, Deletion & Session Management

## Running Tests

```bash
cd backend
npm test -- account-recovery-deletion-session.test.js
npm test -- background-jobs.test.js
```

## Test Coverage

### 1. Account Recovery Tests (`account-recovery-deletion-session.test.js`)

#### Business Owner Recovery
- ✅ Password recovery initiation with suspicious activity detection
- ✅ Code verification and reset token generation
- ✅ Password change with validation (12+ chars, history check)
- ✅ Session invalidation on password change
- ✅ MFA re-enrollment requirement
- ✅ Weak password rejection
- ✅ Password history enforcement

#### Staff Recovery Flow
- ✅ Staff recovery request submission
- ✅ Admin viewing recovery requests
- ✅ Admin issuing temporary credentials
- ✅ Admin denying recovery requests
- ✅ Staff login with temporary credentials
- ✅ Forced password change and MFA setup

#### Account Deletion - Business Owner
- ✅ Legal acknowledgment requirement
- ✅ Deletion scheduling with undo token
- ✅ Undo deletion with token

#### Account Deletion - Staff
- ✅ Staff deletion request
- ✅ Admin viewing staff deletion requests
- ✅ Admin approving staff deletion
- ✅ Admin denying staff deletion

#### Account Deletion - Admin
- ✅ Admin deletion request (requires MFA)
- ✅ Admin viewing pending admin deletions
- ✅ Admin approval workflow

#### Session Management
- ✅ Session activity tracking
- ✅ Active sessions listing
- ✅ Session invalidation (single)
- ✅ Session invalidation (all)

#### Utilities
- ✅ Office hours validation
- ✅ High-privilege task checking
- ✅ IP tracking and unusual IP detection

### 2. Background Jobs Tests (`background-jobs.test.js`)

- ✅ Account deletion finalization
- ✅ Temporary credentials expiration
- ✅ Old session cleanup
- ✅ Account unlocking

## Manual Testing Checklist

### Seeded Dev Accounts (DB reset/SEED_DEV=true)
- Seeded passwords default to `TempPass123!` (override with `SEED_TEMP_PASSWORD`).
- Admins: `admin@example.com`, `admin2@example.com`, `admin3@example.com` (must change password + setup MFA).
- Staff samples: `officer@example.com`, `manager@example.com`, `inspector@example.com`, `cso@example.com` (must change password + setup MFA; `isStaff=true`).
- Business Owner: `business@example.com` (must change password).
- All seeded admin/staff have `mustChangeCredentials=true` and `mustSetupMfa=true`.
- In dev, bulk bootstrap MFA secrets/tokens:
  - Set `MFA_BOOTSTRAP_KEY=<key>` and restart backend.
  - `curl -s -X POST http://localhost:3000/api/auth/admin/bootstrap-mfa-bulk -H "Content-Type: application/json" -H "x-bootstrap-key: <key>" -d '{"includeAdmins":true,"includeStaff":true}'`
  - Response returns per-user `token`, `secret`, and `otpauthUri`; use them to verify via `/api/auth/mfa/bootstrap/verify`.

### Business Owner Recovery
1. Navigate to `/forgot-password`
2. Enter email
3. Check email for OTP code
4. Enter code on verification page
5. Set new password (must be 12+ chars, meet requirements)
6. Verify MFA re-enrollment prompt appears
7. Verify all sessions are invalidated

### Staff Recovery
1. Staff logs in and navigates to recovery request
2. Submit recovery request
3. Admin logs in and views recovery requests
4. Admin verifies staff identity
5. Admin issues temporary credentials
6. Staff receives email with temp credentials
7. Staff logs in with temp credentials
8. Staff is forced to change password and set up MFA

### Account Deletion - Business Owner
1. Navigate to Account Settings → Delete Account
2. Enter password
3. Receive verification code
4. Verify code
5. Check legal acknowledgment
6. Confirm deletion
7. Verify undo token is provided
8. Use undo token to cancel deletion

### Account Deletion - Staff
1. Staff navigates to deletion request
2. Check legal acknowledgment
3. Submit request
4. Admin views pending requests
5. Admin approves/denies with reason
6. Staff receives notification

### Account Deletion - Admin
1. Admin navigates to deletion request
2. Verify with MFA
3. Check legal acknowledgment
4. Submit request
5. Another admin reviews request
6. Approving admin verifies with MFA
7. Approve/deny request

### Session Management
1. Log in
2. Navigate to Active Sessions page
3. Verify current session is listed
4. Invalidate a different session
5. Verify session is marked inactive
6. Invalidate all sessions
7. Verify all sessions except current are inactive

## Test Data Setup

### Required Test Users
- Business Owner: `businessowner@test.com`
- Staff: `staff@test.com` (office: OSBC)
- Admin: `admin@test.com` (with MFA enabled)

### Required Roles
- `business_owner`
- `lgu_officer` (or any staff role)
- `admin`

### Office Hours Setup
Create office hours for testing:
```javascript
await OfficeHours.create({
  office: 'OSBC',
  monday: { start: '08:00', end: '17:00', isWorkingDay: true },
  // ... other days
})
```

## Common Issues & Solutions

### Issue: Tests fail with "Model not found"
**Solution:** Ensure all models are imported correctly and database is seeded

### Issue: Background jobs not running
**Solution:** Check that `NODE_ENV !== 'test'` and jobs are initialized after DB connection

### Issue: Session creation fails
**Solution:** Ensure User model has `tokenVersion` field and role is populated

### Issue: MFA verification fails in tests
**Solution:** Mock MFA verification or set up proper MFA secret for test users
