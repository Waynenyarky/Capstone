import PlatformPasskeyAuth from './PlatformPasskeyAuth.jsx'

export default {
  title: 'Authentication/Login/PlatformPasskeyAuth',
  component: PlatformPasskeyAuth,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onAuthenticated: () => {},
    onCancel: () => {},
  },
}
