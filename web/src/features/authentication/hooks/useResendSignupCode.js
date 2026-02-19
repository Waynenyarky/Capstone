import { useState, useCallback } from 'react'
import { resendSignupCode } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications'
import useCooldown from './useCooldown'

export function useResendSignupCode({ email, cooldownSec = 60, onSent } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)
  const { remaining, isCooling, start } = useCooldown(cooldownSec)

  const handleResend = useCallback(async () => {
    if (!email) return error('Missing email')
    if (isCooling) return
    try {
      setSending(true)
      const data = await resendSignupCode({ email })
      success('Verification code sent')
      
      // Handle server-side cooldown if provided
      let cooldownToStart = cooldownSec
      if (data) {
        if (typeof data.retryAfter === 'number') {
          cooldownToStart = Number(data.retryAfter)
        } else if (typeof data.retryAfterSec === 'number') {
          cooldownToStart = Number(data.retryAfterSec)
        }
      }
      start(Math.max(0, Math.floor(cooldownToStart)))
      
      if (typeof onSent === 'function') onSent({ email, devCode: data?.devCode })
    } catch (err) {
      console.error('Resend signup code error:', err)
      
      // Handle specific errors
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('expired')) {
        error('Signup request expired, please sign up again')
      } else if (msg.includes('rate limited') || msg.includes('wait') || msg.includes('too many requests')) {
         // If we hit a rate limit, use server retryAfterSec or parse from message
         try {
            let secs = 0
            const body = err?.originalError || err?.body || err?.response || null
            const errObj = body?.error ?? body
            if (typeof errObj?.retryAfterSec === 'number') secs = errObj.retryAfterSec
            else if (typeof errObj?.retryAfter === 'number') secs = errObj.retryAfter
            else {
                const match = msg.match(/(?:in|wait)\s+(\d+)\s*s/i)
                if (match && match[1]) secs = parseInt(match[1], 10)
            }
            
            if (secs > 0 && !Number.isNaN(secs)) {
                start(secs)
                error(`Too many requests. Please wait ${secs}s.`)
                return
            }
         } catch { /* ignore */ }
         
         error('Too many requests. Please wait.')
      } else {
        error(err, 'Failed to resend code')
      }
    } finally {
      setSending(false)
    }
  }, [email, isCooling, cooldownSec, start, success, error, onSent])

  return { isSending, handleResend, isCooling, remaining }
}

export default useResendSignupCode
