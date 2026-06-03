import VerificationForm from './VerificationForm.jsx'

export default {
  title: 'Authentication/VerificationForm',
  component: VerificationForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export const EmailVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    onResend: () => {},
    title: 'Verify Your Email',
    description: 'Enter the 6-digit code sent to your email address',
    verificationType: 'email',
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
}

export const LoginVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    onResend: () => {},
    title: 'Verify Login',
    description: 'Enter the 6-digit code sent to your email address',
    verificationType: 'login',
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    devCode: '123456',
  },
}

export const SignupVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    onResend: () => {},
    title: 'Verify Your Email',
    description: 'Enter the 6-digit code sent to your email address',
    verificationType: 'signup',
    devCode: '654321',
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
}

export const TOTPVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    title: 'Verify Your Identity',
    description: 'Enter the authentication code from your authenticator app',
    verificationType: 'totp',
  },
}

export const MFAVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    title: 'MFA Verification',
    description: 'Enter the authentication code from your authenticator app',
    verificationType: 'mfa',
  },
}

export const EmailChangeVerification = {
  args: {
    email: 'newemail@example.com',
    currentEmail: 'oldemail@example.com',
    onSubmit: () => {},
    onBack: () => {},
    onResend: () => {},
    title: 'Confirm New Email',
    description: 'Enter the 6-digit code sent to your new email address',
    verificationType: 'email-change',
    maxWidth: 400,
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
}

export const DeleteAccountVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    onBack: () => {},
    onResend: () => {},
    title: 'Enter Verification Code',
    description: 'Enter the code sent to your email to confirm account deletion',
    verificationType: 'delete-account',
    dangerButton: true,
    maxWidth: 420,
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  },
}

export const EmailChangeTOTPVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    title: 'Verify Your Identity',
    description: 'Enter the authentication code from your authenticator app to continue with email change',
    verificationType: 'email-change-totp',
    onBack: () => {},
  },
}

export const PasswordChangeTOTPVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    title: 'Verify Your Identity',
    description: 'Enter the authentication code from your authenticator app to continue with password change',
    verificationType: 'password-change-totp',
    onBack: () => {},
  },
}

export const DeleteAccountTOTPVerification = {
  args: {
    email: 'user@example.com',
    onSubmit: () => {},
    title: 'Verify Your Identity',
    description: 'Enter the authentication code from your authenticator app to continue with account deletion',
    verificationType: 'delete-totp',
    dangerButton: true,
    onBack: () => {},
  },
}
