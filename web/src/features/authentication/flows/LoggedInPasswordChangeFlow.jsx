import { useEffect, useRef, useState } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, Result, Spin, Alert } from 'antd'
import { changePasswordRules, confirmPasswordRulesForNewPassword } from '@/features/authentication/validations'
import PasswordStrengthIndicator from '@/features/authentication/components/PasswordStrengthIndicator.jsx'
import { useLoggedInPasswordChangeFlow, useSendCodeForCurrentUserPasswordChange } from '@/features/authentication/hooks'
import VerificationConfirmForm from '@/features/authentication/components/VerificationConfirmForm.jsx'
import MfaVerificationForm from '@/features/authentication/components/MfaVerificationForm.jsx'
import PasswordChangeTotpVerificationForm from '@/features/authentication/components/PasswordChangeTotpVerificationForm.jsx'
import { changePasswordPasskeyStart } from '@/features/authentication/services'
import { authenticateComplete } from '@/features/authentication/services/webauthnService'
import { base64ToBuffer, bufferToBase64 } from '@/features/authentication/lib/webauthnBuffers'

const { Title, Text } = Typography

export default function LoggedInPasswordChangeFlow({ onBackToStart } = {}) {
  const { step, setStep, sendProps, totpVerifyProps, mfaVerifyProps, verifyProps, changeProps, reset, effectiveEnabled, code, totpEnabled, hasPasskeys } = useLoggedInPasswordChangeFlow()
  const { isSending, handleSend } = useSendCodeForCurrentUserPasswordChange({ email: sendProps.email, onSent: sendProps.onSent })
  const [passwordForm] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [passwordValue, setPasswordValue] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')
  const [isPasskeyVerifying, setIsPasskeyVerifying] = useState(false)
  const sendTriggeredRef = useRef(false)
  const showBack = typeof onBackToStart === 'function'
  const isPasskeyUser = !code && effectiveEnabled && !totpEnabled && hasPasskeys // Passkey users have no code but MFA is enabled
  const isTotpUser = totpEnabled // User has TOTP MFA enabled

  const verifyPasskeyForPasswordChange = async () => {
    const start = await changePasswordPasskeyStart()
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
      purpose: 'password_change',
    })
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

      if (result.success && result.passkeyBypass) {
        try {
          setIsPasskeyVerifying(true)
          setPasskeyError('')
          await verifyPasskeyForPasswordChange()
          setStep('password')
        } catch (err) {
          console.error('Passkey verification for password change failed:', err)
          setPasskeyError(err?.message || 'Passkey verification failed. Please try again.')
          sendTriggeredRef.current = false
          setStep('send')
        } finally {
          setIsPasskeyVerifying(false)
        }
        return
      }
      
      if (result.success && result.mfaRequired) {
        // This should only happen for edge cases, go to email OTP verification
        setStep('mfa-verify')
      } else if (result.success && !result.mfaRequired) {
        // Email OTP sent, go to verify step
        setStep('verify')
      }
    }
    
    checkVerificationMethod()
  }, [step, sendProps.email, handleSend, isTotpUser])

  const onPasswordFinish = async (values) => {
    setSubmitting(true)
    try {
      await changeProps.onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  const onVerifyFinish = async (values) => {
    // Wait a tick to ensure form state is updated (especially after paste)
    await new Promise(resolve => setTimeout(resolve, 0))

    let codeRaw = verifyForm.getFieldValue('verificationCode') || values?.verificationCode
    if (Array.isArray(codeRaw)) codeRaw = codeRaw.join('')

    const normalized = String(codeRaw || '').replace(/[^0-9]/g, '').slice(0, 6)
    if (!normalized || normalized.length !== 6) {
      verifyForm.setFields([{ name: 'verificationCode', errors: ['Code must be exactly 6 digits'] }])
      return
    }

    verifyForm.resetFields()
    if (typeof verifyProps?.onSubmit === 'function') {
      verifyProps.onSubmit({ email: verifyProps.email, resetToken: normalized })
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
                  : (effectiveEnabled ? 'Checking multi-factor authentication...' : 'Sending verification code to your email…')}
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
              {passkeyError ? (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Passkey verification failed. Please try again.
                </Typography.Paragraph>
              ) : (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Preparing secure verification...
                </Typography.Paragraph>
              )}
              <Button type="primary" onClick={() => {
                sendTriggeredRef.current = false
                setPasskeyError('')
                handleSend()
              }} loading={isSending}>
                {passkeyError ? 'Try again' : 'Continue'}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (step === 'totp-verify') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <PasswordChangeTotpVerificationForm
          email={totpVerifyProps.email}
          onSubmit={totpVerifyProps.onVerified}
          onBack={showBack ? onBackToStart : () => setStep('send')}
        />
      </div>
    )
  }

  if (step === 'mfa-verify') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <MfaVerificationForm
          email={sendProps.email}
          onSubmit={mfaVerifyProps.onVerified}
          onBack={showBack ? onBackToStart : () => setStep('send')}
          warning="Multi-factor authentication is required to change your password."
        />
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        {showBack && (
          <Button type="text" onClick={onBackToStart} style={{ marginBottom: 16, paddingLeft: 0 }}>
            &larr; Back
          </Button>
        )}
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Enter verification code</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Enter the 6-digit code sent to <br/>
              <Text strong style={{ color: '#003a70' }}>{verifyProps.email}</Text>
            </Text>
          </div>

          <Form
            name="password_change_verify"
            form={verifyForm}
            layout="vertical"
            onFinish={onVerifyFinish}
            size="default"
            requiredMark={false}
          >
            <Form.Item
              name="verificationCode"
              rules={[
                { required: true, message: 'Please enter the verification code' },
                { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
              ]}
              style={{ marginBottom: 32 }}
              getValueFromEvent={(val) => {
                if (typeof val === 'string') return val.replace(/\D/g, '').slice(0, 6)
                if (Array.isArray(val)) return val.join('').replace(/\D/g, '').slice(0, 6)
                return ''
              }}
            >
              <Input.OTP
                length={6}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                inputType="numeric"
                mask={false}
                onKeyDown={(e) => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                  if (allowedKeys.includes(e.key)) return
                  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="primary" htmlType="submit" block>
                Verify
              </Button>
            </Form.Item>
          </Form>

          {showBack && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button type="text" onClick={onBackToStart} style={{ padding: 0 }}>
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'password') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        {showBack && (
          <Button type="text" onClick={onBackToStart} style={{ marginBottom: 16, paddingLeft: 0 }}>
            &larr; Back
          </Button>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16 }}>Change Password</Title>
          <Text type="secondary">
            {isPasskeyUser 
              ? "Enter your new password. Your identity has been verified with your passkey."
              : "Enter your new password. Your identity has been verified."
            }
          </Text>
        </div>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={onPasswordFinish}
          requiredMark={false}
        >
          <Form.Item 
            name="newPassword" 
            label="New Password" 
            rules={changePasswordRules}
            hasFeedback
          >
            <Input.Password
              placeholder="Enter new password"
              onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
            />
          </Form.Item>
          
          {passwordValue && (
            <Form.Item style={{ marginBottom: 16 }}>
              <PasswordStrengthIndicator value={passwordValue} />
            </Form.Item>
          )}
          
          <Form.Item 
            name="confirmPassword" 
            label="Confirm New Password" 
            dependencies={['newPassword']} 
            hasFeedback 
            rules={confirmPasswordRulesForNewPassword}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
              Change Password
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
          title="Password Changed Successfully"
          subTitle="Your password has been updated. You can now use your new password to log in."
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
