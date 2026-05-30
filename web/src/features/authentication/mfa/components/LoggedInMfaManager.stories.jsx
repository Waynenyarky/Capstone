import LoggedInMfaManager from './LoggedInMfaManager.jsx'

export default {
  title: 'Authentication/MFA/LoggedInMfaManager',
  component: LoggedInMfaManager,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {},
}

export const Admin = {
  args: {
    isAdmin: true,
  },
}

export const WithPasskeys = {
  args: {
    hasPasskeys: true,
  },
}

export const WithInlineSetup = {
  args: {
    onOpenSetupForm: () => {},
  },
}
