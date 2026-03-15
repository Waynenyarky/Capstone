import { useState } from 'react'
import { App } from 'antd'
import { addBusiness, updateBusiness } from '../services/businessProfileService'

function useBusinessFormSubmit({
  isEditing,
  editingBusiness,
  registrationType,
  generalPermitCategory,
  documentCids,
  formDefinition,
  onSubmitted,
  draftBusinessId,
  setDraftBusinessId,
  setSubmitted,
  setHasUnsavedChanges
}) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (values, isFinalSubmit = false) => {
    if (!formDefinition) {
      message.error('Form definition not loaded. Please try again.')
      return
    }

    setSubmitting(true)
    setError(null)

    // Try to extract business name from various possible fields
    // For general permits, the field is 'activityName' not 'businessName'
    const businessName = values.businessName || 
                        values.registeredBusinessName || 
                        values['Business / trade name'] ||
                        values.businessTradeName ||
                        values.activityName ||
                        'Business Application'

    // Extract CIDs from file fields in form values and merge into documentCids.
    // File fields are stored as [{uid, name, status, cid}] by DynamicFormRenderer's customRequest.
    // These arrays contain File blobs that get lost during JSON serialization, so we also
    // replace them in formData with the CID string for persistence.
    const mergedCids = { ...documentCids }
    const cleanedValues = { ...values }
    const allFields = (formDefinition?.sections || []).flatMap(s => s.items || [])

    allFields.forEach((field) => {
      if (field.type !== 'file') return
      const key = field.key || field.label
      if (!key) return
      const val = values[key]
      if (Array.isArray(val) && val.length > 0) {
        const first = val[0]
        const cid = first?.cid || first?.ipfsCid || first?.response?.cid || first?.response?.ipfsCid
        if (cid && typeof cid === 'string' && cid.trim()) {
          mergedCids[field.documentKey || key] = cid.trim()
          // Store CID string in formData so it persists on backend
          cleanedValues[key] = cid.trim()
        }
        const url = first?.url || first?.response?.url
        if (!cid && url && typeof url === 'string') {
          mergedCids[field.documentKey || key] = url.trim()
          cleanedValues[key] = url.trim()
        }
      }
    })

    const payload = {
      businessName,
      formType: registrationType,
      category: generalPermitCategory,
      formData: cleanedValues,
      documentCids: mergedCids,
      applicationStatus: isFinalSubmit ? 'submitted' : 'draft',
    }

    if (isFinalSubmit) {
      payload.submittedAt = new Date().toISOString()
    }

    try {
      let response
      // Use draftBusinessId if available (draft was already created), otherwise check isEditing
      const existingBusinessId = editingBusiness?.businessId || editingBusiness?._id || draftBusinessId
      
      if (isEditing || existingBusinessId) {
        if (!existingBusinessId) {
          throw new Error('No business ID found for update')
        }
        response = await updateBusiness(existingBusinessId, payload)
      } else {
        response = await addBusiness(payload)
        if (response.businessId) {
          setDraftBusinessId(response.businessId)
        }
      }

      if (isFinalSubmit) {
        setSubmitted(true)
        onSubmitted?.(response)
      } else {
        message.success('Draft saved successfully')
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      console.error('Failed to save business:', err)
      const errorMsg = err?.message || (isFinalSubmit ? 'Failed to submit application' : 'Failed to save draft')
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return { handleSubmit, submitting, error, setError }
}

export default useBusinessFormSubmit
