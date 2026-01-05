import { useState, useEffect, useCallback, useRef } from 'react'

export function useCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef(null)

  const start = useCallback((secs = seconds) => {
    setRemaining(secs)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return r - 1
      })
    }, 1000)
  }, [seconds])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return { remaining, isCooling: remaining > 0, start }
}

export default useCooldown
