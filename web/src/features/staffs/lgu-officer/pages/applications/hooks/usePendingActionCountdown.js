import { useState, useEffect } from 'react'

export function usePendingActionCountdown(pendingAction) {
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (!pendingAction?.expiresAt) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const expiresAt = new Date(pendingAction.expiresAt)
      const diff = expiresAt - now

      if (diff <= 0) {
        setCountdown(null)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [pendingAction?.expiresAt])

  return countdown
}
