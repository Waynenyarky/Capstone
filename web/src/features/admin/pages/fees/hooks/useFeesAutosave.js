import { useEffect, useRef, useState, useCallback } from 'react'
import { message } from 'antd'
import { getObjectHash } from '@/lib/deepEqual.js'

const AUTOSAVE_DELAY_MS = 5000
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]

export default function useFeesAutosave(data, onSave, enabled = true, hasUnsavedChanges = false, onSaved = null) {
  const timerRef = useRef(null)
  const lastSavedHashRef = useRef(null)
  const isSavingRef = useRef(false)
  const retryCountRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const abortControllerRef = useRef(null)
  const dataRef = useRef(data)
  const isScheduledRef = useRef(false)
  const prevHasUnsavedChangesRef = useRef(false)
  const performSaveRef = useRef(null)

  // Keep dataRef in sync
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const performSave = useCallback(async (values, attempt = 0) => {
    if (abortControllerRef.current?.signal.aborted) {
      return
    }

    isSavingRef.current = true
    setIsSaving(true)
    try {
      await onSave(values)
      lastSavedHashRef.current = getObjectHash(values)
      retryCountRef.current = 0
      setLastSavedAt(new Date())
      onSaved?.()
    } catch (err) {
      console.error('Autosave failed:', err)

      if (attempt < MAX_RETRIES - 1 && !abortControllerRef.current?.signal.aborted) {
        const delay = RETRY_DELAYS[attempt]
        await new Promise(resolve => setTimeout(resolve, delay))
        return performSaveRef.current(values, attempt + 1)
      } else {
        message.error('Autosave failed. Please save manually.')
        retryCountRef.current = 0
      }
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [onSave, onSaved])

  performSaveRef.current = performSave

  // Trigger autosave when hasUnsavedChanges becomes true
  useEffect(() => {
    if (prevHasUnsavedChangesRef.current === hasUnsavedChanges) {
      return
    }
    prevHasUnsavedChangesRef.current = hasUnsavedChanges

    if (!enabled || !hasUnsavedChanges) {
      isScheduledRef.current = false
      return
    }

    if (isSavingRef.current) {
      return
    }

    if (isScheduledRef.current) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    isScheduledRef.current = true
    timerRef.current = setTimeout(() => {
      isScheduledRef.current = false
      performSaveRef.current(dataRef.current)
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [hasUnsavedChanges, enabled])

  return { isSaving, lastSavedAt }
}
