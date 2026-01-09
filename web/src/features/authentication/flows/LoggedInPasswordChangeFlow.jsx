import { Col } from 'antd'
import { SendCodeForCurrentUser, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { useLoggedInPasswordChangeFlow } from "@/features/authentication/hooks"

export default function LoggedInPasswordChangeFlow() {
  const { step, sendProps, verifyProps, changeProps } = useLoggedInPasswordChangeFlow()

  return (
      <div style={{ maxWidth: 400 }}>
        {step === 'send' && (
          <SendCodeForCurrentUser
            email={sendProps.email}
            onSent={sendProps.onSent}
            title={null} // Title handled by parent
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
          <ChangePasswordForm
            email={changeProps.email}
            resetToken={changeProps.resetToken}
            onSubmit={changeProps.onSubmit}
          />
        )}
      </div>
  )
}