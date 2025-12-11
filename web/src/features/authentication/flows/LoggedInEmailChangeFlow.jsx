import { Col } from 'antd'
import { SendCodeForCurrentUser, VerificationForm, ChangeEmailForm } from "@/features/authentication"
import { useLoggedInEmailChangeFlow } from "@/features/authentication/hooks"

export default function LoggedInEmailChangeFlow() {
  const { step, sendProps, verifyProps, changeProps } = useLoggedInEmailChangeFlow()

  return (
      <Col span={6}>
        {step === 'send' && (
          <SendCodeForCurrentUser
            email={sendProps.email}
            onSent={sendProps.onSent}
            title="Change Email"
          />
        )}
        {step === 'verify' && (
          <VerificationForm
            email={verifyProps.email}
            onSubmit={verifyProps.onSubmit}
            title="Verify"
          />
        )}
        {step === 'change' && (
          <ChangeEmailForm
            currentEmail={changeProps.email}
            resetToken={changeProps.resetToken}
            onSubmit={changeProps.onSubmit}
          />
        )}
      </Col>
  )
}