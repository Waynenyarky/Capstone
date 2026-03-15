import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  signupStart, 
  signup, 
  verifySignupCode, 
  resendSignupCode,
  loginStart,
  loginResend,
  loginPost,
  verifyLoginCode,
  verifyLoginTotp,
  adminLoginStart,
  adminVerifyLoginCode,
  getMe,
  logoutApi,
  sendForgotPassword,
  verifyResetCode,
  changePassword,
  changePasswordAuthenticated,
  changePasswordStart,
  changePasswordVerify,
  changeEmail,
  changeEmailStart,
  changeEmailVerify,
  getEmailChangeStatus,
  revertEmailChange,
  changeEmailConfirmStart,
  changeEmailConfirmVerify,
  cancelAccountDeletion,
  confirmAccountDeletion,
  deleteAccountAuthenticated,
  getProfile,
  firstLoginChangeCredentials
} from '@/features/authentication/services/authService.js'

// Mock the dependencies
vi.mock('@/lib/http.js', () => ({
  fetchJsonWithFallback: vi.fn(),
  fetchWithFallback: vi.fn()
}))

vi.mock('@/lib/authHeaders.js', () => ({
  authHeaders: vi.fn((currentUser, role, baseHeaders) => ({
    'x-user-id': currentUser?.id || 'test-user',
    'x-user-email': currentUser?.email || 'test@example.com',
    ...(baseHeaders || {})
  }))
}))

vi.mock('@/features/authentication/lib/authEvents.js', () => ({
  getCurrentUser: vi.fn(() => ({ id: 'test-user', token: 'test-token' }))
}))

