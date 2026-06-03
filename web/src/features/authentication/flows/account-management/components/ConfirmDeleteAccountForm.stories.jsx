import ConfirmDeleteAccountForm from './ConfirmDeleteAccountForm.jsx'

export default {
  title: 'Authentication/Account Management/ConfirmDeleteAccountForm',
  component: ConfirmDeleteAccountForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Default = {
  args: {
    email: 'user@example.com',
    deleteToken: 'valid-delete-token',
    onSubmit: () => {},
  },
}

export const WithoutToken = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
  },
}
