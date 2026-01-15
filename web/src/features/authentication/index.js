// Authentication public API barrel — prefer importing from here.
// Components
export { default as LoginForm } from './views/components/LoginForm.jsx'
export { default as LogoutForm } from './views/components/LogoutForm.jsx'
export { default as UserSignUpForm } from './views/components/UserSignUpForm.jsx'
export { default as LoginVerificationForm } from './views/components/LoginVerificationForm.jsx'
export { default as TotpVerificationForm } from './views/components/TotpVerificationForm.jsx'
export { default as SignUpVerificationForm } from './views/components/SignUpVerificationForm.jsx'
export { default as ChangePasswordForm } from './views/components/ChangePasswordForm.jsx'
export { default as ForgotPasswordForm } from './views/components/ForgotPasswordForm.jsx'
export { default as VerificationForm } from './views/components/VerificationForm.jsx'
export { default as SendCodeForCurrentUser } from './views/components/SendCodeForCurrentUser.jsx'
export { default as PasswordResetFlow } from './views/flows/PasswordResetFlow.jsx'
export { default as ConfirmLogoutModal } from './views/components/ConfirmLogoutModal.jsx'
export { default as ProtectedRoute } from './views/components/ProtectedRoute.jsx'
export { default as PublicRoute } from './views/components/PublicRoute.jsx'
export { default as ChangeEmailForm } from './views/components/ChangeEmailForm.jsx'
export { default as WebAuthnRegister } from './views/components/WebAuthnRegister.jsx'
export { default as WebAuthnAuthenticate } from './views/components/WebAuthnAuthenticate.jsx'
export { default as SendCodeForCurrentUserConfirm } from './views/components/SendCodeForCurrentUserConfirm.jsx'
export { default as VerificationConfirmForm } from './views/components/VerificationConfirmForm.jsx'
export { default as VerificationNewEmailForm } from './views/components/VerificationNewEmailForm.jsx'
export { default as AuthLayout } from './views/components/AuthLayout.jsx'
export { default as AppSidebar } from './views/components/AppSidebar.jsx'

// Hooks — re-export from hooks barrel to avoid duplication
export * from './hooks/index.js'

// Services
export * from './services/index.js'

// Validations
export * from './utils/validations/index.js'

// Lib
export * from './lib/authEvents.js'

// Logged-in account flows & components (consolidated here)
export { default as DeleteAccountFlow } from './views/flows/DeleteAccountFlow.jsx'
export { default as LoggedInEmailChangeFlow } from './views/flows/LoggedInEmailChangeFlow.jsx'
export { default as LoggedInPasswordChangeFlow } from './views/flows/LoggedInPasswordChangeFlow.jsx'
export { default as ConfirmDeleteAccountForm } from './views/components/ConfirmDeleteAccountForm.jsx'
export { default as DeletionScheduledBanner } from './views/components/DeletionScheduledBanner.jsx'
export { default as DeletionPendingScreen } from './views/components/DeletionPendingScreen.jsx'
export { default as SendDeleteCodeForCurrentUser } from './views/components/SendDeleteCodeForCurrentUser.jsx'
export { default as VerifyDeleteCodeForm } from './views/components/VerifyDeleteCodeForm.jsx'
export { default as EmailChangeGracePeriod } from './views/components/EmailChangeGracePeriod.jsx'
export { default as MfaReenrollmentAlert } from './views/components/MfaReenrollmentAlert.jsx'

// Pages
export { default as Login } from './views/pages/Login.jsx'
export { default as SignUp } from './views/pages/SignUp.jsx'
export { default as ForgotPassword } from './views/pages/ForgotPassword.jsx'
