export const forgotPasswordEmailRules = [
  { required: true, message: 'Please enter your email' },
  { type: 'email', message: 'This is not a valid email' },
]