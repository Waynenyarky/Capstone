/**
 * Test data fixtures for authentication tests
 */

export const validLoginCredentials = {
  email: 'user@example.com',
  password: 'StrongP@ssw0rd',
  rememberMe: false,
}

export const invalidLoginCredentials = {
  email: 'invalid@example.com',
  password: 'WrongP@ssw0rd',
  rememberMe: false,
}

export const lockedAccountCredentials = {
  email: 'locked@example.com',
  password: 'StrongP@ssw0rd',
  rememberMe: false,
}

export const rateLimitedCredentials = {
  email: 'rate-limited@example.com',
  password: 'StrongP@ssw0rd',
  rememberMe: false,
}

export const mfaRequiredCredentials = {
  email: 'mfa-required@example.com',
  password: 'StrongP@ssw0rd',
  rememberMe: false,
}

export const passkeyCredentials = {
  email: 'passkey@example.com',
  password: 'StrongP@ssw0rd',
  rememberMe: false,
}

export const validSignupData = {
  email: 'newuser@example.com',
  password: 'StrongP@ssw0rd',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '09123456789',
  termsAccepted: true,
}

export const existingEmailSignupData = {
  email: 'existing@example.com',
  password: 'StrongP@ssw0rd',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '09123456789',
  termsAccepted: true,
}

export const weakPasswordSignupData = {
  email: 'newuser@example.com',
  password: 'weak',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '09123456789',
  termsAccepted: true,
}

export const mfaLoginResponse = {
  sent: true,
  mfaMethod: 'totp',
  expiresAt: Date.now() + 300000,
}

export const passkeyLoginResponse = {
  sent: true,
  mfaMethod: 'passkey',
}

export const lockedAccountResponse = {
  sent: false,
  locked: true,
  lockedUntil: new Date(Date.now() + 120000).toISOString(),
}

export const rateLimitResponse = {
  error: 'Too many requests',
}

export const invalidCredentialsResponse = {
  error: 'Invalid credentials',
}

export const emailExistsResponse = {
  error: 'Email already exists',
}

export const successLoginResponse = {
  role: 'user',
  token: 'user-token',
  name: 'Test User',
}

export const adminLoginResponse = {
  role: 'admin',
  token: 'admintoken',
}

export const csrfTokenResponse = {
  token: 'test-csrf-token-123',
}
