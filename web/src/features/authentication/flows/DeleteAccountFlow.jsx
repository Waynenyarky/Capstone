import { Steps, theme, Result, Button } from 'antd'
import { SendDeleteCodeForCurrentUser, VerifyDeleteCodeForm, ConfirmDeleteAccountForm } from "@/features/authentication"
import { useLoggedInDeleteAccountFlow } from "@/features/authentication/hooks"
import { WarningOutlined, SafetyCertificateOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'

export default function DeleteAccountFlow() {
  const { step, sendProps, verifyProps, confirmProps } = useLoggedInDeleteAccountFlow()
  const { token } = theme.useToken()

  const currentStep = step === 'send' ? 0 : step === 'verify' ? 1 : step === 'confirm' ? 2 : 3

  const items = [
    {
      title: 'Request',
      icon: <WarningOutlined />,
    },
    {
      title: 'Verify',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: 'Confirm',
      icon: <DeleteOutlined />,
    },
    {
      title: 'Scheduled',
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
          <SendDeleteCodeForCurrentUser
            email={sendProps.email}
            onSent={sendProps.onSent}
            title="Request Account Deletion"
          />
        )}

        {step === 'verify' && (
          <VerifyDeleteCodeForm
            email={verifyProps.email}
            onSubmit={verifyProps.onSubmit}
            title="Verify Identity"
          />
        )}

        {step === 'confirm' && (
          <ConfirmDeleteAccountForm
            email={confirmProps.email}
            deleteToken={confirmProps.deleteToken}
            onSubmit={confirmProps.onSubmit}
          />
        )}

        {step === 'done' && (
          <Result
            status="success"
            title="Account Deletion Scheduled"
            subTitle="Your account has been scheduled for deletion. You will be logged out shortly."
            extra={[
              <Button type="primary" key="done" onClick={() => window.location.reload()}>
                Done
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  )
}