import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/utils/renderWithProviders.jsx'
import LoginForm from '@/features/authentication/views/components/LoginForm.jsx'
import { useLoginFlow } from '@/features/authentication/hooks/useLoginFlow.js'

// Mock hooks
const mockUseLoginFlow = vi.fn()
vi.mock('@/features/authentication/hooks', () => ({
  useLoginFlow: (...args) => mockUseLoginFlow(...args),
}))

// Mock validations
vi.mock('@/features/authentication/validations', () => ({
  loginEmailRules: [],
  loginPasswordRules: [],
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    const { result } = require('@testing-library/react').renderHook(() =>
      require('antd').Form.useForm()
    )
    const form = result.current[0]

    mockUseLoginFlow.mockReturnValue({
      step: 'form',
      form,
      handleFinish: vi.fn(),
      isSubmitting: false,
      initialValues: { email: '', password: '', rememberMe: false },
      verificationProps: {},
      serverLockedUntil: null,
      mfaRequired: null,
    })
  })

  it('should render login form with inputs', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByTestId('login-email')).toBeVisible()
    expect(screen.getByTestId('login-password')).toBeVisible()
    expect(screen.getByTestId('login-submit')).toBeVisible()
  })

  it('should accept user input', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByTestId('login-email')
    const passwordInput = screen.getByTestId('login-password')

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd')

    expect(emailInput).toHaveValue('user@example.com')
    expect(passwordInput).toHaveValue('StrongP@ssw0rd')
  })

  it('should submit form with credentials', async () => {
    const handleFinish = vi.fn()
    mockUseLoginFlow.mockReturnValue({
      step: 'form',
      form: require('antd').Form.useForm()[0],
      handleFinish,
      isSubmitting: false,
      initialValues: { email: '', password: '', rememberMe: false },
      verificationProps: {},
      serverLockedUntil: null,
      mfaRequired: null,
    })

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByTestId('login-email')
    const passwordInput = screen.getByTestId('login-password')
    const submitButton = screen.getByTestId('login-submit')

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd')
    await user.click(submitButton)

    await waitFor(() => {
      expect(handleFinish).toHaveBeenCalled()
    })
  })

  it('should show verification step when required', () => {
    mockUseLoginFlow.mockReturnValue({
      step: 'verify',
      form: require('antd').Form.useForm()[0],
      handleFinish: vi.fn(),
      isSubmitting: false,
      verificationProps: {
        email: 'user@example.com',
        method: 'otp',
      },
    })

    renderWithProviders(<LoginForm />)

    // Should show verification form
    expect(screen.queryByTestId('login-email')).not.toBeInTheDocument()
  })

  it('should navigate to forgot password', async () => {
    renderWithProviders(<LoginForm />)

    const forgotLink = screen.getByTestId('login-forgot')
    await user.click(forgotLink)

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })
})
