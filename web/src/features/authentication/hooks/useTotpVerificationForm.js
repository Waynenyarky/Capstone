import { useState, useCallback, useRef } from 'react'
import { verifyLoginTotp } from '@/features/authentication/services/authService'
import { useNotifier, useAuthNotification } from '@/shared/notifications.js'

export function useTotpVerificationForm({ onSubmit, email, onSessionExpired } = {}) {
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const codeRef = useRef('')
  const { success, error } = useNotifier()
  const { notificationError } = useAuthNotification()

  const handleCodeChange = useCallback((val) => {
    const raw = Array.isArray(val) ? val.join('') : String(val ?? '')
    const normalized = raw.replace(/\D/g, '').slice(0, 6)
    codeRef.current = normalized
    setCode(normalized)
    if (codeError) setCodeError('')
  }, [codeError])

  const handleVerify = useCallback(async () => {
    if (!email) {
      error('Your login verification session expired. Please sign in again.', 'Session expired')
      if (typeof onSessionExpired === 'function') onSessionExpired()
      return
    }

    // Read directly from ref — always has the latest value, no form sync issues
    const normalizedCode = codeRef.current
    if (!normalizedCode || normalizedCode.length !== 6) {
      setCodeError('Code must be exactly 6 digits')
      return
    }

    const payload = { email, code: normalizedCode }
    try {
      setSubmitting(true)
      const user = await verifyLoginTotp(payload)
      success('Code verified')
      setCode('')
      codeRef.current = ''
      if (typeof onSubmit === 'function') onSubmit(user)
    } catch (err) {
      console.error('TOTP verification error:', err)
      const lower = String(err?.message || '').toLowerCase()
      const errCode = String(err?.code || '').toLowerCase()
      
      // Check if account deletion is scheduled - user should use email OTP instead
      if (lower.includes('scheduled deletion') || lower.includes('use email otp') || errCode === 'use_email_otp_for_scheduled_deletion') {
        error(
          'Account deletion is scheduled. Please use the email verification code sent to your email instead of TOTP. Check your inbox for the verification code.',
          'Use Email OTP Instead'
        )
        setCodeError('Account deletion scheduled - please use email OTP code instead')
      } else if (lower.includes('invalid')) {
        const invalidMsg = 'The authenticator code is incorrect. Please try again.'
        notificationError('Incorrect Code', invalidMsg)
        setCodeError(invalidMsg)
      } else if (lower.includes('expired')) {
        const expiredMsg = 'The authenticator code has expired. Please generate a new code.'
        notificationError('Code Expired', expiredMsg)
        setCodeError(expiredMsg)
      } else if (errCode === 'mfa_not_enabled' || errCode === 'request_not_found' || errCode === 'user_not_found') {
        error('Your verification session is no longer valid. Please sign in again.', 'Session expired')
        if (typeof onSessionExpired === 'function') onSessionExpired()
      } else if (err?.status === 401) {
        const invalidMsg = 'The authenticator code is incorrect. Please try again.'
        setCodeError(invalidMsg)
        error(invalidMsg, 'Incorrect Code')
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }, [email, onSubmit, onSessionExpired, success, error, notificationError])

  return { code, setCode: handleCodeChange, codeError, handleVerify, isSubmitting }
}

export default useTotpVerificationForm
