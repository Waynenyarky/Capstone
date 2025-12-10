import { useState, useCallback } from 'react'
import { loginStart } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications'
import useCooldown from './useCooldown'

export function useResendLoginCode({ email, cooldownSec = 60, onSent } = {}) {
  const { success, info, error } = useNotifier()
  const [isSending, setSending] = useState(false)
  const { remaining, isCooling, start } = useCooldown(cooldownSec)

  const handleResend = useCallback(async () => {
    if (!email) return error('Missing email')
    if (isCooling) return
    try {
      setSending(true)
      const data = await loginStart({ email, password: '' })
      success('Verification code sent')
      if (data?.devCode) info(`Dev code: ${data.devCode}`)
      start(cooldownSec)
      if (typeof onSent === 'function') onSent({ email, devCode: data?.devCode })
    } catch (err) {
      console.error('Resend login code error:', err)
      error(err, 'Failed to resend code')
    } finally {
      setSending(false)
    }
  }, [email, isCooling, cooldownSec, start, success, info, error, onSent])

  return { isSending, handleResend, isCooling, remaining }
}

export default useResendLoginCode
