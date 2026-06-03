// Authentication components barrel — prefer importing components from here
export { default as LoginForm } from '../login/LoginForm.jsx'
export { default as LogoutForm } from './LogoutForm.jsx'
export { default as UserSignUpForm } from '../signup/UserSignUpForm.jsx'
export { default as VerificationForm } from './VerificationForm.jsx'
export { default as ConfirmLogoutModal } from './ConfirmLogoutModal.jsx'
export { default as AuthLayout } from './AuthLayout.jsx'
export { default as PasswordStrengthIndicator } from './PasswordStrengthIndicator.jsx'

// Re-export from feature directories for backward compatibility
export * from '../flows/password-reset/components/index.js'
export * from '../mfa/components/index.js'
export * from '../passkey/components/index.js'
