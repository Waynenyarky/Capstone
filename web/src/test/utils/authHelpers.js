/**
 * Mock authentication state for testing
 */
export function createMockAuthState(overrides = {}) {
  return {
    currentUser: {
      id: '123',
      email: 'test@example.com',
      role: 'business_owner',
      token: 'mock-token',
    },
    role: {
      slug: 'business_owner',
      name: 'Business Owner',
    },
    isAuthenticated: true,
    ...overrides,
  }
}

/**
 * Mock tokens for testing
 */
export function createMockToken(userId = '123', role = 'business_owner') {
  return `mock.jwt.token.${userId}.${role}`
}

/**
 * Mock user roles
 */
export const mockRoles = {
  businessOwner: { slug: 'business_owner', name: 'Business Owner' },
  admin: { slug: 'admin', name: 'Admin' },
  staff: { slug: 'lgu_officer', name: 'LGU Officer' },
}
