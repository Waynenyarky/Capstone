import { ForgotPasswordForm, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { usePasswordResetFlow, useResendForgotPasswordCode } from "@/features/authentication/hooks"
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifier } from '@/shared/notifications.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

function redirectByRole(navigate, user) {
  const role = String(user?.role?.slug || user?.role || '').toLowerCase()
  if (role === 'admin') {
    navigate('/admin/dashboard')
    return
  }
  if (role === 'business_owner') {
    navigate('/owner')
    return
  }
  const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']
  if (staffRoles.includes(role)) {
    if (user?.mustChangeCredentials || user?.mustSetupMfa) {
      navigate('/staff/onboarding')
    } else {
      navigate('/staff')
    }
    return
  }
  navigate('/owner')
}

export default function PasswordResetFlow() {
  const { step, forgotProps, verifyProps, changeProps } = usePasswordResetFlow()
  const navigate = useNavigate()
  const { success } = useNotifier()
  const resend = useResendForgotPasswordCode({ email: verifyProps.email, cooldownSec: 60 })

  useEffect(() => {
    if (step === 'done') {
      const user = getCurrentUser()
      if (user) {
        success('Your password was updated. You are now logged in.')
        redirectByRole(navigate, user)
      } else {
        success('Your password was updated. Please log in with your new password.')
        navigate('/login')
      }
    }
  }, [step, navigate, success])

  return (
    <>
      {step === 'forgot' && <ForgotPasswordForm onSubmit={forgotProps.onSubmit} />}
      {step === 'verify' && (
        <VerificationForm
          email={verifyProps.email}
          onSubmit={verifyProps.onSubmit}
          onResend={resend.handleResend}
          isResending={resend.isSending}
          isCooling={resend.isCooling}
          remaining={resend.remaining}
        />
      )}
      {step === 'change' && <ChangePasswordForm email={changeProps.email} resetToken={changeProps.resetToken} onSubmit={changeProps.onSubmit} />}
    </>
  )
}