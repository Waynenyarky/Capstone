import { useEffect, useRef, useState } from 'react'

const DRAFT_STORAGE_KEY = 'addBusinessFormDraft'

/**
 * Hook for persisting draft form data to localStorage
 */
export function useDraftPersistence(formValues, hasUnsavedChanges, registrationType, generalPermitCategory, isEditing, setRegistrationType, setGeneralPermitCategory, setFormValues, draftBusinessId, setDraftBusinessId) {
  const draftRestoredRef = useRef(false)
  const [restorationComplete, setRestorationComplete] = useState(false)

  // Restore draft from localStorage on initial mount (non-editing only)
  useEffect(() => {
    if (draftRestoredRef.current) return
    draftRestoredRef.current = true

    // If editing, no need to restore from localStorage - mark complete immediately
    if (isEditing) {
      setRestorationComplete(true)
      return
    }

    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) {
        setRestorationComplete(true)
        return
      }
      const draft = JSON.parse(raw)
      // Restore draftBusinessId FIRST to prevent race condition with autosave
      if (draft?.draftBusinessId && setDraftBusinessId) {
        setDraftBusinessId(draft.draftBusinessId)
      }
      // Then restore other data
      if (draft?.registrationType) setRegistrationType(draft.registrationType)
      if (draft?.generalPermitCategory) setGeneralPermitCategory(draft.generalPermitCategory)
      if (draft?.formValues && Object.keys(draft.formValues).length > 0) {
        setFormValues(draft.formValues)
      }
    } catch { /* ignore */ }
    // Mark restoration as complete after all state setters are called
    setRestorationComplete(true)
  }, [isEditing, setRegistrationType, setGeneralPermitCategory, setFormValues, setDraftBusinessId])

  // Clear localStorage when switching to editing mode (to prevent stale draft data)
  useEffect(() => {
    if (isEditing) {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [isEditing])

  // Persist draft to localStorage synchronously on form value changes
  // This ensures data is saved immediately, not waiting for effect execution
  useEffect(() => {
    if (isEditing || !hasUnsavedChanges) return
    // Don't persist until restoration is complete to avoid race conditions
    if (!restorationComplete) return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ registrationType, generalPermitCategory, formValues, draftBusinessId }))
    } catch { /* ignore */ }
  }, [formValues, hasUnsavedChanges, registrationType, generalPermitCategory, isEditing, draftBusinessId, restorationComplete])

  return { draftRestoredRef, restorationComplete, DRAFT_STORAGE_KEY }
}
