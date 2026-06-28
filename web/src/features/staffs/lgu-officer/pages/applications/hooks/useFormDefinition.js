import { useState, useEffect } from 'react'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'

export function useFormDefinition(appIdentifier, formDefId, formType, businessType) {
  const [formDefinition, setFormDefinition] = useState(null)
  const [formDefLoading, setFormDefLoading] = useState(false)

  useEffect(() => {
    if (!appIdentifier) {
      setFormDefinition(null)
      return
    }

    let cancelled = false
    setFormDefLoading(true)
    setFormDefinition(null)

    const fetchDef = async () => {
      try {
        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          const businessTypeToUse = businessType || 'all'
          res = await getActiveFormDefinition(formType, businessTypeToUse, null)
        }
        if (cancelled) return
        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        } else {
          console.error('Failed to load form definition - no valid response:', res)
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load form definition for review:', e)
      } finally {
        if (!cancelled) setFormDefLoading(false)
      }
    }
    fetchDef()
    return () => { cancelled = true }
  }, [appIdentifier, formDefId, formType, businessType])

  return { formDefinition, formDefLoading }
}
