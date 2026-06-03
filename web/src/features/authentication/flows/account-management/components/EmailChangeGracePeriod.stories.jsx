import EmailChangeGracePeriod from './EmailChangeGracePeriod.jsx'

export default {
  title: 'Authentication/Account Management/EmailChangeGracePeriod',
  component: EmailChangeGracePeriod,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onReverted: () => {},
  },
  parameters: {
    seedAuth: true,
  }
}

export const WithPendingChange = {
  args: {
    onReverted: () => {},
  },
  parameters: {
    seedAuth: true,
  }
}

export const ExpiredGracePeriod = {
  args: {
    onReverted: () => {},
  },
  parameters: {
    seedAuth: true,
    msw: {
      handlers: {
        wizard: [
          {
            handler: (info) => {
              if (info.request.url.includes('/api/auth/profile/email/change-status')) {
                return new Response(JSON.stringify({
                  pendingChange: true,
                  oldEmail: 'old@example.com',
                  newEmail: 'new@example.com',
                  expiresAt: new Date(Date.now() - 1000).toISOString(),
                  canRevert: false
                }), { headers: { 'Content-Type': 'application/json' } })
              }
              return null
            }
          }
        ]
      }
    }
  }
}
