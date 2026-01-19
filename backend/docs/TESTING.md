# Testing Guide

This guide explains how to run tests, write new tests, and understand the test structure for the backend.

## Table of Contents

- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing New Tests](#writing-new-tests)
- [Test Utilities](#test-utilities)
- [Mocking Strategies](#mocking-strategies)
- [Test Isolation](#test-isolation)
- [Coverage Goals](#coverage-goals)

## Running Tests

### Run All Tests

```bash
cd backend
npm test
```

### Run Specific Test File

```bash
npm test -- profile-edit.test.js
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests Matching a Pattern

```bash
npm test -- -t "email change"
```

## Test Structure

Tests are organized by feature domain:

```
backend/__tests__/
├── helpers/              # Shared test utilities
│   ├── setup.js          # Environment and database setup
│   ├── fixtures.js       # Test data factories
│   ├── cleanup.js        # Test data cleanup
│   ├── mocks.js          # Mocking utilities
│   ├── auth.js           # Authentication helpers
│   ├── api.js            # API request helpers
│   └── verification.js   # Verification helpers
├── integration/          # Integration tests
│   ├── profile-edit.test.js
│   ├── authentication-complete.test.js
│   ├── authorization-boundary.test.js
│   ├── integration-flows.test.js
│   ├── security-comprehensive.test.js
│   └── error-scenarios.test.js
├── security/             # Security-focused tests
│   ├── password-security.test.js
│   ├── account-lockout.test.js
│   ├── session-management.test.js
│   └── input-validation.test.js
└── features/             # Feature-specific tests
    ├── audit-compliance.test.js
    ├── monitoring-operations.test.js
    └── [other feature tests]
```

## Writing New Tests

### Basic Test Structure

```javascript
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require('../helpers/setup')
const {
  createTestUsers,
  getTestTokens,
} = require('../helpers/fixtures')
const { cleanupTestData } = require('../helpers/cleanup')

describe('Feature Name', () => {
  let mongo
  let app
  let businessOwner
  let businessOwnerToken

  beforeAll(async () => {
    setupTestEnvironment()
    mongo = await setupMongoDB()
    app = setupApp()

    const users = await createTestUsers()
    businessOwner = users.businessOwner
    const tokens = getTestTokens(users)
    businessOwnerToken = tokens.businessOwnerToken
  })

  afterAll(async () => {
    await teardownMongoDB()
  })

  beforeEach(async () => {
    await cleanupTestData()
    // Recreate users if needed
  })

  it('should do something', async () => {
    // Test implementation
  })
})
```

### Using Test Fixtures

```javascript
const { createTestUser, generateUniqueEmail } = require('../helpers/fixtures')

// Create a test user
const user = await createTestUser({
  roleSlug: 'business_owner',
  email: generateUniqueEmail('testuser'),
  password: 'Test123!@#',
})
```

### Making API Requests

```javascript
const request = require('supertest')

const response = await request(app)
  .patch('/api/auth/profile/name')
  .set('Authorization', `Bearer ${businessOwnerToken}`)
  .send({
    firstName: 'Updated',
    lastName: 'Name',
  })

expect(response.status).toBe(200)
expect(response.body.updated).toBe(true)
```

## Test Utilities

### Setup Helpers (`helpers/setup.js`)

- `setupTestEnvironment()` - Configure test environment variables
- `setupMongoDB()` - Initialize MongoDB Memory Server
- `teardownMongoDB()` - Cleanup MongoDB connection
- `setupApp()` - Initialize Express app for testing

### Fixtures (`helpers/fixtures.js`)

- `createTestUser(options)` - Create a test user with unique data
- `createTestUsers()` - Create all standard test users (businessOwner, staff, admin)
- `getTestTokens(users)` - Generate JWT tokens for test users
- `generateUniqueEmail(prefix)` - Generate unique email addresses
- `generateUniquePhone(prefix)` - Generate unique phone numbers

### Cleanup (`helpers/cleanup.js`)

- `cleanupTestData()` - Remove all test-created data
- `cleanupTestUsers()` - Remove test users only
- `cleanupDatabase()` - Clear all collections (except roles)
- `resetDatabase()` - Full database reset

### Auth Helpers (`helpers/auth.js`)

- `requestVerificationAndGetCode(userId, purpose, method)` - Request verification and get code
- `loginAsUser(user, password)` - Complete login flow helper
- `createAuthenticatedRequest(request, token)` - Create authenticated supertest request

### API Helpers (`helpers/api.js`)

- `makeRequest(app, method, path, options)` - Unified request helper
- `expectSuccess(response, expectedData)` - Assert success response
- `expectError(response, code, status)` - Assert error response

## Mocking Strategies

### Email Service

Email service is automatically mocked in test mode when `EMAIL_HOST` is set to `'localhost'`. Emails are logged to console instead of being sent.

### Blockchain Service

Blockchain is disabled in tests by setting `AUDIT_CONTRACT_ADDRESS=''` in the test environment.

### External APIs

External APIs (like Google OAuth) should be mocked using `jest.mock()` in individual test files:

```javascript
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(),
}))
```

## Test Isolation

**CRITICAL:** All tests must clean up after themselves to prevent interference.

### Using beforeEach/afterEach

```javascript
beforeEach(async () => {
  await cleanupTestData()
  // Recreate test users if needed
})

afterEach(async () => {
  await cleanupTestData()
})
```

### Unique Data

Always use unique data (emails, phone numbers) to prevent conflicts:

```javascript
const email = generateUniqueEmail('testuser')
const phone = generateUniquePhone('__unset__')
```

## Coverage Goals

Target coverage thresholds:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Coverage by Feature

- **Profile Edit Endpoints**: 90%+ coverage
- **Authentication Endpoints**: 85%+ coverage
- **Authorization Middleware**: 95%+ coverage
- **Integration Flows**: All critical paths covered

## Best Practices

1. **Use shared utilities** - Always use helpers from `helpers/` directory
2. **Test isolation** - Clean up data between tests using `beforeEach`/`afterEach`
3. **Unique data** - Use `generateUniqueEmail()` and `generateUniquePhone()` for test data
4. **Clear test names** - Use descriptive `it()` descriptions: "should [expected behavior] when [condition]"
5. **Test both success and failure** - Include positive and negative test cases
6. **Test edge cases** - Test boundary conditions, empty values, null values
7. **Keep tests focused** - Each test should verify one specific behavior
8. **Use fixtures** - Use `createTestUser()` instead of manually creating users

## Common Patterns

### Testing Authentication Required

```javascript
it('should require authentication', async () => {
  const response = await request(app)
    .get('/api/auth/profile')

  expect(response.status).toBe(401)
  expect(response.body.error.code).toBe('unauthorized')
})
```

### Testing Role-Based Access

```javascript
it('should reject non-admin from admin endpoints', async () => {
  const response = await request(app)
    .get('/api/auth/staff')
    .set('Authorization', `Bearer ${businessOwnerToken}`)

  expect(response.status).toBe(403)
  expect(response.body.error.code).toBe('forbidden')
})
```

### Testing Verification Flow

```javascript
it('should require verification for email change', async () => {
  // Request verification
  await requestOTPVerification(businessOwner._id, 'email_change')

  // Try to change email without code
  const response = await request(app)
    .patch('/api/auth/profile/email')
    .set('Authorization', `Bearer ${businessOwnerToken}`)
    .send({
      newEmail: 'new@example.com',
    })

  expect(response.status).toBe(428)
  expect(response.body.error.code).toBe('verification_required')
})
```

## Troubleshooting

### Tests Failing Due to Data Conflicts

- Ensure you're using `generateUniqueEmail()` and `generateUniquePhone()`
- Check that `cleanupTestData()` is called in `beforeEach`

### Tests Timing Out

- Increase test timeout if needed: `jest.setTimeout(60000)`
- Check for unclosed database connections
- Ensure `teardownMongoDB()` is called in `afterAll`

### Mock Issues

- Clear mocks between tests: `vi.clearAllMocks()` in `beforeEach`
- Ensure mocks are set up before imports that use them

## CI/CD

Tests run automatically on GitHub Actions when you push code or open a PR. See `.github/workflows/backend-tests.yml` for the CI configuration.

The CI workflow:
1. Sets up Node.js
2. Installs dependencies
3. Runs all tests
4. Generates coverage report
5. Uploads coverage artifacts

If tests fail, the PR will be blocked from merging.
