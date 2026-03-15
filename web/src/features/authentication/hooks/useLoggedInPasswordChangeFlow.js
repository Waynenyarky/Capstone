import { useAuthSession } from '@/features/authentication/hooks'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'
import { useCallback, useState, useEffect } from 'react'
import { changePasswordVerify, changePasswordStart } from '@/features/authentication/services'
import { useAuthNotification, useNotifier } from '@/shared/notifications'

export function useLoggedInPasswordChangeFlow() {
  const { currentUser } = useAuthSession()
  const { effectiveEnabled, enabled: totpEnabled, hasPasskeys } = useLoggedInMfaManager()
  const { error } = useNotifier()
  const { notificationSuccess } = useAuthNotification()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [code, setCode] = useState('')
  const [totpVerified, setTotpVerified] = useState(false)

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback((result) => {
    // If MFA is required, go to MFA verification step
    if (result?.mfaRequired) {
      setStep('mfa-verify')
    } else if (result?.sent) {
      // Email OTP sent, go to verify step
      setStep('verify')
    } else {
      // No verification needed (passkey-only users), go directly to password step
      setStep('password')
    }
  }, [])

  const handleTotpVerified = useCallback(async (result) => {
    // After TOTP verification, we need to start the password change process
    // with a special bypass token since TOTP was already verified
    try {
      setTotpVerified(true)
      // Set a special code to indicate TOTP was verified
      setCode('TOTP_VERIFIED')
      setStep('password')
    } catch (err) {
      console.error('Error after TOTP verification:', err)
      error(err, 'Failed to proceed with password change')
    }
  }, [error])

  const handleMfaVerified = useCallback(() => {
    // After MFA verification, proceed to password change
    setStep('password')
  }, [])

  const handleVerifySubmit = useCallback(async ({ email: e, resetToken: token }) => {
    setEmail(e)
    setCode(token)
    setStep('password')
  }, [])

  const handlePasswordSubmit = useCallback(async (values) => {
    if (!values?.newPassword || values.newPassword !== values.confirmPassword) return
    try {
      if (totpVerified) {
        // For TOTP users, we need to first start the password change process, then verify it
        const startResult = await changePasswordStart({ email, newPassword: values.newPassword })
        if (startResult?.sent) {
          // Now verify with a special code since TOTP was already verified
          await changePasswordVerify({
            code: 'TOTP_VERIFIED',
            newPassword: values.newPassword,
          })
        }
      } else {
        // Always use the verify endpoint with the code from the OTP flow
        // For email OTP users: code comes from email OTP verification
        // For passkey users: code comes from PASSKEY_BYPASS
        await changePasswordVerify({
          code: code || 'PASSKEY_BYPASS',
          newPassword: values.newPassword,
        })
      }
      setStep('done')
      notificationSuccess('Password changed', 'Your password has been updated successfully.')
    } catch (err) {
      console.error('Change password error:', err)
      error(err, 'Failed to change password')
    }
  }, [email, code, totpVerified, notificationSuccess, error])

  const reset = useCallback(() => {
    setStep('send')
    setCode('')
    setTotpVerified(false)
  }, [])

  const goBack = useCallback(() => {
    if (step === 'totp-verify' || step === 'mfa-verify') {
      setStep('send')
    } else if (step === 'password') {
      setStep('send')
    } else {
      setStep('send')
    }
  }, [step])

  const sendProps = { email, onSent: handleSent, effectiveEnabled, totpEnabled, hasPasskeys }
  const totpVerifyProps = { email, onVerified: handleTotpVerified }
  const mfaVerifyProps = { email, onVerified: handleMfaVerified }
  const verifyProps = { email, onSubmit: handleVerifySubmit }
  const changeProps = { email, code, onSubmit: handlePasswordSubmit }

  return { step, setStep, sendProps, totpVerifyProps, mfaVerifyProps, verifyProps, changeProps, email, code, effectiveEnabled, totpEnabled, hasPasskeys, reset, goBack }
}
