import SignUpMfaSetupStep from './SignUpMfaSetupStep.jsx'

export default {
  title: 'Authentication/Signup/SignUpMfaSetupStep',
  component: SignUpMfaSetupStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onSkip: () => {},
    onComplete: () => {},
  },
}
