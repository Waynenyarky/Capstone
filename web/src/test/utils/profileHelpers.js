/**
 * Mock profile data for testing
 */
export function createMockProfile(overrides = {}) {
  return {
    id: '123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    role: 'business_owner',
    ...overrides,
  }
}

/**
 * Mock API responses for profile operations
 */
export function createMockProfileResponse(overrides = {}) {
  return {
    ok: true,
    user: createMockProfile(overrides),
    ...overrides,
  }
}

/**
 * Mock error response
 */
export function createMockErrorResponse(code = 'error', message = 'An error occurred') {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  }
}
