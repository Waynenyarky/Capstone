import { useEffect } from 'react'
import { postSessionActivity } from '../services/sessionService.js'

export function useSessionActivity(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    let timeout
    const handler = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        postSessionActivity().catch((err) => console.warn('session activity update failed', err))
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
