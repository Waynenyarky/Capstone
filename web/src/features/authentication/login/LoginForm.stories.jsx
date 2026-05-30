import LoginForm from './LoginForm.jsx'

export default {
  title: 'Authentication/Login/LoginForm',
  component: LoginForm,
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
