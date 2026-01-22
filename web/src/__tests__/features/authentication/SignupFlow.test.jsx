import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Form } from 'antd'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, renderHook } from '@/test/utils/renderWithProviders.jsx'
import UserSignUpForm from '@/features/authentication/views/components/UserSignUpForm.jsx'

// Mock hooks
const mockUseUserSignUpFlow = vi.fn()
const mockUseUserSignUp = vi.fn()
vi.mock('@/features/authentication/hooks', async () => {
  const actual = await vi.importActual('@/features/authentication/hooks')
  return {
    ...actual,
    useUserSignUpFlow: (...args) => mockUseUserSignUpFlow(...args),
    useUserSignUp: (...args) => mockUseUserSignUp(...args),
  }
})

// Mock validations
vi.mock('@/features/authentication/validations', () => ({
  emailRules: [],
  firstNameRules: [],
  lastNameRules: [],
  phoneNumberRules: [],
  signUpPasswordRules: [],
  signUpConfirmPasswordRules: [],
  termsRules: [],
}))

describe('Signup Flow', () => {
  const user = userEvent.setup()
  let form

  beforeEach(() => {
    vi.clearAllMocks()
    const { result } = renderHook(() => Form.useForm())
    form = result.current[0]

    mockUseUserSignUpFlow.mockReturnValue({
      step: 'form',
      emailForVerify: '',
      devCodeForVerify: '',
      verifyEmail: vi.fn(),
      handleVerificationSubmit: vi.fn(),
    })
    mockUseUserSignUp.mockReturnValue({
      form,
      handleFinish: vi.fn(),
      isSubmitting: false,
      initialValues: {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        termsAccepted: false,
      },
      verificationProps: {},
    })
  })

  it('should render signup form with all inputs', () => {
    renderWithProviders(<UserSignUpForm />)

    expect(screen.getByPlaceholderText('First name')).toBeVisible()
    expect(screen.getByPlaceholderText('Last name')).toBeVisible()
    expect(screen.getByPlaceholderText('Email address')).toBeVisible()
    expect(screen.getByPlaceholderText('Mobile number')).toBeVisible()
  })

  it('should submit form when rules are mocked', async () => {
    const handleFinish = vi.fn()
    mockUseUserSignUpFlow.mockReturnValue({
      step: 'form',
      emailForVerify: '',
      devCodeForVerify: '',
      verifyEmail: vi.fn(),
      handleVerificationSubmit: vi.fn(),
    })
    mockUseUserSignUp.mockReturnValue({
      form,
      handleFinish,
      isSubmitting: false,
    })

    renderWithProviders(<UserSignUpForm />)

    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /continue/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(handleFinish).toHaveBeenCalled()
    })
  })

  it('should show verification step after form submission', () => {
    mockUseUserSignUpFlow.mockReturnValue({
      step: 'verify',
      emailForVerify: 'user@example.com',
      devCodeForVerify: '',
      verifyEmail: vi.fn(),
      handleVerificationSubmit: vi.fn(),
    })
    mockUseUserSignUp.mockReturnValue({
      form,
      handleFinish: vi.fn(),
      isSubmitting: false,
    })

    renderWithProviders(<UserSignUpForm />)

    // Should show verification form
    expect(screen.queryByPlaceholderText('First name')).not.toBeInTheDocument()
  })
})
