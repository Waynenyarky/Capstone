import { useEffect, useRef } from 'react'
import { AUTOSAVE_DELAY_MS } from '../constants'

export default function usePermitFormsAutosave(cards, description, save, enabled = true) {
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined

    const current = JSON.stringify({ cards, description })
    if (current === lastSavedRef.current) return undefined

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      lastSavedRef.current = current
      save(cards, description)
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cards, description, save, enabled])
}
