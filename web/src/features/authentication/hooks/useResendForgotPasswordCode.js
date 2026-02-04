import { useState, useCallback } from 'react'
import { sendForgotPassword } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications'
import useCooldown from './useCooldown'

export function useResendForgotPasswordCode({ email, cooldownSec = 60, onSent } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)
  const { remaining, isCooling, start } = useCooldown(cooldownSec)

  const handleResend = useCallback(async () => {
    if (!email) return error('Missing email')
    if (isCooling) return
    try {
      setSending(true)
      await sendForgotPassword({ email })
      success('Reset code sent to your email')
      start(cooldownSec)
      if (typeof onSent === 'function') onSent({ email })
    } catch (err) {
      console.error('Resend forgot password code error:', err)
      error(err?.message || err, 'Failed to resend code')
    } finally {
      setSending(false)
    }
  }, [email, isCooling, cooldownSec, start, success, error, onSent])

  return { isSending, handleResend, isCooling, remaining }
}

export default useResendForgotPasswordCode
