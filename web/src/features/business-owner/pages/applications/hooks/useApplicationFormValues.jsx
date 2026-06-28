import { useCallback } from 'react'

/**
 * Hook for managing form values change handling
 * @param {Object} params
 * @param {Function} setFormValues - Function to set form values
 * @param {Function} setHasUnsavedChanges - Function to set unsaved changes flag
 * @param {Function} onFormDataChanged - Callback when form data changes
 * @returns {Object} Form values change handler
 */
export function useApplicationFormValues({
  setFormValues,
  setHasUnsavedChanges,
  onFormDataChanged,
}) {
  const handleFormValuesChange = useCallback(
    (changedValues, allValues) => {
      setFormValues(allValues)
      setHasUnsavedChanges(true)
      // Notify parent of form data changes for real-time progress updates
      if (onFormDataChanged) {
        onFormDataChanged(allValues)
      }
    },
    [setFormValues, setHasUnsavedChanges, onFormDataChanged]
  )

  return {
    handleFormValuesChange,
  }
}
