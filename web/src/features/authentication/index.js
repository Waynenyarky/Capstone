// Authentication public API barrel — prefer importing from here.
// Components
export { default as LoginForm } from './components/LoginForm.jsx'
export { default as LogoutForm } from './components/LogoutForm.jsx'
export { default as CustomerSignUpForm } from './components/CustomerSignUpForm.jsx'
export { default as ProviderSignUpForm } from './components/ProviderSignUpForm.jsx'
export { default as LoginVerificationForm } from './components/LoginVerificationForm.jsx'
export { default as SignUpVerificationForm } from './components/SignUpVerificationForm.jsx'
export { default as ChangePasswordForm } from './components/ChangePasswordForm.jsx'
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm.jsx'
export { default as VerificationForm } from './components/VerificationForm.jsx'
export { default as SendCodeForCurrentUser } from './components/SendCodeForCurrentUser.jsx'
export { default as PasswordResetFlow } from './flows/PasswordResetFlow.jsx'
export { default as ConfirmLogoutModal } from './components/ConfirmLogoutModal.jsx'
export { default as ChangeEmailForm } from './components/ChangeEmailForm.jsx'

// Hooks — re-export from hooks barrel to avoid duplication
export * from './hooks/index.js'

// Lib
export * from './lib/authEvents.js'

// Logged-in account flows & components (consolidated here)
export { default as DeleteAccountFlow } from './flows/DeleteAccountFlow.jsx'
export { default as LoggedInEmailChangeFlow } from './flows/LoggedInEmailChangeFlow.jsx'
export { default as LoggedInPasswordChangeFlow } from './flows/LoggedInPasswordChangeFlow.jsx'
export { default as ConfirmDeleteAccountForm } from './components/ConfirmDeleteAccountForm.jsx'
export { default as DeletionScheduledBanner } from './components/DeletionScheduledBanner.jsx'
export { default as SendDeleteCodeForCurrentUser } from './components/SendDeleteCodeForCurrentUser.jsx'
export { default as VerifyDeleteCodeForm } from './components/VerifyDeleteCodeForm.jsx'