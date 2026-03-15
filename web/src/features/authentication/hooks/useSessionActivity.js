import { useEffect } from 'react'
import { postSessionActivity } from '../services/sessionService.js'
import { useAuthSession } from './useAuthSession.js'

export function useSessionActivity(enabled = true) {
  const { currentUser } = useAuthSession()
  
  useEffect(() => {
    if (!enabled || !currentUser) return undefined

    let timeout
    const handler = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        postSessionActivity().catch((err) => {
          // Silently ignore session activity errors - they're not critical
          if (err.status !== 401) {
            console.warn('session activity update failed', err)
          }
        })
      }, 1000)
    }

    window.addEventListener('mousemove', handler)
    window.addEventListener('keydown', handler)
    window.addEventListener('click', handler)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('click', handler)
    }
  }, [enabled])
}