import { fetchJsonWithFallback, fetchWithFallback } from '@/lib/http.js'

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Signup Functions', () => {
    it('should call signupStart with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', password: 'password123' }
      const result = await signupStart(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call signup with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', password: 'password123' }
      const result = await signup(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call verifySignupCode with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', code: '123456' }
      const result = await verifySignupCode(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call resendSignupCode with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com' }
      const result = await resendSignupCode(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Login Functions', () => {
    it('should call loginStart with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com' }
      const result = await loginStart(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call loginResend with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com' }
      const result = await loginResend(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call loginPost with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', password: 'password123' }
      const result = await loginPost(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call verifyLoginCode with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', code: '123456' }
      const result = await verifyLoginCode(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call verifyLoginTotp with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { token: '123456' }
      const result = await verifyLoginTotp(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Admin Login Functions', () => {
    it('should call adminLoginStart with correct parameters on success', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'admin@example.com' }
      const result = await adminLoginStart(payload)

      expect(fetchWithFallback).toHaveBeenCalledWith('/api/auth/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toEqual({ success: true })
    })

    it('should reject adminLoginStart on failed response', async () => {
      const mockResponse = { ok: false, status: 400, json: vi.fn().mockResolvedValue({ error: 'Invalid credentials' }) }
      fetchWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'admin@example.com' }

      await expect(adminLoginStart(payload)).rejects.toEqual({
        status: 400,
        body: { error: 'Invalid credentials' }
      })
    })

    it('should handle adminLoginStart with no response', async () => {
      fetchWithFallback.mockResolvedValue(null)

      const payload = { email: 'admin@example.com' }

      await expect(adminLoginStart(payload)).rejects.toEqual({
        status: 0,
        body: null
      })
    })

    it('should call adminVerifyLoginCode with correct parameters on success', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ success: true }) }
      fetchWithFallback.mockResolvedValue(mockResponse)

      const payload = { code: '123456' }
      const result = await adminVerifyLoginCode(payload)

      expect(fetchWithFallback).toHaveBeenCalledWith('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toEqual({ success: true })
    })

    it('should reject adminVerifyLoginCode on failed response', async () => {
      const mockResponse = { ok: false, status: 401, json: vi.fn().mockResolvedValue({ error: 'Invalid code' }) }
      fetchWithFallback.mockResolvedValue(mockResponse)

      const payload = { code: '123456' }

      await expect(adminVerifyLoginCode(payload)).rejects.toEqual({
        status: 401,
        body: { error: 'Invalid code' }
      })
    })
  })

  describe('User Session Functions', () => {
    it('should call getMe with correct parameters', async () => {
      const mockResponse = { user: { id: 'test-user', email: 'test@example.com' } }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await getMe()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/me', { method: 'GET' })
      expect(result).toBe(mockResponse)
    })

    it('should call logoutApi with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await logoutApi()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Password Reset Functions', () => {
    it('should call sendForgotPassword with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com' }
      const result = await sendForgotPassword(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call verifyResetCode with correct parameters', async () => {
      const mockResponse = { ok: true }
      fetchWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', code: '123456' }
      const result = await verifyResetCode(payload)

      expect(fetchWithFallback).toHaveBeenCalledWith('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changePassword with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { token: 'reset-token', newPassword: 'newPassword123' }
      const result = await changePassword(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Authenticated Password Change Functions', () => {
    it('should call changePasswordAuthenticated with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { currentPassword: 'oldPassword', newPassword: 'newPassword123' }
      const result = await changePasswordAuthenticated(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password-authenticated', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changePasswordStart with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { currentPassword: 'oldPassword' }
      const result = await changePasswordStart(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password/start', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changePasswordVerify with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { otp: '123456', newPassword: 'newPassword123' }
      const result = await changePasswordVerify(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password/verify', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Email Change Functions', () => {
    it('should call changeEmail with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { newEmail: 'newemail@example.com', password: 'password123' }
      const result = await changeEmail(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changeEmailStart with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { newEmail: 'newemail@example.com', password: 'password123' }
      const result = await changeEmailStart(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email/start', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changeEmailVerify with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { otp: '123456' }
      const result = await changeEmailVerify(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email/verify', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call getEmailChangeStatus with correct parameters', async () => {
      const mockResponse = { status: 'pending', gracePeriodEnds: '2024-01-01T00:00:00Z' }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await getEmailChangeStatus()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/profile/email/change-status', {
        method: 'GET',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com' }
      })
      expect(result).toBe(mockResponse)
    })

    it('should call revertEmailChange with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await revertEmailChange()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/profile/email/revert', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' }
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changeEmailConfirmStart with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { password: 'password123' }
      const result = await changeEmailConfirmStart(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email/confirm/start', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call changeEmailConfirmVerify with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { otp: '123456' }
      const result = await changeEmailConfirmVerify(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email/confirm/verify', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Account Deletion Functions', () => {
    it('should call cancelAccountDeletion with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await cancelAccountDeletion()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/delete-account/cancel', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' }
      })
      expect(result).toBe(mockResponse)
    })

    it('should call confirmAccountDeletion with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { confirmation: 'DELETE' }
      const result = await confirmAccountDeletion(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/delete-account/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })

    it('should call deleteAccountAuthenticated with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { password: 'password123' }
      const result = await deleteAccountAuthenticated(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/delete-account/authenticated', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Profile Functions', () => {
    it('should call getProfile with correct parameters', async () => {
      const mockResponse = { user: { id: 'test-user', email: 'test@example.com' } }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const result = await getProfile()

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' }
      })
      expect(result).toBe(mockResponse)
    })

    it('should call firstLoginChangeCredentials with correct parameters', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'newemail@example.com', password: 'newPassword123' }
      const result = await firstLoginChangeCredentials(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/first-login/change-credentials', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors in signup functions', async () => {
      const networkError = new Error('Network error')
      fetchJsonWithFallback.mockRejectedValue(networkError)

      await expect(signupStart({ email: 'test@example.com' })).rejects.toThrow('Network error')
    })

    it('should handle API errors in login functions', async () => {
      const apiError = new Error('Invalid credentials')
      fetchJsonWithFallback.mockRejectedValue(apiError)

      await expect(loginPost({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    })

    it('should handle JSON parsing errors in admin functions', async () => {
      const mockResponse = { ok: false, status: 500, json: vi.fn().mockRejectedValue(new Error('Invalid JSON')) }
      fetchWithFallback.mockResolvedValue(mockResponse)

      await expect(adminLoginStart({ email: 'admin@example.com' })).rejects.toEqual({
        status: 500,
        body: null
      })
    })
  })

  describe('Request Validation', () => {
    it('should validate JSON.stringify is called with correct payload', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      const payload = { email: 'test@example.com', password: 'password123' }
      await signup(payload)

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    })

    it('should include Content-Type header for all POST requests', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      await loginPost({ email: 'test@example.com', password: 'password123' })

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    })

    it('should include authorization headers for authenticated requests', async () => {
      const mockResponse = { success: true }
      fetchJsonWithFallback.mockResolvedValue(mockResponse)

      await changePasswordAuthenticated({ currentPassword: 'old', newPassword: 'new' })

      expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password-authenticated', {
        method: 'POST',
        headers: { 'x-user-id': 'test-user', 'x-user-email': 'test@example.com', 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    })
  })
})
