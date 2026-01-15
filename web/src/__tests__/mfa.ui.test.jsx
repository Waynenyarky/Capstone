import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders.jsx'

// Mock hooks and services used by MFA components
vi.mock('@/features/authentication/hooks', () => ({
  useAuthSession: () => ({ currentUser: { email: 'jane@example.com', role: 'user' } }),
  useLoginVerificationForm: () => ({ form: undefined, handleFinish: () => {}, isSubmitting: false, prefillDevCode: () => {} }),
  useTotpVerificationForm: () => ({ form: undefined, handleFinish: () => {}, isSubmitting: false }),
  useResendLoginCode: () => ({ isSending: false, handleResend: () => {}, isCooling: false, remaining: 0 }),
  useMfaSetup: () => ({ loading: false, qrDataUrl: null, uri: null, secret: 'S3CR3T', code: '', setCode: () => {}, enabled: false, handleSetup: () => {}, handleVerify: () => {}, handleDisable: () => {} }),
  useLoggedInMfaManager: () => ({
    currentUser: { email: 'jane@example.com', role: 'user' },
    status: 'disabled',
    isLoading: false,
    qrDataUrl: null,
    uri: null,
    secret: 'S3CR3T',
    code: '',
    setCode: () => {},
    handleSetup: () => {},
    handleVerify: () => {},
    handleDisable: () => {},
    handleEnable: () => {},
    confirmDisable: () => {},
    confirmUndo: () => {},
  }),
}))

vi.mock('@/features/authentication/services/mfaService', () => ({
  mfaSetup: async () => ({ secret: 'S3CR3T', otpauthUri: 'otpauth://totp/App:email?secret=S3CR3T' }),
  mfaStatus: async () => ({ enabled: false }),
  mfaVerify: async () => ({ enabled: true }),
  mfaDisable: async () => ({ disabled: true }),
}))

// Mock notification hook used by components
vi.mock('@/shared/notifications', () => ({
  useNotifier: () => ({ success: () => {}, info: () => {}, error: () => {}, warning: () => {} }),
}))

// Mock QrDisplay to keep snapshots simple
vi.mock('@/features/authentication/views/components/QrDisplay.jsx', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'qr', children: 'QR' })
}))

import MfaSetup from '@/features/authentication/views/components/MfaSetup.jsx'
import LoginVerificationForm from '@/features/authentication/views/components/LoginVerificationForm.jsx'
import TotpVerificationForm from '@/features/authentication/views/components/TotpVerificationForm.jsx'
import LoggedInMfaManager from '@/features/authentication/views/components/LoggedInMfaManager.jsx'

describe('MFA UI snapshots', () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia; Ant Design uses it for responsive observer
    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })
    }
  })

  it('renders MfaSetup initial view', () => {
    const { getByText } = renderWithProviders(<MfaSetup />)
    expect(getByText(/Security Setup/i)).toBeInTheDocument()
    expect(getByText(/Protect your account with Two-Factor Authentication/i)).toBeInTheDocument()
  })

  it('renders LoginVerificationForm with resend button', () => {
    const { getByText, getByRole } = renderWithProviders(<LoginVerificationForm email="jane@example.com" devCode="123456" />)
    expect(getByText(/Verify Login/i)).toBeInTheDocument()
    expect(getByRole('button', { name: /Resend code/i })).toBeInTheDocument()
  })

  it('renders TotpVerificationForm', () => {
    const { getByText, getAllByRole } = renderWithProviders(<TotpVerificationForm email="jane@example.com" />)
    expect(getByText(/MFA Verification/i)).toBeInTheDocument()
    // OTP inputs should exist (6 fields)
    expect(getAllByRole('textbox').length).toBeGreaterThanOrEqual(1)
  })

  it('renders LoggedInMfaManager for user', () => {
    const { getByText } = renderWithProviders(<LoggedInMfaManager />)
    expect(getByText(/Two-factor Authentication/i)).toBeInTheDocument()
    expect(getByText(/is not enabled/i)).toBeInTheDocument()
  })
})
