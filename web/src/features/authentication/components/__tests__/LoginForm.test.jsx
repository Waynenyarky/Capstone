import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Form } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { fireEvent } from '@testing-library/react'
import LoginForm from '../LoginForm.jsx'
import { renderWithProviders, screen, renderHook, waitFor, act } from '@/test/utils/renderWithProviders.jsx'
import { ThemeProvider } from '@/shared/theme/ThemeProvider.jsx'

const TestWrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/']}>
    <ThemeProvider>
      <AntdApp>{children}</AntdApp>
    </ThemeProvider>
  </MemoryRouter>
)

const mockNavigate = vi.fn()
const mockUseLoginFlow = vi.fn()
const mockGetRememberedEmails = vi.fn(() => [])
const mockGetAllRememberedEmailsWithDetails = vi.fn(() => [])
const mockClearRememberedEmail = vi.fn()

vi.mock('@/features/authentication/validations', () => ({
  loginEmailRules: [],
  loginPasswordRules: [],
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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
    useAuthSession: () => ({
      currentUser: null,
      role: null,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  }
})

vi.mock('@/features/authentication/hooks/useWebAuthn.js', () => ({
  default: () => ({
    authenticateConditional: vi.fn(),
    registerPasskey: vi.fn(),
    authenticatePasskey: vi.fn(),
  }),
}))

vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('@/features/authentication/components/PasskeySignInOptions.jsx', () => ({
  default: () => null,
}))
vi.mock('../PasskeySignInOptions.jsx', () => ({
  default: () => null,
}))

describe('LoginForm', () => {
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

  let form

  beforeEach(async () => {
    mockGetRememberedEmails.mockClear()
    mockGetAllRememberedEmailsWithDetails.mockClear()
    mockClearRememberedEmail.mockClear()
    const { result } = renderHook(() => Form.useForm(), {
      wrapper: TestWrapper,
    })
    await waitFor(() => {
      expect(result.current).toBeTruthy()
      expect(result.current?.[0]).toBeTruthy()
    }, { timeout: 5000 })
    form = result.current[0]
    mockUseLoginFlow.mockReturnValue({
      step: 'form',
      form,
      handleFinish: vi.fn(),
      isSubmitting: false,
      initialValues: { email: '', password: '', rememberMe: false },
      prefillAdmin: vi.fn(),
      prefillAdmin2: vi.fn(),
      prefillAdmin3: vi.fn(),
      prefillUser: vi.fn(),
      prefillLguOfficer: vi.fn(),
      prefillLguManager: vi.fn(),
      prefillInspector: vi.fn(),
      prefillCso: vi.fn(),
      verificationProps: {},
      serverLockedUntil: null,
      mfaRequired: null,
    })
    mockNavigate.mockReset()
  })

  it('renders inputs and submits credentials', async () => {
    const utils = renderWithProviders(<LoginForm />)

    await waitFor(() => {
      expect(getInputByTestId('login-email')).toBeTruthy()
      expect(getInputByTestId('login-password')).toBeTruthy()
    })
    await waitForFormReset()

    const emailInput = getInputByTestId('login-email')
    const passwordInput = getInputByTestId('login-password')

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } })
    fireEvent.click(screen.getByTestId('login-submit'))

    const { handleFinish } = mockUseLoginFlow.mock.results[0].value
    await waitFor(() => {
      expect(handleFinish).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'StrongP@ssw0rd',
        rememberMe: false,
      })
    })

    // Cleanup explicitly to avoid lingering timers
    utils.unmount()
  }, 10000)

  it('navigates to forgot password on link click', async () => {
    renderWithProviders(<LoginForm />)

    fireEvent.click(screen.getByTestId('login-forgot'))

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })
})
