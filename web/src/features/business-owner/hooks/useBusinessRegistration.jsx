import { useState, useEffect, useCallback } from 'react'
import { Form, message, Modal } from 'antd'
import { getBusinessProfile, updateBusinessProfile } from '../services/businessProfileService'

// Use Vite proxy in development (works in Codespaces), direct URL in production
const AI_SERVICE_URL = import.meta.env.DEV ? '/ai' : (import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3005')

export function useBusinessRegistration({ onComplete } = {}) {
  const [currentStep, setCurrentStep] = useState(0) 
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [verificationPending, setVerificationPending] = useState(false)
  const [form] = Form.useForm()
  
  // Watch values for conditional rendering/uploads
  const idFileUrl = Form.useWatch('idFileUrl', form)
  const idFileBackUrl = Form.useWatch('idFileBackUrl', form)

  const steps = [
    { key: 'welcome', title: 'Welcome' },
    { key: 'identity', title: 'Identity' },
    { key: 'mfa', title: 'Security' },
    { key: 'consent', title: 'Legal' },
  ]

  const fetchProfile = useCallback(async (isInitialLoad = false) => {
    try {
      setFetching(true)
      const data = await getBusinessProfile()
      if (data) {
        setProfileData(data)
        // Only reset to Welcome step on initial load, not on subsequent refreshes
        if (isInitialLoad) {
          setCurrentStep(0)
        }
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load profile')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile(true) // Initial load - reset to step 0
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
      const raw = profileData[key]

      if (key === 'ownerIdentity') {
        // Only restore idType if there are actual uploaded files, otherwise start fresh
        const hasUploadedFiles = raw.idFileUrl && raw.idFileUrl.length > 0
        const data = {
          idType: hasUploadedFiles ? (raw.idType ?? '') : '',
          idNumber: raw.idNumber ?? '',
          idFileUrl: !raw.idFileUrl ? [] : typeof raw.idFileUrl === 'string'
            ? [{ uid: '-1', name: 'Uploaded Document', status: 'done', url: raw.idFileUrl }]
            : Array.isArray(raw.idFileUrl) ? raw.idFileUrl : [raw.idFileUrl],
          idFileBackUrl: !raw.idFileBackUrl ? [] : typeof raw.idFileBackUrl === 'string'
            ? [{ uid: '-1', name: 'Uploaded Document', status: 'done', url: raw.idFileBackUrl }]
            : Array.isArray(raw.idFileBackUrl) ? raw.idFileBackUrl : [raw.idFileBackUrl]
        }
        form.setFieldsValue(data)
      } else {
        form.setFieldsValue(raw)
      }
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
      
      // For Identity step (step 1), verify AI check on uploaded ID BEFORE normalizing files
      if (currentStep === 1) {
        const idFileList = form.getFieldValue('idFileUrl')
        if (idFileList && idFileList.length > 0) {
          const file = idFileList[0]
          
          // If it's a new upload (has originFileObj), verify it
          if (file.originFileObj) {
            try {
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(file.originFileObj)
              })

              // Call AI verification
              const verifyResponse = await fetch(`${AI_SERVICE_URL}/id-verification/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  frontImageBase64: base64,
                }),
              })

              if (verifyResponse.ok) {
                const verifyResult = await verifyResponse.json()
                
                if (!verifyResult.legit) {
                  // Block proceeding if AI says ID is not legitimate
                  Modal.error({
                    title: 'ID Verification Failed',
                    content: (
                      <div>
                        <p>Our system could not verify that the uploaded image is a legitimate government ID.</p>
                        <p><strong>Confidence Score:</strong> {Math.round(verifyResult.confidence * 100)}%</p>
                        <p style={{ marginTop: 16 }}>Please ensure you upload:</p>
                        <ul style={{ marginLeft: 16 }}>
                          <li>A clear, readable photo of a valid government-issued ID</li>
                          <li>The full document is visible (no cropping)</li>
                          <li>Good lighting with no glare or blur</li>
                        </ul>
                      </div>
                    ),
                    okText: 'Try Again',
                  })
                  setLoading(false)
                  return
                }
                
                // Verification passed
                message.success('ID verification passed!')
              } else {
                // AI service returned an error response
                throw new Error('AI service returned an error')
              }
            } catch (verifyErr) {
              console.warn('AI verification check failed:', verifyErr)
              // Show warning when AI service is unavailable
              const proceed = await new Promise((resolve) => {
                Modal.confirm({
                  title: 'Verification Service Unavailable',
                  content: (
                    <div>
                      <p>The ID verification service is currently unavailable.</p>
                      <p>You can proceed, but your application will require manual review by an officer.</p>
                      <p style={{ color: '#faad14', marginTop: 8 }}>This may delay your application processing.</p>
                    </div>
                  ),
                  okText: 'Proceed Without Verification',
                  cancelText: 'Try Again Later',
                  onOk: () => resolve(true),
                  onCancel: () => resolve(false),
                })
              })

              if (!proceed) {
                setLoading(false)
                return
              }
            }
          }
        }
      }
      
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
    profileData, // Expose profile data for AI verification status
    handleNext,
    handlePrev,
    handleStepClick,
    refreshProfile: () => fetchProfile(false) // Expose refresh function (doesn't reset step)
  }
}
