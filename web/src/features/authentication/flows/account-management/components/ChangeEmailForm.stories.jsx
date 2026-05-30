import ChangeEmailForm from './ChangeEmailForm.jsx'

export default {
  title: 'Authentication/Account Management/ChangeEmailForm',
  component: ChangeEmailForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    currentEmail: 'oldemail@example.com',
    resetToken: 'valid-reset-token',
    onSubmit: () => {},
  },
}

export const WithoutResetToken = {
  args: {
    currentEmail: 'oldemail@example.com',
    onSubmit: () => {},
  },
}

export const WithBackButton = {
  args: {
    currentEmail: 'oldemail@example.com',
    resetToken: 'valid-reset-token',
    onSubmit: () => {},
    onBack: () => {},
  },
}

export const CustomWidth = {
  args: {
    currentEmail: 'oldemail@example.com',
    resetToken: 'valid-reset-token',
    onSubmit: () => {},
    maxWidth: 400,
  },
}
