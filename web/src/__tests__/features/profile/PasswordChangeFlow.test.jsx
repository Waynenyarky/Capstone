import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@/test/utils/renderWithProviders.jsx'
import { useLoggedInPasswordChangeFlow } from '@/features/authentication/hooks/useLoggedInPasswordChangeFlow.js'
import { useChangePasswordForm } from '@/features/authentication/hooks/useChangePasswordForm.js'
import { changePasswordStart, changePasswordVerify } from '@/features/authentication/services'

// Mock services
vi.mock('@/features/authentication/services', () => ({
  changePasswordStart: vi.fn(),
  changePasswordVerify: vi.fn(),
  changePassword: vi.fn(),
  changePasswordAuthenticated: vi.fn(),
}))

// Mock notifications
vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
  useAuthNotification: () => ({
    notificationSuccess: vi.fn(),
    notificationError: vi.fn(),
  }),
}))

// Mock auth
vi.mock('@/features/authentication/lib/authEvents.js', async () => {
  const actual = await vi.importActual('@/features/authentication/lib/authEvents.js')
  return {
    ...actual,
    getCurrentUser: () => ({ id: '123', email: 'test@example.com' }),
    setCurrentUser: vi.fn(),
  }
})

vi.mock('@/features/authentication/hooks', async () => {
  const actual = await vi.importActual('@/features/authentication/hooks')
  return {
    ...actual,
    useAuthSession: () => ({
      currentUser: { id: '123', email: 'test@example.com' },
      role: { slug: 'user' },
      login: vi.fn(),
      logout: vi.fn(),
    }),
  }
})

describe('Password Change Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    changePasswordStart.mockResolvedValue({ success: true })
    changePasswordVerify.mockResolvedValue({ token: 'new-token', email: 'test@example.com' })
  })

  describe('useLoggedInPasswordChangeFlow', () => {
    it('should initialize with password step', () => {
      const { result } = renderHook(() => useLoggedInPasswordChangeFlow())

      expect(result.current.step).toBe('password')
      expect(result.current.email).toBe('test@example.com')
    })

    it('should progress through flow steps with single verification', async () => {
      const { result } = renderHook(() => useLoggedInPasswordChangeFlow())

      // Step 1: Submit new password (sends OTP)
      await act(async () => {
        await result.current.changeProps.onSubmit({
          password: 'NewPassword123!@#',
          confirmPassword: 'NewPassword123!@#',
        })
      })
      await waitFor(() => {
        expect(result.current.step).toBe('verify')
      })
      expect(changePasswordStart).toHaveBeenCalledWith({ newPassword: 'NewPassword123!@#' })

      // Step 2: Submit verification code (changes password)
      await act(async () => {
        await result.current.verifyProps.onSubmit('123456')
      })
      await waitFor(() => {
        expect(result.current.step).toBe('done')
      })
      expect(changePasswordVerify).toHaveBeenCalledWith({ code: '123456' })
    })
  })

  describe('useChangePasswordForm', () => {
    it('should handle password change for logged in user', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useChangePasswordForm({
          onSubmit,
          isLoggedInFlow: true,
        })
      )

      // Step 1: Enter password
      await act(async () => {
        await result.current.handleFinish({
          password: 'NewPassword123!@#',
          confirmPassword: 'NewPassword123!@#',
        })
      })

      await waitFor(() => {
        expect(changePasswordStart).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(result.current.step).toBe('verify')
      })

      // Step 2: Verify code
      await act(async () => {
        await result.current.handleFinish({
          verificationCode: '123456',
          password: 'NewPassword123!@#',
          confirmPassword: 'NewPassword123!@#',
        })
      })

      await waitFor(() => {
        expect(changePasswordVerify).toHaveBeenCalled()
      })
    })

    it('should validate password match', async () => {
      const { result } = renderHook(() =>
        useChangePasswordForm({
          isLoggedInFlow: true,
        })
      )

      await act(async () => {
        await result.current.handleFinish({
          password: 'NewPassword123!@#',
          confirmPassword: 'DifferentPassword123!@#',
        })
      })

      // Should not proceed if passwords don't match
      expect(changePasswordStart).not.toHaveBeenCalled()
    })
  })
})
