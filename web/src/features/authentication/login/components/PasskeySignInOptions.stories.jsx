import PasskeySignInOptions from './PasskeySignInOptions.jsx'

export default {
  title: 'Authentication/Login/PasskeySignInOptions',
  component: PasskeySignInOptions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onAuthenticated: () => {},
    onBeforePasskeyAuth: () => {},
  },
}
