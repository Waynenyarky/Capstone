import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@/test/utils/renderWithProviders.jsx'
import { useLoggedInEmailChangeFlow } from '@/features/authentication/hooks/useLoggedInEmailChangeFlow.js'
import { useChangeEmailForm } from '@/features/authentication/hooks/useChangeEmailForm.js'
import { useVerifyChangeEmailForm } from '@/features/authentication/hooks/useVerifyChangeEmailForm.js'
import { changeEmailStart, changeEmailVerify, getProfile } from '@/features/authentication/services'

// Mock services
vi.mock('@/features/authentication/services', () => ({
  changeEmailStart: vi.fn(),
  changeEmailVerify: vi.fn(),
  getProfile: vi.fn(),
}))

// Mock auth session
vi.mock('@/features/authentication/hooks', async () => {
  const actual = await vi.importActual('@/features/authentication/hooks')
  return {
    ...actual,
    useAuthSession: () => ({
      currentUser: { id: '123', email: 'old@example.com', token: 'mock-token' },
      login: vi.fn(),
    }),
  }
})

// Mock notifications
vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('Email Change Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    changeEmailStart.mockResolvedValue({ success: true })
    changeEmailVerify.mockResolvedValue({ success: true })
    getProfile.mockResolvedValue({
      id: '123',
      email: 'new@example.com',
    })
  })

  describe('useLoggedInEmailChangeFlow', () => {
    it('should initialize with send step', () => {
      const { result } = renderHook(() => useLoggedInEmailChangeFlow())

      expect(result.current.step).toBe('send')
      expect(result.current.email).toBe('old@example.com')
    })

    it('should progress through flow steps', () => {
      const { result } = renderHook(() => useLoggedInEmailChangeFlow())

      // Start flow
      act(() => {
        result.current.sendProps.onSent()
      })
      expect(result.current.step).toBe('verify')

      // Verify step
      act(() => {
        result.current.verifyProps.onSubmit({
          email: 'old@example.com',
          resetToken: 'token123',
        })
      })
      expect(result.current.step).toBe('change')

      // Change step
      act(() => {
        result.current.changeProps.onSubmit({
          newEmail: 'new@example.com',
        })
      })
      expect(result.current.step).toBe('verifyNew')

      // Verify new email
      act(() => {
        result.current.verifyNewProps.onSubmit()
      })
      expect(result.current.step).toBe('done')
    })
  })

  describe('useChangeEmailForm', () => {
    it('should submit email change request', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useChangeEmailForm({
          onSubmit,
          email: 'old@example.com',
        })
      )

      await act(async () => {
        await result.current.handleFinish({
          newEmail: 'new@example.com',
        })
      })

      await waitFor(() => {
        expect(changeEmailStart).toHaveBeenCalledWith({
          newEmail: 'new@example.com',
          currentEmail: 'old@example.com',
        })
      })

      expect(onSubmit).toHaveBeenCalledWith({ newEmail: 'new@example.com' })
    })

    it('should handle errors', async () => {
      changeEmailStart.mockRejectedValueOnce({
        error: { code: 'email_exists', message: 'Email already exists' },
      })

      const { result } = renderHook(() =>
        useChangeEmailForm({
          email: 'old@example.com',
        })
      )

      await act(async () => {
        await result.current.handleFinish({
          newEmail: 'existing@example.com',
        })
      })

      await waitFor(() => {
        expect(changeEmailStart).toHaveBeenCalled()
      })
    })
  })

  describe('useVerifyChangeEmailForm', () => {
    it('should verify email change code', async () => {
      const onSubmit = vi.fn()
      const { result } = renderHook(() =>
        useVerifyChangeEmailForm({
          onSubmit,
          email: 'new@example.com',
          currentEmail: 'old@example.com',
        })
      )

      await act(async () => {
        await result.current.handleFinish({
          verificationCode: '123456',
        })
      })

      await waitFor(() => {
        expect(changeEmailVerify).toHaveBeenCalledWith({
          currentEmail: 'old@example.com',
          email: 'new@example.com',
          code: '123456',
        })
      })

      expect(getProfile).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})
