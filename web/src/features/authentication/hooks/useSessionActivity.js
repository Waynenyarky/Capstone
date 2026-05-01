import { useEffect } from 'react'
import { postSessionActivity } from '../services/sessionService.js'
import { useAuthSession } from './useAuthSession.js'

const ACTIVITY_THROTTLE_MS = 60 * 1000 // report activity at most once per minute

export function useSessionActivity(enabled = true) {
  const { currentUser } = useAuthSession()

  useEffect(() => {
    if (!enabled || !currentUser) return undefined

    let lastReported = 0

    const handler = () => {
      const now = Date.now()
      if (now - lastReported < ACTIVITY_THROTTLE_MS) return
      lastReported = now
      postSessionActivity().catch((err) => {
        if (err.status !== 401) {
          console.warn('session activity update failed', err)
        }
      })
    }

    window.addEventListener('mousemove', handler, { passive: true })
    window.addEventListener('keydown', handler, { passive: true })
    window.addEventListener('click', handler, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('click', handler)
    }
  }, [enabled, currentUser])
}
