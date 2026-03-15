import { useEffect, useRef, useState } from 'react'
import { Spin, Result, Button, Typography, Alert } from 'antd'
import { VerificationConfirmForm, ChangeEmailForm, VerificationNewEmailForm, EmailChangeGracePeriod } from "@/features/authentication"
import { useLoggedInEmailChangeFlow, useSendCodeForCurrentUserConfirm } from "@/features/authentication/hooks"
import EmailChangeTotpVerificationForm from '@/features/authentication/components/EmailChangeTotpVerificationForm.jsx'
import { changeEmailConfirmPasskeyStart, changeEmailConfirmVerify } from '@/features/authentication/services'
import { authenticateComplete } from '@/features/authentication/services/webauthnService'
import { base64ToBuffer, bufferToBase64 } from '@/features/authentication/lib/webauthnBuffers'

export default function LoggedInEmailChangeFlow({ onBackToStart } = {}) {
  const { step, sendProps, totpVerifyProps, verifyProps, changeProps, verifyNewProps, reset, totpEnabled, hasPasskeys, setStep } = useLoggedInEmailChangeFlow()
  const { isSending, handleSend } = useSendCodeForCurrentUserConfirm({ email: sendProps.email, onSent: sendProps.onSent })
  const sendTriggeredRef = useRef(false)
  const [isPasskeyVerifying, setIsPasskeyVerifying] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')
  const isTotpUser = totpEnabled // User has TOTP MFA enabled
  const isPasskeyUser = !totpEnabled && hasPasskeys // Passkey-only user

  const verifyPasskeyForEmailChange = async () => {
    const start = await changeEmailConfirmPasskeyStart()
    const pub = start?.publicKey
    if (!pub?.challenge) throw new Error('Invalid passkey challenge')

    const publicKey = {
      ...pub,
      challenge: base64ToBuffer(pub.challenge),
    }

    if (pub.allowCredentials?.length) {
      publicKey.allowCredentials = pub.allowCredentials.map((c) => ({
        ...c,
        id: base64ToBuffer(c.id),
      }))
    }

    const cred = await navigator.credentials.get({ publicKey })
    if (!cred?.response) throw new Error('Passkey verification was cancelled or timed out')

    const resp = cred.response
    await authenticateComplete({
      credential: {
        id: cred.id,
        rawId: bufferToBase64(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64(resp.clientDataJSON),
          authenticatorData: bufferToBase64(resp.authenticatorData),
          signature: bufferToBase64(resp.signature),
          userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
        },
      },
      purpose: 'email_change',
    })

    await changeEmailConfirmVerify({ code: 'PASSKEY_BYPASS' })
  }

  useEffect(() => {
    if (step !== 'send' || !sendProps.email || sendTriggeredRef.current) return
    
    const checkVerificationMethod = async () => {
      sendTriggeredRef.current = true
      
      // If user has TOTP enabled, skip email sending and go directly to TOTP verification
      if (isTotpUser) {
        setStep('totp-verify')
        return
      }
      
      const result = await handleSend()

      if (result?.success && result?.passkeyBypass) {
        try {
          setIsPasskeyVerifying(true)
          setPasskeyError('')
          await verifyPasskeyForEmailChange()
          setStep('change')
        } catch (err) {
          console.error('Passkey verification for email change failed:', err)
          setPasskeyError(err?.message || 'Passkey verification failed. Please try again.')
          sendTriggeredRef.current = false
          setStep('send')
        } finally {
          setIsPasskeyVerifying(false)
        }
      }
    }
    
    checkVerificationMethod()
  }, [step, sendProps.email, handleSend, isTotpUser, setStep])

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
      <div>
        {step === 'send' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            {isSending || isPasskeyVerifying ? (
              <>
                <Spin size="large" />
                <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                  {isPasskeyVerifying
                    ? 'Confirm the passkey prompt to continue...'
                    : (isTotpUser ? 'Preparing verification...' : 'Sending verification code to your email…')}
                </Typography.Paragraph>
              </>
            ) : (
              <>
                {passkeyError && (
                  <Alert
                    type="error"
                    showIcon
                    message={passkeyError}
                    style={{ marginBottom: 16, textAlign: 'left' }}
                  />
                )}
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  {isTotpUser
                    ? 'Ready for TOTP verification.'
                    : (passkeyError ? 'Passkey verification failed. Please try again.' : 'Preparing secure verification...')}
                </Typography.Paragraph>
                {!isTotpUser && (
                  <Button type="primary" onClick={() => {
                    sendTriggeredRef.current = false
                    setPasskeyError('')
                    handleSend()
                  }} loading={isSending}>
                    {passkeyError ? 'Try again' : 'Continue'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {step === 'totp-verify' && (
          <EmailChangeTotpVerificationForm
            email={totpVerifyProps.email}
            onSubmit={totpVerifyProps.onVerified}
            onBack={onBackToStart}
          />
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