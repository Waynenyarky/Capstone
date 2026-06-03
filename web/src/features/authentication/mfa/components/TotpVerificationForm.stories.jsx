import TotpVerificationForm from './TotpVerificationForm.jsx'

export default {
  title: 'Authentication/MFA/TotpVerificationForm',
  component: TotpVerificationForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    title: 'MFA Verification',
  },
}

export const CustomTitle = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    title: 'Verify Your Identity',
  },
}
