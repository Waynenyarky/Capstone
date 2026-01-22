import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Form } from 'antd'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders, screen, waitFor, renderHook, act } from '@/test/utils/renderWithProviders.jsx'
import LoginForm from '@/features/authentication/views/components/LoginForm.jsx'

// Mock hooks
const mockUseLoginFlow = vi.fn()
const mockGetRememberedEmails = vi.fn(() => [])
const mockGetAllRememberedEmailsWithDetails = vi.fn(() => [])
const mockClearRememberedEmail = vi.fn()
vi.mock('@/features/authentication/hooks', async () => {
  const actual = await vi.importActual('@/features/authentication/hooks')
  return {
    ...actual,
    useLoginFlow: (...args) => mockUseLoginFlow(...args),
    useRememberedEmail: () => ({
      getRememberedEmails: mockGetRememberedEmails,
      getAllRememberedEmailsWithDetails: mockGetAllRememberedEmailsWithDetails,
      clearRememberedEmail: mockClearRememberedEmail,
    }),
  }
})

vi.mock('@/features/authentication/views/components/PasskeySignInOptions.jsx', () => ({
  default: () => null,
}))
vi.mock('../../features/authentication/views/components/PasskeySignInOptions.jsx', () => ({
  default: () => null,
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
  let form

  const getInputByTestId = (testId) => {
    const container = screen.getByTestId(testId)
    if (container?.tagName?.toLowerCase() === 'input') return container
    return container?.querySelector('input')
  }
  const waitForFormReset = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRememberedEmails.mockClear()
    mockGetAllRememberedEmailsWithDetails.mockClear()
    mockClearRememberedEmail.mockClear()
    const { result } = renderHook(() => Form.useForm())
    form = result.current[0]

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

    expect(screen.getByTestId('login-email')).toBeInTheDocument()
    expect(screen.getByTestId('login-password')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
  }, 15000)

  it('should accept user input', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = getInputByTestId('login-email')
    const passwordInput = getInputByTestId('login-password')

    expect(emailInput).toBeTruthy()
    expect(passwordInput).toBeTruthy()
    await waitForFormReset()

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } })

    expect(emailInput).toHaveValue('user@example.com')
    expect(passwordInput).toHaveValue('StrongP@ssw0rd')
  })

  it('should submit form with credentials', async () => {
    const handleFinish = vi.fn()
    mockUseLoginFlow.mockReturnValue({
      step: 'form',
      form,
      handleFinish,
      isSubmitting: false,
      initialValues: { email: '', password: '', rememberMe: false },
      verificationProps: {},
      serverLockedUntil: null,
      mfaRequired: null,
    })

    renderWithProviders(<LoginForm />)

    await waitForFormReset()
    await act(async () => {
      form.setFieldsValue({
        email: 'user@example.com',
        password: 'StrongP@ssw0rd',
        rememberMe: false,
      })
      await form.submit()
    })

    await waitFor(() => {
      expect(handleFinish).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'StrongP@ssw0rd',
        rememberMe: false,
      })
    })
  })

  it('should show verification step when required', () => {
    mockUseLoginFlow.mockReturnValue({
      step: 'verify',
      form,
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
    fireEvent.click(forgotLink)

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })
})
