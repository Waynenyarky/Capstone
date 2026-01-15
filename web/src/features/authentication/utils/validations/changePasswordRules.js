
export const passwordRules = [
    { required: true, message: 'Please enter your new password' },
    { min: 12, message: 'Password must be at least 12 characters long' },
    { pattern: /[a-z]/, message: 'Must contain at least one lowercase letter' },
    { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter' },
    { pattern: /\d/, message: 'Must contain at least one number' },
    { pattern: /[^A-Za-z0-9]/, message: 'Must contain at least one special character' },
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