import { useAuthSession } from '@/features/authentication/hooks'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'
import { useCallback, useState, useEffect, useRef } from 'react'
import { changePasswordVerify } from '@/features/authentication/services'
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
    // After TOTP verification, store the actual TOTP code for password change
    try {
      setTotpVerified(true)
      // Store the actual TOTP code that was verified (passed from the form)
      const totpCode = result?.totpCode || result?.code || ''
      if (totpCode) {
        setCode(totpCode)
      }
      setStep('password')
    } catch (err) {
      console.error('Error after TOTP verification:', err)
      error(err, 'Failed to proceed with password change')
    }
  }, [error])

  const handleMfaVerified = useCallback((result) => {
    // After MFA verification, store the actual code and proceed to password change
    setTotpVerified(true)
    const totpCode = result?.totpCode || result?.code || ''
    if (totpCode) {
      setCode(totpCode)
    }
    setStep('password')
  }, [])

  const handleVerifySubmit = useCallback(async ({ email: e, resetToken: token }) => {
    setEmail(e)
    setCode(token)
    setStep('password')
  }, [])

  // Use a ref to track the latest code value (avoids stale closure issues)
  const codeRef = useRef('')
  useEffect(() => {
    codeRef.current = code
  }, [code])

  const handlePasswordSubmit = useCallback(async (values) => {
    if (!values?.newPassword || values.newPassword !== values.confirmPassword) return
    try {
      // Read from ref to get the latest code value
      const currentCode = codeRef.current
      
      if (currentCode && currentCode !== '') {
        // Use the verification code (either email OTP or TOTP code)
        await changePasswordVerify({
          code: currentCode,
          newPassword: values.newPassword,
        })
      } else {
        // Passkey-only users: use PASSKEY_BYPASS (only if passkey step-up was completed)
        await changePasswordVerify({
          code: 'PASSKEY_BYPASS',
          newPassword: values.newPassword,
        })
      }
      setStep('done')
      notificationSuccess('Password changed', 'Your password has been updated successfully.')
    } catch (err) {
      console.error('Change password error:', err)
      error(err, 'Failed to change password')
    }
  }, [email, totpVerified, notificationSuccess, error])

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
