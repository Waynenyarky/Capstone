import { useCallback } from 'react'
import { addBusiness } from '../../../services/businessProfileService'
import { generateTestDataForDefinition, formDataWithDayjs } from '../../../utils/businessFormUtils'

/**
 * Hook for managing test data generation for permit applications
 * @param {Object} params
 * @param {Object} formDefinition - Form definition
 * @param {string} generalPermitCategory - General permit category
 * @param {Object} form - Form instance
 * @param {Function} setFormValues - Function to set form values
 * @param {boolean} isEditing - Whether editing an existing application
 * @param {string} draftBusinessId - Draft business ID
 * @param {Function} setDraftBusinessId - Function to set draft business ID
 * @param {string} registrationType - Registration type
 * @param {Object} message - Ant Design message API
 * @returns {Object} Test data handler
 */
export function useApplicationTestData({
  formDefinition,
  generalPermitCategory,
  form,
  setFormValues,
  isEditing,
  draftBusinessId,
  setDraftBusinessId,
  registrationType,
  message,
}) {
  const doFillTestData = useCallback(async () => {
    if (!formDefinition) {
      message.error('Form definition not loaded yet. Please wait a moment and try again.')
      return
    }
    const testData = generateTestDataForDefinition(formDefinition, generalPermitCategory)
    const processedTestData = formDataWithDayjs(testData, formDefinition)
    form.setFieldsValue(processedTestData)
    setFormValues((prev) => ({ ...prev, ...processedTestData }))

    // Create draft if one doesn't exist yet (so test data persists on refresh)
    if (!isEditing && !draftBusinessId) {
      try {
        const payload = {
          businessName: 'New Business Application',
          applicationStatus: 'draft',
          formType: registrationType,
          category: generalPermitCategory,
          formData: processedTestData,
        }
        const response = await addBusiness(payload)
        const businessId = response.businessId
        if (businessId) {
          setDraftBusinessId(businessId)
        }
      } catch (err) {
        console.error('Failed to create draft for test data:', err)
      }
    }

    message.success('Form filled with test data')
  }, [
    formDefinition,
    generalPermitCategory,
    form,
    message,
    isEditing,
    draftBusinessId,
    registrationType,
    setDraftBusinessId,
    setFormValues,
  ])

  return {
    doFillTestData,
  }
}
