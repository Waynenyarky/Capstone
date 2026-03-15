import { useRef, useState } from 'react'
import { Result, Button, Typography, Alert, Spin, Checkbox } from 'antd'
import { Form } from '@/shared/components/AppForm'
import { useLoggedInDeleteAccountFlow, useSendDeleteAccountCode } from "@/features/authentication/hooks"
import VerifyDeleteCodeForm from '@/features/authentication/components/VerifyDeleteCodeForm.jsx'
import DeleteAccountTotpVerificationForm from '@/features/authentication/components/DeleteAccountTotpVerificationForm.jsx'
import { deleteAccountPasskeyStart, deleteAccountVerifyCode } from '@/features/authentication/services'
import { authenticateComplete } from '@/features/authentication/services/webauthnService'
import { base64ToBuffer, bufferToBase64 } from '@/features/authentication/lib/webauthnBuffers'

export default function DeleteAccountFlow({ onBackToStart } = {}) {
  const { step, sendProps, totpVerifyProps, verifyProps, confirmProps, reset, totpEnabled, hasPasskeys, setStep } = useLoggedInDeleteAccountFlow()
  const { isSending, handleSend } = useSendDeleteAccountCode({ email: sendProps.email, onSent: sendProps.onSent })
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')
  const [isPasskeyVerifying, setIsPasskeyVerifying] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const showBack = typeof onBackToStart === 'function'
  const isTotpUser = totpEnabled // User has TOTP MFA enabled

  const verifyPasskeyForDeleteAccount = async () => {
    const start = await deleteAccountPasskeyStart()
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
      purpose: 'delete_account',
    })
  }

  const beginVerification = async () => {
    if (isTotpUser) {
      setPasskeyError('')
      setStep('totp-verify')
      return
    }

    const result = await handleSend()

    if (result?.success && result?.passkeyBypass) {
      try {
        setIsPasskeyVerifying(true)
        setPasskeyError('')
        await verifyPasskeyForDeleteAccount()
        const bypassResult = await deleteAccountVerifyCode({ email: sendProps.email, code: 'PASSKEY_BYPASS' })
        await verifyProps.onSubmit({ email: sendProps.email, deleteToken: bypassResult?.deleteToken })
      } catch (err) {
        console.error('Passkey verification for delete account failed:', err)
        setPasskeyError(err?.message || 'Passkey verification failed. Please try again.')
        setStep('send')
      } finally {
        setIsPasskeyVerifying(false)
      }
    }
  }

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await confirmProps.onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'send') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
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
              <Alert
                message="This action is irreversible"
                description="Before continuing, confirm that you understand your account access will be removed after the grace period. Some records may be retained where required for BPLO, legal, audit, or government record-keeping purposes."
                type="warning"
                showIcon
                style={{ marginBottom: 16, textAlign: 'left' }}
              />
              {passkeyError && (
                <Alert
                  type="error"
                  showIcon
                  message={passkeyError}
                  style={{ marginBottom: 16, textAlign: 'left' }}
                />
              )}
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {passkeyError
                  ? 'Passkey verification failed. Please try again.'
                  : 'A verification step is required before you can schedule account deletion.'}
              </Typography.Paragraph>
              <Checkbox
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                style={{ display: 'block', textAlign: 'left', marginBottom: 16 }}
              >
                I understand that deleting my account is a serious action and requires identity verification before I can continue.
              </Checkbox>
              {!isTotpUser && (
                <Button type="primary" onClick={() => {
                  setPasskeyError('')
                  beginVerification()
                }} loading={isSending || isPasskeyVerifying} disabled={!acknowledged}>
                  {passkeyError ? 'Try again' : 'Continue'}
                </Button>
              )}
              {isTotpUser && (
                <Button type="primary" onClick={beginVerification} disabled={!acknowledged}>
                  Continue
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  if (step === 'totp-verify') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <DeleteAccountTotpVerificationForm
          email={totpVerifyProps.email}
          onSubmit={totpVerifyProps.onVerified}
          onBack={showBack ? onBackToStart : reset}
        />
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <VerifyDeleteCodeForm
          email={verifyProps.email}
          onSubmit={verifyProps.onSubmit}
          title="Enter verification code"
        />
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        {showBack && (
          <Button type="text" onClick={onBackToStart} style={{ marginBottom: 16, paddingLeft: 0 }}>
            &larr; Back
          </Button>
        )}

        <Alert
          message="⚠️  This action cannot be undone"
          description="Deleting your account will permanently remove your access to this account. Personal account data may be deleted or anonymized where allowed, while business, permit, audit, and other records may be retained where required for BPLO, legal, or government record-keeping purposes."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              danger 
              htmlType="submit" 
              loading={isSubmitting} 
              disabled={isSubmitting}
              block
            >
              Delete My Account Permanently
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <Result
          status="success"
          title="Account Deletion Scheduled"
          subTitle="Your account access is scheduled for removal after the grace period. You will receive a confirmation email shortly, and records required for BPLO, legal, audit, or government record-keeping purposes may be retained."
          extra={[
            <Button type="primary" key="done" onClick={() => (typeof onBackToStart === 'function' ? onBackToStart() : reset())}>
              Done
            </Button>,
          ]}
        />
      </div>
    )
  }

  return null
}