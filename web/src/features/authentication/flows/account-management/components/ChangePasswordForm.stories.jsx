import ChangePasswordForm from './ChangePasswordForm.jsx'

export default {
  title: 'Authentication/Account Management/ChangePasswordForm',
  component: ChangePasswordForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const ResetFlow = {
  args: {
    email: 'user@example.com',
    resetToken: 'valid-reset-token',
    onSubmit: () => {},
  },
}

export const LoggedInFlow = {
  args: {
    email: 'user@example.com',
    isLoggedInFlow: true,
    onSubmit: () => {},
  },
}

export const WithBackButton = {
  args: {
    email: 'user@example.com',
    isLoggedInFlow: true,
    onBack: () => {},
    onSubmit: () => {},
  },
}
