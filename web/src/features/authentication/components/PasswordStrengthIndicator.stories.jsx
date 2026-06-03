import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx'

export default {
  title: 'Authentication/PasswordStrengthIndicator',
  component: PasswordStrengthIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const Empty = {
  args: {
    value: '',
    minLength: 12,
  },
}

export const Weak = {
  args: {
    value: 'password',
    minLength: 12,
  },
}

export const Medium = {
  args: {
    value: 'Password123',
    minLength: 12,
  },
}

export const Strong = {
  args: {
    value: 'StrongP@ssw0rd!2024',
    minLength: 12,
  },
}

export const CustomMinLength = {
  args: {
    value: 'Pass123',
    minLength: 8,
  },
}
