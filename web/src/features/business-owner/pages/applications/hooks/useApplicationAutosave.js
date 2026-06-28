import { useEffect, useRef, useCallback, useState } from 'react'
import { message } from 'antd'
import { getObjectHash } from '@/lib/deepEqual.js'

const DEFAULT_AUTOSAVE_DELAY_MS = 5000
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff

export default function useApplicationAutosave(formValues, onSave, enabled = true, options = {}, hasUnsavedChanges = false, onSaved = null) {
  const timerRef = useRef(null)
  const lastSavedHashRef = useRef(null)
  const isSavingRef = useRef(false)
  const retryCountRef = useRef(0)
  const [isSaving, setIsSaving] = useState(false)
  const abortControllerRef = useRef(null)
  const formValuesRef = useRef(formValues)
  const isScheduledRef = useRef(false)
  const prevHasUnsavedChangesRef = useRef(false)
  const performSaveRef = useRef(null)

  // Keep formValuesRef in sync
  useEffect(() => {
    formValuesRef.current = formValues
  }, [formValues])

  const { delayMs = DEFAULT_AUTOSAVE_DELAY_MS } = options

  const performSave = useCallback(async (values, attempt = 0) => {
    // Check if aborted
    if (abortControllerRef.current?.signal.aborted) {
      return
    }

    isSavingRef.current = true
    setIsSaving(true)
    try {
      await onSave(values)
      lastSavedHashRef.current = getObjectHash(values)
      retryCountRef.current = 0
      // Notify parent that save completed successfully
      onSaved?.()
    } catch (err) {
      console.error('Autosave failed:', err)

      if (attempt < MAX_RETRIES - 1 && !abortControllerRef.current?.signal.aborted) {
        // Retry with exponential backoff
        const delay = RETRY_DELAYS[attempt]
        await new Promise(resolve => setTimeout(resolve, delay))
        return performSaveRef.current(values, attempt + 1)
      } else {
        // All retries exhausted, show error toast
        message.error('Autosave failed. Please save manually.')
        retryCountRef.current = 0
      }
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [onSave, onSaved])

  // Keep performSaveRef in sync
  performSaveRef.current = performSave

  // Trigger autosave when hasUnsavedChanges becomes true
  useEffect(() => {
    // Only schedule when hasUnsavedChanges transitions from false to true
    if (prevHasUnsavedChangesRef.current === hasUnsavedChanges) {
      return
    }
    prevHasUnsavedChangesRef.current = hasUnsavedChanges

    if (!enabled || !hasUnsavedChanges) {
      isScheduledRef.current = false
      return
    }

    if (isSavingRef.current) {
      return // Already saving, don't schedule
    }

    if (isScheduledRef.current) {
      return // Already scheduled, don't re-schedule
    }

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    isScheduledRef.current = true
    // Schedule new save
    timerRef.current = setTimeout(() => {
      isScheduledRef.current = false
      performSaveRef.current(formValuesRef.current)
    }, delayMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      // Don't reset isScheduledRef here - let it persist across effect re-runs
    }
  }, [hasUnsavedChanges, enabled, delayMs])

  // Navigation protection - warn user if unsaved changes
  useEffect(() => {
    if (!enabled) return undefined

    const handleBeforeUnload = (e) => {
      const currentHash = getObjectHash(formValues)
      if (lastSavedHashRef.current && currentHash !== lastSavedHashRef.current) {
        e.preventDefault()
        e.returnValue = '' // Chrome requires returnValue to be set
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formValues, enabled])

  return { isSaving }
}
