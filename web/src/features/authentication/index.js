// Authentication public API barrel — prefer importing from here.
// Components
export { default as LoginForm } from './components/LoginForm.jsx'
export { default as LogoutForm } from './components/LogoutForm.jsx'
export { default as UserSignUpForm } from './components/UserSignUpForm.jsx'
export { default as LoginVerificationForm } from './components/LoginVerificationForm.jsx'
export { default as SignUpVerificationForm } from './components/SignUpVerificationForm.jsx'
export { default as ChangePasswordForm } from './components/ChangePasswordForm.jsx'
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm.jsx'
export { default as VerificationForm } from './components/VerificationForm.jsx'
export { default as SendCodeForCurrentUser } from './components/SendCodeForCurrentUser.jsx'
export { default as PasswordResetFlow } from './flows/PasswordResetFlow.jsx'
export { default as ConfirmLogoutModal } from './components/ConfirmLogoutModal.jsx'
export { default as ChangeEmailForm } from './components/ChangeEmailForm.jsx'
export { default as RequireAdmin } from './components/RequireAdmin.jsx'
export { default as AdminLoginForm } from './components/AdminLoginForm.jsx'
export { default as WebAuthnRegister } from './components/WebAuthnRegister.jsx'
export { default as WebAuthnAuthenticate } from './components/WebAuthnAuthenticate.jsx'
export { default as SendCodeForCurrentUserConfirm } from './components/SendCodeForCurrentUserConfirm.jsx'
export { default as VerificationConfirmForm } from './components/VerificationConfirmForm.jsx'
export { default as VerificationNewEmailForm } from './components/VerificationNewEmailForm.jsx'

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
