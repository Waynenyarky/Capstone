import { ForgotPasswordForm, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { usePasswordResetFlow, useResendForgotPasswordCode } from "./hooks"
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography } from 'antd'
import { useAuthNotification } from '@/shared/notifications.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

const { Title, Text } = Typography

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
  const staffRoles = ['staff', 'lgu_officer', 'inspector']
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
  const { step, forgotProps, verifyProps, mfaProps, totpProps, changeProps, goBack } = usePasswordResetFlow()
  const navigate = useNavigate()
  const { notificationSuccess } = useAuthNotification()
  const resend = useResendForgotPasswordCode({ email: verifyProps.email, cooldownSec: 60 })
  const [stepKey, setStepKey] = useState(0)

  // Trigger fade animation when step changes
  useEffect(() => {
    setStepKey(prev => prev + 1)
  }, [step])

  useEffect(() => {
    if (step === 'done') {
      const user = getCurrentUser()
      if (user) {
        notificationSuccess('Password updated', 'You are now logged in.')
        redirectByRole(navigate, user)
      } else {
        notificationSuccess('Password updated', 'Please log in with your new password.')
        navigate('/login')
      }
    }
  }, [step, navigate, notificationSuccess])

  return (
    <div
      key={stepKey}
      style={{
        width: '100%',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {step === 'forgot' && <ForgotPasswordForm onSubmit={forgotProps.onSubmit} />}
      {step === 'verify-totp' && (
        <VerificationForm
          email={totpProps.email}
          onSubmit={totpProps.onSubmit}
          title="Verify Your Identity"
          description="Enter the authentication code from your authenticator app to continue with password reset."
          verificationType="totp"
          onBack={goBack}
        />
      )}
      {step === 'verify-mfa' && (
        <VerificationForm
          email={mfaProps.email}
          onSubmit={mfaProps.onSubmit}
          title="Verify Your Identity"
          description="Enter the authentication code from your authenticator app to continue with password reset."
          verificationType="mfa"
          warning={mfaProps.warning}
          onBack={goBack}
        />
      )}
      {step === 'verify' && (
        <VerificationForm
          email={verifyProps.email}
          onSubmit={verifyProps.onSubmit}
          title="Verify Code"
          onResend={resend.handleResend}
          isResending={resend.isSending}
          isCooling={resend.isCooling}
          remaining={resend.remaining}
          onBack={goBack}
        />
      )}
      {step === 'change' && (
        <ChangePasswordForm
          email={changeProps.email}
          resetToken={changeProps.resetToken}
          onSubmit={changeProps.onSubmit}
          onBack={goBack}
        />
      )}
      {step === 'not_allowed' && (
        <div style={{ maxWidth: 300, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ marginBottom: 16 }}>Password reset not available</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, textAlign: 'left', lineHeight: 1.6 }}>
            Password reset is not available for your account type. If you are <strong>staff</strong>, use <strong>Request Recovery</strong> from the staff portal. If you are an <strong>administrator</strong>, contact another administrator to change your password. This attempt has been logged and administrators have been alerted.
          </Text>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={goBack}>Back</Button>
            <Button type="primary" onClick={() => navigate('/login')}>Go to login</Button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}