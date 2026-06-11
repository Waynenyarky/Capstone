import { useState, useCallback } from 'react'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'

/**
 * Hook for loading form definitions
 */
export function useFormDefinitionLoader() {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState(null)

  const fetchFormDefinition = useCallback(async (type, category = null, isEditing = false, onSetFormDefinition, onSetStep, onSetActiveSectionIndex, onSetFormValues, form) => {
    setLoading(true)
    setLocalError(null)

    try {
      const response = await getActiveFormDefinition(type)

      if (response.success && response.definition) {
        onSetFormDefinition(response.definition)
        onSetActiveSectionIndex(-1)

        if (category && !isEditing) {
          onSetFormValues({ generalPermitCategory: category })
          form.setFieldValue('generalPermitCategory', category)
        }

        onSetStep('form')
      } else {
        setLocalError(response.error || 'No active form definition found for this type.')
      }
    } catch (err) {
      console.error('Failed to fetch form definition:', err)
      setLocalError(err.message || 'Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, localError, fetchFormDefinition }
}
