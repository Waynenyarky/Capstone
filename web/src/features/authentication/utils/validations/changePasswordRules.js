export const passwordRules = [
  { required: true, message: 'Please enter your new password' },
  () => ({
    validator(_, value) {
      if (!value) return Promise.resolve()
      if (value.length < 8) return Promise.reject(new Error('Password must be at least 8 characters'))
      if (!/[a-z]/.test(value)) return Promise.reject(new Error('Password must contain a lowercase letter'))
      if (!/[A-Z]/.test(value)) return Promise.reject(new Error('Password must contain an uppercase letter'))
      if (!/\d/.test(value)) return Promise.reject(new Error('Password must contain a number'))
      if (!/[^A-Za-z0-9]/.test(value)) return Promise.reject(new Error('Password must contain a special character'))
      return Promise.resolve()
    },
  }),
]


export const confirmPasswordRules = [
    { required: true, message: 'Please confirm your password' },
    ({ getFieldValue }) => ({
        validator(_, value) {
            if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
            }
            return Promise.reject(new Error('Passwords do not match'))
        },
    }),
]

export const confirmPasswordRulesForNewPassword = [
    { required: true, message: 'Please confirm your password' },
    ({ getFieldValue }) => ({
        validator(_, value) {
            if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve()
            }
            return Promise.reject(new Error('Passwords do not match'))
        },
    }),
]