import { Steps, theme, Result, Button } from 'antd'
import { SendCodeForCurrentUser, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { useLoggedInPasswordChangeFlow, useResendForgotPasswordCode } from "@/features/authentication/hooks"
import { MailOutlined, SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons'

export default function LoggedInPasswordChangeFlow() {
  const { step, sendProps, verifyProps, changeProps, reset, goBack } = useLoggedInPasswordChangeFlow()
  const { token } = theme.useToken()
  const resend = useResendForgotPasswordCode({ email: verifyProps.email, cooldownSec: 60 })

  const currentStep = step === 'send' ? 0 : step === 'verify' ? 1 : step === 'change' ? 2 : 3
  const items = [
    { title: 'Request Code', icon: <MailOutlined /> },
    { title: 'Verify', icon: <SafetyCertificateOutlined /> },
    { title: 'New Password', icon: <LockOutlined /> },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div>
      
        {step === 'send' && (
          <SendCodeForCurrentUser
            email={sendProps.email}
            onSent={sendProps.onSent}
            title="Secure Password Change"
            subtitle="To protect your account, we need to verify your identity before changing your password."
          />
        )}
        {step === 'verify' && (
          <VerificationForm
            email={verifyProps.email}
            onSubmit={verifyProps.onSubmit}
            title="Verify Identity"
            isLoggedInFlow={true}
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
            isLoggedInFlow={true}
            onBack={goBack}
          />
        )}
        {step === 'done' && (
          <Result
            status="success"
            title="Password Changed Successfully"
            subTitle="Your password has been updated. You can now use your new password to log in."
            extra={[
              <Button type="primary" key="again" onClick={reset}>
                Change Again
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  )
}