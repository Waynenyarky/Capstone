import AdminStepUpModal from './AdminStepUpModal.jsx'
import { http, HttpResponse } from 'msw'

export default {
  title: 'Admin/AdminStepUpModal',
  component: AdminStepUpModal,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.post('/api/admin/step-up/totp', () => HttpResponse.json({
          stepUpToken: 'mock-step-up-token-123'
        })),
        http.post('/api/admin/step-up/passkey', () => HttpResponse.json({
          stepUpToken: 'mock-step-up-token-456'
        })),
      ],
    },
  },
  tags: ['autodocs'],
}

export const TotpMethod = {
  args: {
    open: true,
    onCancel: () => {},
    onVerified: (token) => console.log('Verified:', token),
    mfaMethod: 'authenticator',
  },
}

export const PasskeyMethod = {
  args: {
    open: true,
    onCancel: () => {},
    onVerified: (token) => console.log('Verified:', token),
    mfaMethod: 'passkey',
  },
}

export const Closed = {
  args: {
    open: false,
    onCancel: () => {},
    onVerified: (token) => console.log('Verified:', token),
    mfaMethod: 'authenticator',
  },
}
