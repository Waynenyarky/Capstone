import { Col } from 'antd'
import { SendDeleteCodeForCurrentUser, VerifyDeleteCodeForm, ConfirmDeleteAccountForm } from "@/features/authentication"
import { useLoggedInDeleteAccountFlow } from "@/features/authentication/hooks"

export default function DeleteAccountFlow() {
  const { step, sendProps, verifyProps, confirmProps } = useLoggedInDeleteAccountFlow()

  return (
    <Col span={6}>
      {step === 'send' && (
        <SendDeleteCodeForCurrentUser
          email={sendProps.email}
          onSent={sendProps.onSent}
          title="Delete Account"
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
    </Col>
  )
}