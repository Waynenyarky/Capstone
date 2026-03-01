import { useEffect, useRef } from 'react'
import { Spin, Result, Button, Typography } from 'antd'
import { VerificationConfirmForm, ChangeEmailForm, VerificationNewEmailForm, EmailChangeGracePeriod } from "@/features/authentication"
import { useLoggedInEmailChangeFlow, useSendCodeForCurrentUserConfirm } from "@/features/authentication/hooks"

export default function LoggedInEmailChangeFlow({ onBackToStart } = {}) {
  const { step, sendProps, verifyProps, changeProps, verifyNewProps, reset } = useLoggedInEmailChangeFlow()
  const { isSending, handleSend } = useSendCodeForCurrentUserConfirm({ email: sendProps.email, onSent: sendProps.onSent })
  const sendTriggeredRef = useRef(false)

  useEffect(() => {
    if (step !== 'send' || !sendProps.email || sendTriggeredRef.current) return
    sendTriggeredRef.current = true
    handleSend()
  }, [step, sendProps.email, handleSend])

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
      <div>
        {step === 'send' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            {isSending ? (
              <>
                <Spin size="large" />
                <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                  Sending verification code to your email…
                </Typography.Paragraph>
              </>
            ) : (
              <>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Could not send the code. Please try again.
                </Typography.Paragraph>
                <Button type="primary" onClick={handleSend} loading={isSending}>
                  Try again
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'verify' && (
          <VerificationConfirmForm
            email={verifyProps.email}
            onSubmit={verifyProps.onSubmit}
            title="Enter verification code"
            onBack={onBackToStart}
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
            title="Confirm new email"
          />
        )}

        {step === 'done' && (
          <div>
            <Result
              status="success"
              title="Email Address Updated"
              subTitle={
                <span>
                  Your email has been successfully updated to <strong>{verifyNewProps?.email || ''}</strong>.
                  <br />Please use this email for future logins.
                </span>
              }
              extra={[
                <Button type="primary" key="done" onClick={() => (typeof onBackToStart === 'function' ? onBackToStart() : reset())}>
                  Done
                </Button>,
              ]}
            />
            <EmailChangeGracePeriod onReverted={reset} />
          </div>
        )}
      </div>
    </div>
  )
}