import MfaSetup from './MfaSetup.jsx'
import { http, HttpResponse } from 'msw'

const mockUser = {
  email: 'test@example.com',
  firstName: 'Test',
  role: { slug: 'business_owner' },
  token: 'test-token'
}

export default {
  title: 'Authentication/MFA/MfaSetup',
  component: MfaSetup,
  parameters: {
    layout: 'centered',
    seedAuth: true,
    msw: {
      handlers: [
        http.post('/api/auth/mfa/setup', () => HttpResponse.json({
          secret: 'JBSWY3DPEHPK3PXP',
          otpauthUri: 'otpauth://totp/App:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=App'
        })),
        http.post('/api/auth/mfa/verify', () => HttpResponse.json({ enabled: true })),
        http.get('/api/auth/me', () => HttpResponse.json(mockUser)),
        http.get('/api/auth/profile', () => HttpResponse.json({
          ...mockUser,
          mfaEnabled: false
        })),
      ],
    },
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onComplete: () => {},
  },
}

export const ScanQRStep = {
  args: {
    onComplete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'QR code scanning step - requires clicking "Use authenticator app" first',
      },
    },
  },
}

export const VerifyStep = {
  args: {
    onComplete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Verification code step - requires completing QR scan step first',
      },
    },
  },
}

export const Completed = {
  args: {
    onComplete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Success state after MFA is enabled',
      },
    },
  },
}
