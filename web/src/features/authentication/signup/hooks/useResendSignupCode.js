import { useState, useCallback } from 'react'
import { resendSignupCode } from '@/features/authentication/services'

export function useResendSignupCode({ email, cooldownSec = 60, onSent } = {}) {
  const [isSending, setIsSending] = useState(false)
  const [isCooling, setIsCooling] = useState(false)
  const [remaining, setRemaining] = useState(0)

  const handleResend = useCallback(async () => {
    if (isCooling || isSending) return
    try {
      setIsSending(true)
      const data = await resendSignupCode({ email })
      if (typeof onSent === 'function') {
        onSent(data)
      }
      setIsCooling(true)
      setRemaining(cooldownSec)
      const timer = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setIsCooling(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to resend signup code:', err)
      throw err
    } finally {
      setIsSending(false)
    }
  }, [email, cooldownSec, isCooling, isSending, onSent])

  return { isSending, handleResend, isCooling, remaining }
}
