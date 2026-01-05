import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'

// Mock hooks and services used by MFA components
vi.mock('@/features/authentication/hooks', () => ({
  useAuthSession: () => ({ currentUser: { email: 'jane@example.com', role: 'user' } }),
  useLoginVerificationForm: () => ({ form: undefined, handleFinish: () => {}, isSubmitting: false, prefillDevCode: () => {} }),
  useTotpVerificationForm: () => ({ form: undefined, handleFinish: () => {}, isSubmitting: false }),
  useResendLoginCode: () => ({ isSending: false, handleResend: () => {}, isCooling: false, remaining: 0 }),
  useMfaSetup: () => ({ loading: false, qrDataUrl: null, uri: null, secret: 'S3CR3T', code: '', setCode: () => {}, enabled: false, handleSetup: () => {}, handleVerify: () => {}, handleDisable: () => {} }),
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
vi.mock('@/features/authentication/components/QrDisplay.jsx', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'qr', children: 'QR' })
}))

import MfaSetup from '@/features/authentication/components/MfaSetup.jsx'
import LoginVerificationForm from '@/features/authentication/components/LoginVerificationForm.jsx'
import TotpVerificationForm from '@/features/authentication/components/TotpVerificationForm.jsx'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'

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
  function renderToSnapshot(element) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let root
    // Wrap in MemoryRouter so components using navigation/hooks render in tests
    const wrapped = React.createElement(MemoryRouter, null, element)
    act(() => {
      root = createRoot(container)
      root.render(wrapped)
    })
    const html = container.innerHTML
    // cleanup
    if (root) {
      act(() => root.unmount())
    }
    container.remove()
    return html
  }

  it('renders MfaSetup initial view', () => {
    const html = renderToSnapshot(React.createElement(MfaSetup))
    expect(html).toMatchSnapshot()
  })

  it('renders LoginVerificationForm with resend button', () => {
    const html = renderToSnapshot(React.createElement(LoginVerificationForm, { email: 'jane@example.com', devCode: '123456' }))
    expect(html).toMatchSnapshot()
  })

  it('renders TotpVerificationForm', () => {
    const html = renderToSnapshot(React.createElement(TotpVerificationForm, { email: 'jane@example.com' }))
    expect(html).toMatchSnapshot()
  })

  it('renders LoggedInMfaManager for user', () => {
    const html = renderToSnapshot(React.createElement(LoggedInMfaManager))
    expect(html).toMatchSnapshot()
  })
})
