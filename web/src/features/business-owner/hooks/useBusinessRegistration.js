import { useState, useEffect, useCallback } from 'react'
import { Form, message } from 'antd'
import dayjs from 'dayjs'
import { getBusinessProfile, updateBusinessProfile } from '../services/businessProfileService'

export function useBusinessRegistration({ onComplete } = {}) {
  const [currentStep, setCurrentStep] = useState(0) 
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [form] = Form.useForm()
  
  // Watch values for conditional rendering/uploads
  const idFileUrl = Form.useWatch('idFileUrl', form)
  const idFileBackUrl = Form.useWatch('idFileBackUrl', form)

  const steps = [
    { key: 'welcome', title: 'Welcome', description: 'Start' },
    { key: 'identity', title: 'Identity', description: 'Personal' },
    { key: 'mfa', title: 'Security', description: 'MFA Setup' },
    { key: 'consent', title: 'Legal', description: 'Consent' },
  ]

  const fetchProfile = useCallback(async () => {
    try {
      setFetching(true)
      const data = await getBusinessProfile()
      if (data) {
        setProfileData(data)
        // Always start at Welcome step (Step 0) - user can navigate to previous steps if needed
        setCurrentStep(0)
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load profile')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Populate form when step or data changes
  useEffect(() => {
    if (!profileData) return
    
    // Map current step index to data key
    const stepKeys = [
      null, // Welcome
      'ownerIdentity', 
      null, // MFA (no data in BusinessProfile)
      'consent'
    ]
    
    const key = stepKeys[currentStep]
    if (key && profileData[key]) {
      const data = { ...profileData[key] }
      
      // Handle Date conversions
      if (data.dateOfBirth) {
        const date = dayjs(data.dateOfBirth)
        data.dateOfBirth = date.isValid() ? date : null
      }

      // Handle File URLs -> FileList for Upload components
      const fileFields = ['idFileUrl', 'idFileBackUrl']
      fileFields.forEach(field => {
        let val = data[field]
        if (!val) {
          data[field] = []
        } else if (typeof val === 'string') {
          data[field] = [{
            uid: '-1',
            name: 'Uploaded Document',
            status: 'done',
            url: val
          }]
        } else if (!Array.isArray(val)) {
          // Safety: If it's an object/file but not an array, wrap it
          data[field] = [val]
        }
      })
      
      form.setFieldsValue(data)
    } else {
      form.resetFields()
    }
  }, [currentStep, profileData, form])

  const handleNext = async () => {
    try {
      // Step 0 (Welcome) -> Just move next
      if (currentStep === 0) {
        setCurrentStep(1)
        window.scrollTo(0, 0)
        return
      }

      // Step 2 (MFA) -> Skip validation, just mark step complete
      if (currentStep === 2) {
        setLoading(true)
        const stepNumber = currentStep + 1 // Backend Step 3
        // MFA step doesn't save data to BusinessProfile, just marks progression
        const updated = await updateBusinessProfile(stepNumber, {})
        
        if (updated) {
          setProfileData(updated)
          if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1
            setCurrentStep(nextStep)
            window.scrollTo(0, 0)
          }
        }
        setLoading(false)
        return
      }

      const values = await form.validateFields()
      
      setLoading(true)
      
      // Normalize file uploads (Convert FileList back to URL string)
      const fileFields = ['idFileUrl', 'idFileBackUrl']
      fileFields.forEach(field => {
        const val = values[field]
        if (Array.isArray(val)) {
          if (val.length > 0) {
            const file = val[0]
            // If new upload, use response url. If existing, use url.
            values[field] = file.response?.url || file.url || ''
          } else {
            values[field] = ''
          }
        }
      })
      
      // Map UI Step to Backend Step
      // Identity(UI 1) -> Backend 2
      // MFA(UI 2) -> Backend 3 (handled above)
      // Consent(UI 3) -> Backend 4
      const stepNumber = currentStep + 1
      const updated = await updateBusinessProfile(stepNumber, values)
      
      if (updated) {
        setProfileData(updated)
        
        if (currentStep < steps.length - 1) {
          const nextStep = currentStep + 1
          setCurrentStep(nextStep)
          window.scrollTo(0, 0)
        } else {
          message.success('Registration submitted successfully!')
          if (onComplete) onComplete()
        }
      }
    } catch (err) {
      console.error(err)
      // Only show error if it's not a validation error
      if (!err.errorFields) {
        message.error('Failed to save step. Please check fields.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  return {
    currentStep,
    steps,
    loading,
    fetching,
    form,
    idFileUrl,
    idFileBackUrl,
    handleNext,
    handlePrev,
    handleStepClick
  }
}
