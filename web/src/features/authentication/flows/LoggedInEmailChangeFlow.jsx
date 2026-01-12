import { Steps, theme, Result, Button } from 'antd'
import { SendCodeForCurrentUserConfirm, VerificationConfirmForm, ChangeEmailForm, VerificationNewEmailForm } from "@/features/authentication"
import { useLoggedInEmailChangeFlow } from "@/features/authentication/hooks"
import { MailOutlined, SafetyCertificateOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons'

export default function LoggedInEmailChangeFlow() {
  const { step, sendProps, verifyProps, changeProps, verifyNewProps, reset } = useLoggedInEmailChangeFlow()
  const { token } = theme.useToken()

  const currentStep = step === 'send' ? 0 : step === 'verify' ? 1 : step === 'change' ? 2 : step === 'verifyNew' ? 3 : 4

  const items = [
    {
      title: 'Request',
      icon: <MailOutlined />,
    },
    {
      title: 'Verify',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: 'Update',
      icon: <EditOutlined />,
    },
    {
      title: 'Confirm',
      icon: <CheckCircleOutlined />,
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
          <SendCodeForCurrentUserConfirm
            email={sendProps.email}
            onSent={sendProps.onSent}
            title="Update Email Address"
            subtitle="To update your email, we first need to verify your current email address."
          />
        )}

        {step === 'verify' && (
          <VerificationConfirmForm
            email={verifyProps.email}
            onSubmit={verifyProps.onSubmit}
            title="Verify Current Email"
          />
        )}

        {step === 'change' && (
          <ChangeEmailForm
            currentEmail={changeProps.email}
            resetToken={changeProps.resetToken}
            onSubmit={changeProps.onSubmit}
          />
        )}

        {step === 'verifyNew' && (
          <VerificationNewEmailForm
            email={verifyNewProps.email}
            currentEmail={verifyNewProps.currentEmail}
            onSubmit={verifyNewProps.onSubmit}
            title="Verify New Email"
          />
        )}

        {step === 'done' && (
          <Result
            status="success"
            title="Email Address Updated"
            subTitle={
              <span>
                Your email has been successfully updated to <strong>{verifyNewProps?.email || ''}</strong>. 
                <br/>Please use this email for future logins.
              </span>
            }
            extra={[
              <Button type="primary" key="done" onClick={reset}>
                Done
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  )
}