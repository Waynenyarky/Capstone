import { useEffect, useRef } from 'react'

/**
 * Hook for auto-saving when switching between sections
 * @param {Object} params
 * @param {number} activeSectionIndex - Current active section index
 * @param {string} draftBusinessId - Draft business ID
 * @param {boolean} isEditing - Whether editing an existing application
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {boolean} submitting - Whether currently submitting
 * @param {boolean} formReadOnly - Whether form is read-only
 * @param {Object} form - Form instance
 * @param {Function} handleSubmit - Function to handle form submission
 */
export function useApplicationAutosaveSectionChange({
  activeSectionIndex,
  draftBusinessId,
  isEditing,
  hasUnsavedChanges,
  submitting,
  formReadOnly,
  form,
  handleSubmit,
}) {
  const previousSectionRef = useRef(-1)

  // Auto-save when switching sections
  useEffect(() => {
    // Skip auto-save if:
    // - Not editing/no draft exists yet
    // - Form is read-only
    // - No unsaved changes
    // - Still on the same section (initial render)
    // - Currently submitting
    if (!isEditing && !draftBusinessId) return
    if (formReadOnly) return
    if (!hasUnsavedChanges) return
    if (previousSectionRef.current === activeSectionIndex) return
    if (submitting) return

    // Don't save when going back to overview
    if (activeSectionIndex === -1) return

    // Auto-save when switching sections
    const autoSave = async () => {
      try {
        const values = form.getFieldsValue(true)
        await handleSubmit(values, false)
      } catch (err) {
        console.error('Autosave failed:', err)
      }
    }
    autoSave()
    previousSectionRef.current = activeSectionIndex
  }, [activeSectionIndex, isEditing, draftBusinessId, formReadOnly, hasUnsavedChanges, submitting, form, handleSubmit])
}
