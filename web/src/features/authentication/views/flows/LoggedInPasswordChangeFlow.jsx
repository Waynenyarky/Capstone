import { Steps, theme, Result, Button } from 'antd'
import { SendCodeForCurrentUser, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { useLoggedInPasswordChangeFlow } from "@/features/authentication/hooks"
import { MailOutlined, SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons'

export default function LoggedInPasswordChangeFlow() {
  const { step, sendProps, verifyProps, changeProps, reset } = useLoggedInPasswordChangeFlow()
  const { token } = theme.useToken()

  const currentStep = step === 'send' ? 0 : step === 'verify' ? 1 : step === 'change' ? 2 : 3

  const items = [
    {
      title: 'Request Code',
      icon: <MailOutlined />,
    },
    {
      title: 'Verify',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: 'New Password',
      icon: <LockOutlined />,
    },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Steps 
        current={currentStep} 
        items={items} 
        style={{ marginBottom: 40 }} 
        size="small"
      />
      
      <div style={{ 
        padding: 24, 
        background: token.colorFillAlter, 
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`
      }}>
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
          />
        )}
        {step === 'change' && (
          <ChangePasswordForm
            email={changeProps.email}
            resetToken={changeProps.resetToken}
            onSubmit={changeProps.onSubmit}
            isLoggedInFlow={true}
          />
        )}
        {step === 'done' && (
          <Result
            status="success"
            title="Password Changed Successfully"
            subTitle="Your password has been updated. You can now use your new password to log in."
            extra={[
              <Button type="primary" key="console" onClick={reset}>
                Change Again
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  )
}