// Authentication public API barrel — prefer importing from here.
// Components
export { default as LoginForm } from './login/LoginForm.jsx'
export { default as LogoutForm } from './components/LogoutForm.jsx'
export { default as UserSignUpForm } from './signup/UserSignUpForm.jsx'
export { default as TotpVerificationForm } from './mfa/components/TotpVerificationForm.jsx'
export { default as SignUpMfaSetupStep } from './signup/components/SignUpMfaSetupStep.jsx'
export { default as ChangePasswordForm } from './flows/account-management/components/ChangePasswordForm.jsx'
export { default as ForgotPasswordForm } from './flows/password-reset/components/ForgotPasswordForm.jsx'
export { default as VerificationForm } from './components/VerificationForm.jsx'
export { default as PasswordResetFlow } from './flows/password-reset/PasswordResetFlow.jsx'
export { default as ConfirmLogoutModal } from './components/ConfirmLogoutModal.jsx'
export { default as ProtectedRoute } from './components/ProtectedRoute.jsx'
export { default as PublicRoute } from './components/PublicRoute.jsx'
export { default as ChangeEmailForm } from './flows/account-management/components/ChangeEmailForm.jsx'
export { default as WebAuthnRegister } from './passkey/components/WebAuthnRegister.jsx'
export { default as SendCodeForCurrentUserConfirm } from './flows/account-management/components/SendCodeForCurrentUserConfirm.jsx'
export { default as AuthLayout } from './components/AuthLayout.jsx'
export { default as AppSidebar } from './components/AppSidebar.jsx'

// Hooks — re-export from hooks barrel to avoid duplication
export * from './hooks/index.js'

// Services
export * from './services/index.js'

// Validations
export * from './utils/validations/index.js'

// Lib
export * from './lib/authEvents.js'

// Logged-in account flows & components (consolidated here)
export { default as DeleteAccountFlow } from './flows/account-management/components/DeleteAccountFlow.jsx'
export { default as LoggedInEmailChangeFlow } from './flows/account-management/components/LoggedInEmailChangeFlow.jsx'
export { default as LoggedInPasswordChangeFlow } from './flows/account-management/components/LoggedInPasswordChangeFlow.jsx'
export { default as ConfirmDeleteAccountForm } from './flows/account-management/components/ConfirmDeleteAccountForm.jsx'
export { default as DeletionScheduledBanner } from './flows/account-management/components/DeletionScheduledBanner.jsx'
export { default as DeletionPendingScreen } from './flows/account-management/components/DeletionPendingScreen.jsx'
export { default as EmailChangeGracePeriod } from './flows/account-management/components/EmailChangeGracePeriod.jsx'
export { default as MfaReenrollmentAlert } from './flows/account-management/components/MfaReenrollmentAlert.jsx'

// Pages
export { default as Login } from './pages/Login.jsx'
export { default as SignUp } from './pages/SignUp.jsx'
export { default as SignUpMfaSetup } from './pages/SignUpMfaSetup.jsx'
export { default as ForgotPassword } from './pages/ForgotPassword.jsx'
