import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Form } from 'antd'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm.jsx'
import { renderWithProviders, screen, renderHook, waitFor } from '@/test/utils/renderWithProviders.jsx'

const mockNavigate = vi.fn()
const mockUseLoginFlow = vi.fn()

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
  }
})

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    const { result } = renderHook(() => Form.useForm())
    const form = result.current[0]
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

    await new Promise((res) => setTimeout(res, 80)) // allow initial form reset

    const emailInput = screen.getByTestId('login-email')
    const passwordInput = screen.getByTestId('login-password')

    await user.click(emailInput)
    await user.type(emailInput, 'user@example.com')
    await user.click(passwordInput)
    await user.type(passwordInput, 'StrongP@ssw0rd')
    await user.click(screen.getByTestId('login-submit'))

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

    await user.click(screen.getByTestId('login-forgot'))

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })
})
