import { useEffect, useState } from 'react'

// expiresAt: ms since epoch
export default function useOtpCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(() => {
    if (!expiresAt) return null
    return Math.max(0, Math.ceil((Number(expiresAt) - Date.now()) / 1000))
  })

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null)
      return undefined
    }
    const update = () => {
      const secs = Math.max(0, Math.ceil((Number(expiresAt) - Date.now()) / 1000))
      setRemaining(secs)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = remaining === 0
  return { remaining, isExpired }
}
