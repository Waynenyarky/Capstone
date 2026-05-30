# Authentication Test Infrastructure

## Overview
This document outlines the test infrastructure for authentication features, including CI/CD integration, mobile testing, browser compatibility, and internationalization (i18n) considerations.

## Test Structure

### Directory Organization
```
src/features/authentication/
├── __tests__/
│   ├── LoginFlow.test.jsx
│   ├── LoginFlow.integration.test.jsx
│   ├── LoginFlow.accessibility.test.jsx
│   ├── LoginFlow.security.test.jsx
│   ├── SignupFlow.test.jsx
│   ├── SignupFlow.integration.test.jsx
│   ├── AuthIntegrationPoints.test.jsx
│   └── ROLLBACK_STRATEGY.md
├── components/__tests__/
│   ├── LoginForm.test.jsx
│   ├── ChangePasswordForm-simple.test.jsx
│   └── ProtectedRoute.test.jsx
├── mfa/__tests__/
│   ├── MFA.integration.test.jsx
│   ├── mfa.ui.test.jsx
│   └── resendCooldownLock.test.jsx
├── passkey/__tests__/
│   └── Passkey.integration.test.jsx
└── flows/password-reset/__tests__/
    └── PasswordResetFlow.integration.test.jsx
```

## Test Utilities

### renderWithProviders
Location: `src/test/utils/renderWithProviders.jsx`

Wraps components with necessary providers:
- ThemeProvider
- ConfigProvider (Ant Design)
- Router (MemoryRouter for tests)
- Auth providers

### MSW Handlers
Location: `src/test/msw/handlers.js`

Mock API endpoints for:
- Maintenance status
- Login start/finalize
- Signup start/finalize
- CSRF token requests
- Password reset
- Logout

### Test Fixtures
Location: `src/test/fixtures/authData.js`

Test data for:
- Valid/invalid credentials
- Locked accounts
- Rate-limited attempts
- MFA/passkey requirements
- Signup data

### Auth Test Helpers
Location: `src/test/utils/authTestHelpers.jsx`

Helper functions for:
- Rendering forms with real hooks
- Filling and submitting forms
- Waiting for verification steps
- Filling OTP codes

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Authentication Tests

on:
  pull_request:
    paths:
      - 'src/features/authentication/**'
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --run src/features/authentication
      - run: npx eslint src/features/authentication/**/*.test.jsx
```

### Pre-commit Hooks
Using Husky to run lint and tests before commits:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm test -- --run src/features/authentication"
    }
  }
}
```

## Mobile Testing

### Viewport Testing
Tests should verify responsive behavior across:
- Mobile: 375px - 428px
- Tablet: 768px - 1024px
- Desktop: 1024px+

### Touch Events
Test touch interactions for:
- Form submissions
- Button taps
- OTP input
- Passkey authentication

### Mobile-Specific Considerations
- Virtual keyboard behavior
- Touch target sizes (minimum 44x44px)
- Orientation changes
- Offline behavior

## Browser Compatibility

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Browser-Specific Tests
- WebAuthn/Passkey support detection
- localStorage availability
- Clipboard API usage
- Notification API support

### Polyfills
The project includes canvas polyfill for older browsers. Tests verify:
- Polyfill loading
- Fallback behavior
- Graceful degradation

## Internationalization (i18n)

### Supported Languages
- English (en)
- Filipino (fil)
- [Add other languages as needed]

### i18n Testing Strategy
1. **Static Text**: Verify all user-facing text is translatable
2. **Error Messages**: Test error messages in all supported languages
3. **Form Validation**: Ensure validation messages are localized
4. **Date/Time Formats**: Test locale-specific formatting
5. **Number Formats**: Verify currency and number formatting

### i18n Test Example
```javascript
it('displays localized error messages', () => {
  // Test error message in English
  renderWithProviders(<LoginForm />, { locale: 'en' })
  // Verify English error text

  // Test error message in Filipino
  renderWithProviders(<LoginForm />, { locale: 'fil' })
  // Verify Filipino error text
})
```

## Test Cleanup

### Before Each Test
- Clear all mocks
- Reset localStorage
- Clear sessionStorage
- Reset MSW handlers

### After Each Test
- Unmount components
- Clear timers
- Reset network mocks

### Global Setup
```javascript
// vitest.setup.js
import { vi } from 'vitest'

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock
```

## Performance Testing

### Test Execution Time
- Individual tests should complete within 5 seconds
- Full test suite should complete within 30 seconds
- Integration tests may take up to 10 seconds

### Memory Leaks
- Ensure components unmount cleanly
- Clear event listeners
- Dispose of subscriptions

## Coverage Reporting

### Coverage Targets
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Coverage Commands
```bash
# Generate coverage report
npm test -- --coverage src/features/authentication

# View coverage in browser
npm test -- --coverage --reporter=html
```

## Flaky Test Prevention

### Common Flaky Test Causes
1. **Timing Issues**: Use `waitFor` instead of fixed timeouts
2. **Async Operations**: Wrap in `act()` or use `waitFor`
3. **Network Latency**: Mock all network calls with MSW
4. **Race Conditions**: Ensure proper test isolation

### Best Practices
- Use `waitFor` for async assertions
- Mock external dependencies
- Clean up after each test
- Avoid hardcoded timeouts
- Use deterministic test data

## Debugging Tests

### Vitest Debug Mode
```bash
npm test -- --run --debug src/features/authentication
```

### Console Logging
Add debug logs to identify issues:
```javascript
console.log('Current state:', componentState)
console.log('Mock calls:', mockFunction.mock.calls)
```

### Test Isolation
Run single test file:
```bash
npm test -- --run src/features/authentication/__tests__/LoginFlow.test.jsx
```

Run single test:
```bash
npm test -- --run -t "should render login form"
```

## Continuous Improvement

### Test Metrics to Track
- Test execution time
- Flaky test rate
- Coverage percentage
- Failed test count

### Regular Maintenance
- Update test dependencies monthly
- Review and refactor slow tests
- Remove obsolete tests
- Add tests for new features
- Update documentation

## Resources
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [ESLint Rules](https://eslint.org/docs/latest/)
