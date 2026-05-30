# E2E Authentication Tests

Comprehensive end-to-end tests for authentication flows, ensuring complete auth functionality works from frontend through backend to database.

## Prerequisites

### Option 1: Docker Compose (Backend) + Local Frontend

If you're running Docker Compose for backend services:

1. **Start Docker Compose:**
```bash
cd /Users/pendiaz/Documents/my-projects/Capstone
docker-compose up -d
```

This starts: MongoDB, IPFS, Ganache, Auth Service (port 3001), Business Service (port 3002), Admin Service (port 3003), Audit Service (port 3004).

2. **Start Frontend Dev Server:**
```bash
cd /Users/pendiaz/Documents/my-projects/Capstone/web
npm run dev
```

Frontend should be running on `http://localhost:5173`.

### Option 2: Local Backend + Local Frontend

If you're running everything locally:

1. **Start Backend Server:**
```bash
cd /Users/pendiaz/Documents/my-projects/Capstone/backend
npm run dev
```

Backend should be running on `http://localhost:5000` (or your configured port).

2. **Start Frontend Dev Server:**
```bash
cd /Users/pendiaz/Documents/my-projects/Capstone/web
npm run dev
```

Frontend should be running on `http://localhost:5173`.

## Running Tests

### Run All Auth E2E Tests

```bash
cd /Users/pendiaz/Documents/my-projects/Capstone/web
npx playwright test tests/e2e/auth-*.spec.js
```

### Run Specific Test Suite

```bash
# Signup tests
npx playwright test tests/e2e/auth-signup.spec.js

# Login tests
npx playwright test tests/e2e/auth-login.spec.js

# Password reset tests
npx playwright test tests/e2e/auth-password-reset.spec.js

# Account management tests
npx playwright test tests/e2e/auth-account-management.spec.js

# MFA tests
npx playwright test tests/e2e/auth-mfa.spec.js

# Session management tests
npx playwright test tests/e2e/auth-session.spec.js

# Security tests
npx playwright test tests/e2e/auth-security.spec.js
```

### Run Tests in Headed Mode (with browser UI)

```bash
npx playwright test tests/e2e/auth-*.spec.js --headed
```

### Run Tests with Debug Mode

```bash
npx playwright test tests/e2e/auth-*.spec.js --debug
```

## Test Coverage

### auth-signup.spec.js
- Business owner signup with MFA setup
- Admin signup
- Staff signup (LGU officer, inspector)
- Email verification and resend
- Duplicate email handling
- Password strength validation
- Terms acceptance requirement

### auth-login.spec.js
- Standard login with valid credentials
- Invalid credentials handling
- Non-existent user handling
- Login with MFA enabled
- Account lockout after failed attempts
- Remember me functionality
- Redirect after login

### auth-password-reset.spec.js
- Forgot password request
- Email verification for reset
- Password change with verification
- MFA verification during reset
- Password strength validation
- Resend reset code

### auth-account-management.spec.js
- Change password (logged in)
- Change email with verification
- Account deletion with grace period
- Cancel account deletion
- MFA re-enrollment alert

### auth-mfa.spec.js
- MFA setup after signup (business owner)
- QR code display
- MFA verification during login
- MFA disable
- MFA re-enrollment
- Backup codes

### auth-session.spec.js
- Active sessions view
- Invalidate specific session
- Invalidate all sessions
- Session timeout handling
- Session persistence
- Cross-device sessions

### auth-security.spec.js
- CSRF token validation
- Rate limiting enforcement
- CAPTCHA verification
- Password strength enforcement
- Token expiration handling
- Secure headers
- Input sanitization (XSS prevention)

## Test Helpers

### test-data.js
Provides test data generators:
- `generateTestEmail(prefix)` - Unique test emails
- `generateTestPhone()` - Unique test phone numbers
- `testUsers` - Pre-configured user data for different roles
- `testPasswords` - Various password strength test cases
- `testTotpSecret` - Test TOTP secret for predictable codes

### mock-helpers.js
Provides mock utilities:
- `mockEmailService(page)` - Captures verification codes from email API
- `mockMaintenanceStatus(page, active)` - Mocks maintenance mode
- `mockCaptcha(page, success)` - Mocks CAPTCHA verification

### auth-helpers.js
Provides common auth test utilities:
- `fillSignupForm(page, userData)` - Fill signup form
- `fillLoginForm(page, email, password)` - Fill login form
- `submitForm(page, testId)` - Submit form by test ID
- `waitForVerificationStep(page)` - Wait for verification code input
- `fillVerificationCode(page, code)` - Fill verification code
- `waitForMfaSetup(page)` - Wait for MFA setup QR code
- `fillTotpCode(page, code)` - Fill TOTP code
- `waitForDashboard(page)` - Wait for dashboard load
- `logout(page)` - Logout user
- `navigateToSignup(page)` - Navigate to signup
- `navigateToLogin(page)` - Navigate to login
- `navigateToPasswordReset(page)` - Navigate to password reset
- `isAuthenticated(page)` - Check if user is authenticated
- `getCurrentUser(page)` - Get user from localStorage
- `clearAuthState(page)` - Clear auth state

## Test Data Cleanup

Tests use unique emails with timestamps to avoid conflicts. Test users are created during tests and remain in the database for debugging purposes. To clean up test data:

```bash
# Connect to MongoDB and delete test users
mongosh
use test
db.users.deleteMany({ email: /test.*@example\.com/ })
```

## Troubleshooting

### Tests fail with "Server not running"
Ensure both backend and frontend servers are running before starting tests.

### Tests fail with "Timeout waiting for element"
This may indicate:
- Backend API is slow or unresponsive
- Frontend routing issues
- Network connectivity problems

Check browser console for errors and backend logs for API failures.

### Tests fail with "Invalid CSRF token"
Ensure CSRF middleware is properly configured and the frontend is sending the token.

### Tests fail with "Rate limit exceeded"
Wait for the rate limit cooldown period (typically 15 minutes) or clear rate limit data from Redis/Database.

## CI/CD Integration

To run these tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Start Backend
  run: cd backend && npm run dev &
  
- name: Start Frontend
  run: cd web && npm run dev &
  
- name: Wait for servers
  run: sleep 30
  
- name: Run E2E Tests
  run: cd web && npx playwright test tests/e2e/auth-*.spec.js
```

## Notes

- Tests assume a test database environment (MongoDB `test` database)
- Email service is mocked to capture verification codes
- MFA tests use test TOTP secrets for predictable codes
- Some tests skip actual MFA setup for simplicity (marked in comments)
- Tests use `data-testid` attributes for element selection
