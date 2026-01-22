import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@/test/utils/renderWithProviders.jsx'
import { useEditUserProfileForm } from '@/features/user/hooks/useEditUserProfileForm.jsx'
import { getUserProfile, updateUserProfile } from '@/features/user/services/userService.js'

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        modal: {
          confirm: ({ onOk }) => onOk?.(),
        },
        message: {
          success: vi.fn(),
          error: vi.fn(),
        },
      }),
    },
  }
})

// Mock services
vi.mock('@/features/user/services/userService.js', () => ({
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}))

// Mock auth session
vi.mock('@/features/authentication', () => ({
  useAuthSession: () => ({
    currentUser: { id: '123', email: 'test@example.com' },
    role: { slug: 'business_owner' },
    login: vi.fn(),
  }),
}))

// Mock notifications
vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('EditProfileForm Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserProfile.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '1234567890',
    })
    updateUserProfile.mockResolvedValue({
      user: {
        id: '123',
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '9876543210',
      },
    })
  })

  it('should load profile data on mount', async () => {
    const { result } = renderHook(() => useEditUserProfileForm())

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should handle form submission', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useEditUserProfileForm({ onSubmit }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Set form values
    result.current.form.setFieldsValue({
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: '9876543210',
    })

    // Submit form
    await act(async () => {
      await result.current.handleFinish({
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '9876543210',
      })
    })

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalled()
    })
  })

  it('should handle form validation errors', async () => {
    updateUserProfile.mockRejectedValueOnce({
      error: { code: 'validation_error', message: 'Invalid phone number' },
    })

    const { result } = renderHook(() => useEditUserProfileForm())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.handleFinish({
        firstName: 'Test',
        phoneNumber: 'invalid',
      })
    })

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalled()
    })
  })

  it('should track dirty state', async () => {
    const { result } = renderHook(() => useEditUserProfileForm())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isDirty).toBe(false)

    // Change form values
    result.current.form.setFieldsValue({
      firstName: 'Changed',
    })

    // Trigger values change
    act(() => {
      result.current.handleValuesChange({}, {
        firstName: 'Changed',
        lastName: 'User',
        phoneNumber: '1234567890',
      })
    })

    await waitFor(() => {
      expect(result.current.isDirty).toBe(true)
    })
  })
})
