import { useEffect, useRef } from 'react'

const AUTOSAVE_DELAY_MS = 5000

export default function useCmsAutosave(data, onSave, enabled = true) {
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Skip if data hasn't changed since last save
    if (lastSavedRef.current && JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return undefined
    }

    // Set new timer
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(data)
        lastSavedRef.current = data
      } catch (err) {
        console.error('Autosave failed:', err)
      }
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [data, onSave, enabled])
}
