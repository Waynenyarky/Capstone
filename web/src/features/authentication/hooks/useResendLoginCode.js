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
        // If server provided retry/lock info, prefer it for cooldown
        let cooldownToStart = cooldownSec
        if (data) {
          if (typeof data.retryAfter === 'number') {
            cooldownToStart = Number(data.retryAfter)
          } else if (typeof data.retryAfterSec === 'number') {
            cooldownToStart = Number(data.retryAfterSec)
          } else if (typeof data.retryAfterMs === 'number') {
            cooldownToStart = Math.max(0, Math.ceil(Number(data.retryAfterMs) / 1000))
          } else if (data.lockedUntil) {
            // lockedUntil may be epoch ms or ISO string
            const lu = Number(data.lockedUntil) || Date.parse(data.lockedUntil)
            if (!Number.isNaN(lu)) {
              cooldownToStart = Math.max(0, Math.ceil((Number(lu) - Date.now()) / 1000))
            }
          }
        }
        start(Math.max(0, Math.floor(cooldownToStart)))
      if (typeof onSent === 'function') onSent({ email })
    } catch (err) {
      console.error('Resend login code error:', err)
        // If server returned structured lock info in a thrown object (some callers use fetchWithFallback),
        // try to honor it. Otherwise show a generic error.
        try {
          const maybe = err?.body || err?.response || null
          if (maybe) {
            const locked = maybe.lockedUntil || maybe.locked_at || maybe.locked_until
            const retry = maybe.retryAfter || maybe.retry_after || maybe.retry_after_ms
            if (locked) {
              const lu = Number(locked) || Date.parse(locked)
              if (!Number.isNaN(lu)) start(Math.max(0, Math.ceil((Number(lu) - Date.now()) / 1000)))
            } else if (retry) {
              const secs = Number(retry) || Math.ceil(Number(retry) / 1000)
              if (!Number.isNaN(secs)) start(Math.max(0, Math.floor(secs)))
            }
          }
        } catch { /* ignore parsing errors */ }
        error(err?.message || err, 'Failed to resend code')
    } finally {
      setSending(false)
    }
  }, [email, isCooling, cooldownSec, start, success, info, error, onSent])

  return { isSending, handleResend, isCooling, remaining }
}

export default useResendLoginCode
