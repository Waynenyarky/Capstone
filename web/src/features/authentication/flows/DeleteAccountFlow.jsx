import { Col } from 'antd'
import { SendDeleteCodeForCurrentUser, VerifyDeleteCodeForm, ConfirmDeleteAccountForm } from "@/features/authentication"
import { useLoggedInDeleteAccountFlow } from "@/features/authentication/hooks"

export default function DeleteAccountFlow() {
  const { step, sendProps, verifyProps, confirmProps } = useLoggedInDeleteAccountFlow()

  return (
    <div style={{ maxWidth: 400 }}>
      {step === 'send' && (
        <SendDeleteCodeForCurrentUser
          email={sendProps.email}
          onSent={sendProps.onSent}
          title={null} // Title handled by parent
        />
      )}
      {step === 'verify' && (
        <VerifyDeleteCodeForm
          email={verifyProps.email}
          onSubmit={verifyProps.onSubmit}
          title="Verify"
        />
      )}
      {step === 'confirm' && (
        <ConfirmDeleteAccountForm
          email={confirmProps.email}
          deleteToken={confirmProps.deleteToken}
          onSubmit={confirmProps.onSubmit}
        />
      )}
    </div>
  )
}