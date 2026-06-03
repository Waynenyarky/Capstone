import ForgotPasswordForm from './ForgotPasswordForm.jsx'

export default {
  title: 'Authentication/Password Reset/ForgotPasswordForm',
  component: ForgotPasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    onSubmit: () => {},
  },
}
