import { useEffect, useState } from 'react'
import { postSessionActivity, invalidateAllSessions } from '../services/sessionService.js'

/**
 * Simple session timeout hook
 */
export function useSessionTimeout({ timeoutMs = 60 * 60 * 1000, warningMs = 2 * 60 * 1000, onTimeout, onWarning } = {}) {
  const [remaining, setRemaining] = useState(timeoutMs)

  useEffect(() => {
    let interval = null
    let warningFired = false

    const tick = () => {
      setRemaining((prev) => {
        const next = prev - 1000
        if (next <= warningMs && !warningFired) {
          warningFired = true
          onWarning?.()
        }
        if (next <= 0) {
          onTimeout?.()
          clearInterval(interval)
          invalidateAllSessions().catch(() => null)
          return 0
        }
        return next
      })
    }

    interval = setInterval(tick, 1000)
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [warningMs, onTimeout, onWarning])

  useEffect(() => {
    // refresh server activity on mount
    postSessionActivity().catch(() => null)
  }, [])

  return { remaining }
}
