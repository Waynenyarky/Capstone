// Strength/requirements feedback is shown by PasswordStrengthIndicator only (no duplicate validation text)
export const passwordRules = [
  { required: true, message: 'Please enter your new password' },
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