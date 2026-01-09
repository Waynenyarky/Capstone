import { Col, Card, Button, Typography, Row } from 'antd'
import { SendCodeForCurrentUserConfirm, VerificationConfirmForm, ChangeEmailForm, VerificationNewEmailForm } from "@/features/authentication"
import { useLoggedInEmailChangeFlow } from "@/features/authentication/hooks"

export default function LoggedInEmailChangeFlow() {
  const { step, sendProps, verifyProps, changeProps, verifyNewProps, reset } = useLoggedInEmailChangeFlow()

  return (
    <div style={{ maxWidth: 400 }}>
      {step === 'send' && (
        <SendCodeForCurrentUserConfirm
          email={sendProps.email}
          onSent={sendProps.onSent}
          title={null} // Title is handled by parent container
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
        <Card title="Email Changed">
          <Typography.Paragraph>
            Your email has been successfully updated to <strong>{verifyNewProps?.email || ''}</strong>.
          </Typography.Paragraph>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" onClick={reset}>Done</Button>
          </div>
        </Card>
      )}
    </div>
  )
}