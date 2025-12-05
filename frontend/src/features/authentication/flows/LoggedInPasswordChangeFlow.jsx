import { Col } from 'antd'
import { SendCodeForCurrentUser, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { useLoggedInPasswordChangeFlow } from "@/features/authentication/hooks"

export default function LoggedInPasswordChangeFlow() {
  const { step, sendProps, verifyProps, changeProps } = useLoggedInPasswordChangeFlow()

  return (
      <Col span={6}>
        {step === 'send' && (
          <SendCodeForCurrentUser
            email={sendProps.email}
            onSent={sendProps.onSent}
            title="Change Password"
          />
        )}
        {step === 'verify' && (
          <VerificationForm
            email={verifyProps.email}
            devCode={verifyProps.devCode}
            onSubmit={verifyProps.onSubmit}
            title="Verify"
          />
        )}
        {step === 'change' && (
          <ChangePasswordForm
            email={changeProps.email}
            resetToken={changeProps.resetToken}
            onSubmit={changeProps.onSubmit}
          />
        )}
      </Col>
  )
}