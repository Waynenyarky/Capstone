import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Form } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, renderHook } from '@/test/utils/renderWithProviders.jsx'
import { ThemeProvider } from '@/shared/theme/ThemeProvider.jsx'
import UserSignUpForm from '@/features/authentication/components/UserSignUpForm.jsx'

const TestWrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/']}>
    <ThemeProvider>
      <AntdApp>{children}</AntdApp>
    </ThemeProvider>
  </MemoryRouter>
)

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

// Mock SignUpVerificationForm to avoid rendering heavy unrelated hooks (useCooldown timers, etc.)
vi.mock('@/features/authentication/components/SignUpVerificationForm.jsx', () => ({
  default: ({ email }) => <div data-testid="verification-form">Verify {email}</div>,
}))

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

// Mock PIS rules to avoid loading heavy validation logic
vi.mock('@/features/authentication/utils/validations/pisRules', () => ({
  pisMaritalStatusRules: [],
  pisDateOfBirthRules: [],
  pisPlaceOfBirthRules: [],
  pisNationalityRules: [],
  pisFatherNameRules: [],
  pisMotherNameRules: [],
  pisEducationRules: [],
  pisStreetRules: [],
  pisBarangayRules: [],
  pisCityRules: [],
  pisProvinceRules: [],
  pisZipCodeRules: [],
  pisSpouseNameRules: [],
}))

// Mock LinkExistingAccountModal to avoid modal/async complexity
vi.mock('@/features/authentication/components/LinkExistingAccountModal.jsx', () => ({
  default: () => null,
}))

describe('Signup Flow', { timeout: 15000 }, () => {
  const user = userEvent.setup()
  let form

  beforeEach(async () => {
    vi.clearAllMocks()
    const { result } = renderHook(() => Form.useForm(), { wrapper: TestWrapper })
    await waitFor(() => {
      expect(result.current?.[0]).toBeTruthy()
    }, { timeout: 5000 })
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

    // Step 1: Click "Next: Personal Information" to go to step 2
    const nextButton = screen.getByRole('button', { name: /next: personal information/i })
    await user.click(nextButton)

    // Step 2: Click "Skip for now" to submit (bypasses PIS validation)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
    })
    const skipButton = screen.getByRole('button', { name: /skip for now/i })
    await user.click(skipButton)

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
