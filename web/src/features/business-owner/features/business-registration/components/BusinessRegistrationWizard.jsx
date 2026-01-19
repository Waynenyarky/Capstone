import React, { useState, useEffect, useRef } from 'react'
import { Steps, Button, Card, Modal, Form, App } from 'antd'
import { FileTextOutlined, FormOutlined, UploadOutlined, BankOutlined, TeamOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import RequirementsChecklistStep from './RequirementsChecklistStep'
import BusinessRegistrationForm from './BusinessRegistrationForm'
import LGUDocumentsUploadStep from './LGUDocumentsUploadStep'
import BIRRegistrationStep from './BIRRegistrationStep'
import OtherAgenciesStep from './OtherAgenciesStep'
import ApplicationReviewStep from './ApplicationReviewStep'
import ApplicationStatusCard from './ApplicationStatusCard'
import { addBusiness, updateBusiness } from '../../../services/businessProfileService'
import { submitBusinessApplication } from '../services/businessRegistrationService'

const steps = [
  { 
    key: 'requirements', 
    title: 'Requirements', 
    description: 'Checklist',
    icon: <FileTextOutlined /> 
  },
  { 
    key: 'form', 
    title: 'Application Form', 
    description: 'Business Details',
    icon: <FormOutlined /> 
  },
  { 
    key: 'documents', 
    title: 'LGU Documents', 
    description: 'Upload Files',
    icon: <UploadOutlined /> 
  },
  { 
    key: 'bir', 
    title: 'BIR Registration', 
    description: 'BIR Info',
    icon: <BankOutlined /> 
  },
  { 
    key: 'agencies', 
    title: 'Other Agencies', 
    description: 'SSS, PhilHealth',
    icon: <TeamOutlined /> 
  },
  { 
    key: 'review', 
    title: 'Review', 
    description: 'Check Details',
    icon: <EyeOutlined /> 
  },
  { 
    key: 'submit', 
    title: 'Submit', 
    description: 'Final Step',
    icon: <CheckCircleOutlined /> 
  },
  { 
    key: 'status', 
    title: 'Status', 
    description: 'Track Progress',
    icon: <ClockCircleOutlined /> 
  }
]

export default function BusinessRegistrationWizard({ 
  businessId, 
  isNewBusiness, 
  formData, 
  onComplete,
  onSaveBusiness 
}) {
  const { message } = App.useApp()
  
  // Track actual business ID (updated after Step 2 save)
  const [actualBusinessId, setActualBusinessId] = useState(businessId)
  
  // Flag to prevent step reset when actively navigating
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Track last step change timestamp to prevent recent changes from being reset
  const lastStepChangeTimeRef = useRef(0)
  
  // Update actualBusinessId when businessId prop changes
  useEffect(() => {
    if (businessId && businessId !== 'new') {
      setActualBusinessId(businessId)
    } else if (businessId === 'new') {
      try {
        sessionStorage.removeItem('business_registration_wizard_step_new')
        sessionStorage.removeItem('business_registration_data_new')
        sessionStorage.removeItem('business_registration_lgu_documents_new')
        sessionStorage.removeItem('business_registration_bir_new')
        sessionStorage.removeItem('business_registration_agencies_new')
      } catch (e) {
        // Ignore storage errors
      }
      setCurrentStep(0)
    }
  }, [businessId])
  
  // Migrate data from "new" storage to actual businessId storage when business is created
  useEffect(() => {
    if (actualBusinessId && actualBusinessId !== 'new' && businessId === 'new') {
      // Migrate step from "new" to actual businessId
      try {
        const newStepKey = 'business_registration_wizard_step_new'
        const newDataKey = 'business_registration_data_new'
        const actualStepKey = `business_registration_wizard_step_${actualBusinessId}`
        const actualDataKey = `business_registration_data_${actualBusinessId}`
        
        // Migrate step
        const storedStep = sessionStorage.getItem(newStepKey)
        if (storedStep) {
          sessionStorage.setItem(actualStepKey, storedStep)
        }
        
        // Migrate application data
        const storedData = sessionStorage.getItem(newDataKey)
        if (storedData) {
          sessionStorage.setItem(actualDataKey, storedData)
        }
      } catch (e) {
        // Ignore migration errors
        console.warn('Failed to migrate data from "new" to actual businessId:', e)
      }
    }
  }, [actualBusinessId, businessId])
  
  // Storage key for persisting current step (per business)
  const storageKey = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
  
  // Storage key for persisting application data (per business)
  const dataStorageKey = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_data_${actualBusinessId}` : 'business_registration_data_new'
  
  // Initialize step from storage or default to 0
  const getInitialStep = () => {
    try {
      const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
      const stored = sessionStorage.getItem(key)
      if (stored !== null) {
        const step = parseInt(stored, 10)
        if (step >= 0 && step < steps.length) {
          return step
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
    return 0
  }
  
  
  const [currentStep, setCurrentStep] = useState(getInitialStep)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  
  // Persist current step to storage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(currentStep))
    } catch (e) {
      // Ignore storage errors
    }
  }, [currentStep, storageKey])
  
  // Restore step from storage when businessId changes (only if no formData yet)
  useEffect(() => {
    if (!formData) {
      try {
        const stored = sessionStorage.getItem(storageKey)
        if (stored !== null) {
          const step = parseInt(stored, 10)
          if (step >= 0 && step < steps.length && step !== currentStep) {
            setCurrentStep(step)
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [businessId, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Responsive breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Initialize applicationData - will be restored from storage in useEffect after mount
  const [applicationData, setApplicationData] = useState({
    businessData: null,
    lguDocuments: null,
    birRegistration: null,
    otherAgencyRegistrations: null,
    referenceNumber: null,
    submittedAt: null
  })
  
  // Restore applicationData from sessionStorage on mount
  useEffect(() => {
    const restoreData = () => {
      try {
        // Try current businessId storage first
        const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_data_${actualBusinessId}` : 'business_registration_data_new'
        let stored = sessionStorage.getItem(key)
        
        // If not found and we're on a new business, try the "new" storage
        if (!stored && (actualBusinessId === 'new' || !actualBusinessId)) {
          stored = sessionStorage.getItem('business_registration_data_new')
        }
        
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') {
            const restoredData = {
              businessData: parsed.businessData || null,
              lguDocuments: parsed.lguDocuments || null,
              birRegistration: parsed.birRegistration || null,
              otherAgencyRegistrations: parsed.otherAgencyRegistrations || null,
              referenceNumber: parsed.referenceNumber || null,
              submittedAt: parsed.submittedAt || null
            }
            setApplicationData(restoredData)
            
            // If we're on step 1 (Application Form) and have business data, populate the form immediately
            if (currentStep === 1 && restoredData.businessData) {
              // Use setTimeout to ensure form is mounted
              setTimeout(() => {
                form.setFieldsValue(restoredData.businessData)
              }, 100)
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore application data from sessionStorage:', e)
      }
    }
    
    restoreData()
  }, [actualBusinessId]) // Restore when actualBusinessId changes
  
  // Populate form when applicationData.businessData is restored and we're on step 1
  useEffect(() => {
    if (currentStep === 1 && applicationData.businessData && Object.keys(applicationData.businessData).length > 0) {
      // Only set if form doesn't already have these values
      const currentFormValues = form.getFieldsValue()
      const hasEmptyForm = !currentFormValues.businessName && !currentFormValues.businessRegistrationNumber
      
      if (hasEmptyForm) {
        // Use requestAnimationFrame to ensure form is ready
        requestAnimationFrame(() => {
          form.setFieldsValue(applicationData.businessData)
        })
      }
    }
  }, [applicationData.businessData, currentStep, form])
  
  // Prevent step reset during active navigation
  useEffect(() => {
    if (isNavigating) {
      // Don't allow formData to reset step while navigating
      return
    }
  }, [isNavigating])
  
  // Persist application data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      // Get the correct storage key based on actualBusinessId
      const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_data_${actualBusinessId}` : 'business_registration_data_new'
      
      // Only save if there's actual data (not all null/empty)
      const hasData = Object.values(applicationData).some(val => val !== null && val !== undefined && val !== '')
      if (hasData) {
        // Convert dates to ISO strings for storage (handle dayjs objects too)
        const dataToStore = {
          ...applicationData,
          businessData: applicationData.businessData ? {
            ...applicationData.businessData,
            businessStartDate: applicationData.businessData.businessStartDate 
              ? (applicationData.businessData.businessStartDate instanceof Date 
                  ? applicationData.businessData.businessStartDate.toISOString()
                  : typeof applicationData.businessData.businessStartDate === 'string'
                  ? applicationData.businessData.businessStartDate
                  : applicationData.businessData.businessStartDate?.format?.('YYYY-MM-DD') || applicationData.businessData.businessStartDate)
              : null,
            incorporationDate: applicationData.businessData.incorporationDate
              ? (applicationData.businessData.incorporationDate instanceof Date
                  ? applicationData.businessData.incorporationDate.toISOString()
                  : typeof applicationData.businessData.incorporationDate === 'string'
                  ? applicationData.businessData.incorporationDate
                  : applicationData.businessData.incorporationDate?.format?.('YYYY-MM-DD') || applicationData.businessData.incorporationDate)
              : null
          } : null
        }
        sessionStorage.setItem(key, JSON.stringify(dataToStore))
      }
    } catch (e) {
      // Ignore storage errors (e.g., quota exceeded)
      console.warn('Failed to save application data to sessionStorage:', e)
    }
  }, [applicationData, actualBusinessId]) // Use actualBusinessId instead of dataStorageKey
  
  // Clear storage when businessId changes (different business)
  useEffect(() => {
    // This will run when actualBusinessId changes, clearing old business data
    // The new business data will be initialized from getInitialApplicationData
  }, [actualBusinessId])

  useEffect(() => {
    if (formData) {
      // Merge with existing applicationData to preserve all filled data
      // Priority: applicationData (recently saved) > formData (from backend) > stored applicationData (from sessionStorage)
      // IMPORTANT: Don't merge if we're actively navigating (documents might be in the process of being saved)
      if (isNavigating) {
        return // Skip merge during navigation to prevent overwriting recently saved documents
      }
      
      setApplicationData(prev => {
        // Helper to check if an object has meaningful data (has at least one non-empty URL)
        const hasData = (obj) => {
          if (!obj) return false
          if (typeof obj !== 'object') return false
          // Check if object has any non-empty string values (URLs)
          return Object.values(obj).some(val => {
            if (typeof val === 'string' && val.trim() !== '') return true
            // Also check nested objects (for BIR registration structure)
            if (val && typeof val === 'object') {
              return Object.values(val).some(nestedVal => 
                typeof nestedVal === 'string' && nestedVal.trim() !== ''
              )
            }
            return false
          })
        }
        
        // Helper to merge documents, preserving existing data if it has URLs
        const mergeDocuments = (prevDocs, formDocs) => {
          // ALWAYS prioritize prevDocs if it exists and has any data - it's more recent from user action
          if (prevDocs && typeof prevDocs === 'object') {
            // Check if prevDocs has any meaningful data
            const prevHasData = hasData(prevDocs)
            if (prevHasData) {
              // prevDocs has data, so keep it and only merge in new fields from formDocs
              if (formDocs && typeof formDocs === 'object' && hasData(formDocs)) {
                const merged = { ...prevDocs }
                // Only add new fields from formDocs that don't exist or are empty in prevDocs
                Object.keys(formDocs).forEach(key => {
                  const prevValue = merged[key]
                  const formValue = formDocs[key]
                  // Only overwrite if prevDocs value is empty/missing and formDocs has a non-empty value
                  if ((!prevValue || (typeof prevValue === 'string' && prevValue.trim() === '')) && 
                      formValue && typeof formValue === 'string' && formValue.trim() !== '') {
                    merged[key] = formValue
                  }
                })
                return merged
              }
              // prevDocs has data, formDocs doesn't or is empty, so return prevDocs
              return prevDocs
            }
          }
          // If prevDocs doesn't have data, use formDocs ONLY if it has actual data
          if (formDocs && typeof formDocs === 'object' && hasData(formDocs)) {
            return formDocs
          }
          // If neither has data, return prevDocs to preserve structure, or null
          return prevDocs || null
        }
        
        return {
          ...prev, // Preserve existing data from sessionStorage first
          // Merge with formData, but preserve applicationData if it has more recent data
          businessData: formData || prev.businessData,
          // Use mergeDocuments helper to properly preserve saved documents
          lguDocuments: mergeDocuments(prev.lguDocuments, formData.lguDocuments),
          birRegistration: mergeDocuments(prev.birRegistration, formData.birRegistration),
          otherAgencyRegistrations: mergeDocuments(prev.otherAgencyRegistrations, formData.otherAgencyRegistrations),
          referenceNumber: formData.applicationReferenceNumber || prev.referenceNumber,
          submittedAt: formData.submittedAt || prev.submittedAt
        }
      })
      
      // Only determine step based on status if we're not actively navigating
      // This prevents resetting the step when formData updates during navigation
      // Also check if step was changed recently (within last 3 seconds) to prevent resets
      const timeSinceLastStepChange = Date.now() - lastStepChangeTimeRef.current
      const stepChangedRecently = timeSinceLastStepChange < 3000 // 3 seconds
      
      if (!isNavigating && !stepChangedRecently) {
        // Determine current step based on application status (status takes priority over stored step)
        const status = formData.applicationStatus
        let statusBasedStep = null
        
        // Helper to check if business has meaningful data (not just empty fields)
        const hasBusinessData = (data) => {
          if (!data) return false
          // Check if business has at least one meaningful field filled
          return !!(data.businessName || data.registeredBusinessName || data.businessRegistrationNumber || 
                   data.businessType || data.businessAddress || data.ownerName)
        }
        
        if (status === 'submitted' || status === 'under_review' || status === 'approved' || status === 'rejected' || status === 'needs_revision') {
          statusBasedStep = 7 // Status step
        } else if (status === 'agencies_registered') {
          statusBasedStep = 5 // Review step
        } else if (status === 'bir_registered') {
          statusBasedStep = 4 // Agencies step
        } else if (status === 'documents_uploaded') {
          statusBasedStep = 3 // BIR step
        } else if (status === 'form_completed') {
          statusBasedStep = 2 // Documents step
        } else if (status === 'requirements_viewed') {
          statusBasedStep = 1 // Form step
        } else if (status === 'draft') {
          // For draft status, check if business has data
          // If it has business data, start from Application Form (step 1)
          // Otherwise, start from Requirements (step 0)
          if (hasBusinessData(formData) || hasBusinessData(applicationData.businessData)) {
            statusBasedStep = 1 // Application Form step (user has already started)
          } else {
            statusBasedStep = 0 // Requirements step (completely new)
          }
        }
        
        // Only update step if status-based step is determined and different from current
        // But NEVER reset if we're actively navigating or step changed recently
        if (statusBasedStep !== null && statusBasedStep !== currentStep && !isNavigating && !stepChangedRecently) {
          // ONLY update step based on status if it's going FORWARD (status suggests a later step)
          // NEVER go backwards based on status - this prevents resetting user's progress
          if (statusBasedStep > currentStep) {
            setCurrentStep(statusBasedStep)
            // Update timestamp when status-based step change occurs
            lastStepChangeTimeRef.current = Date.now()
          }
        }
      }
    } else if (!formData) {
      // If no formData yet, try to restore from storage
      try {
        const stored = sessionStorage.getItem(storageKey)
        if (stored !== null) {
          const step = parseInt(stored, 10)
          if (step >= 0 && step < steps.length && step !== currentStep) {
            setCurrentStep(step)
            lastStepChangeTimeRef.current = Date.now()
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [formData, businessId, storageKey, isNavigating, currentStep]) // Include isNavigating and currentStep to prevent resets

  const handleStepChange = (step) => {
    // Allow going back to previous steps
    if (step <= currentStep) {
      setCurrentStep(step)
      lastStepChangeTimeRef.current = Date.now()
    } else {
      // For going forward, allow if already completed or if submitted
      // Otherwise show warning (but don't block if user manually navigates)
      if (!isSubmitted) {
        message.warning('Please complete the current step before proceeding')
      } else {
        // Allow navigation if already submitted
        setCurrentStep(step)
      }
    }
  }

  const handleRequirementsConfirm = () => {
    setCurrentStep(1)
    lastStepChangeTimeRef.current = Date.now()
  }

  const handleFormSave = async (data) => {
    // Set navigating flag FIRST before ANY operations to prevent step reset
    // This must be set synchronously before any async operations
    setIsNavigating(true)
    
    try {
      setLoading(true)
      
      let result
      let actualBusinessId = businessId
      
      if (isNewBusiness) {
        result = await addBusiness(data)
        const registeredName = data.registeredBusinessName || data.businessName
        const newBusiness = result.businesses?.find(b => 
          (b.businessName === registeredName || b.registeredBusinessName === registeredName) &&
          b.businessRegistrationNumber === data.businessRegistrationNumber
        )
        if (newBusiness) {
          actualBusinessId = newBusiness.businessId
          // Update local state immediately
          setActualBusinessId(actualBusinessId)
          // Update businessId for subsequent steps
          if (onSaveBusiness) {
            onSaveBusiness(actualBusinessId)
          }
          // Update formData with the newly created business
          setApplicationData(prev => ({ 
            ...prev, 
            businessData: newBusiness,
            lguDocuments: newBusiness.lguDocuments || null
          }))
        }
      } else {
        result = await updateBusiness(businessId, data)
        if (onSaveBusiness) {
          onSaveBusiness(businessId)
        }
        // Update formData with updated business
        const updatedBusiness = result.businesses?.find(b => b.businessId === businessId)
        if (updatedBusiness) {
          setApplicationData(prev => ({ 
            ...prev, 
            businessData: updatedBusiness,
            lguDocuments: updatedBusiness.lguDocuments || prev.lguDocuments
          }))
        } else {
          setApplicationData(prev => ({ ...prev, businessData: data }))
        }
      }
      
      // Move to next step IMMEDIATELY after data is saved
      const nextStep = 2 // Step 2 = Documents Upload
      
      // Save step to storage FIRST to prevent any reset
      try {
        const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
        sessionStorage.setItem(key, String(nextStep))
      } catch (e) {
        // Ignore storage errors
      }
      
      // Set step immediately - isNavigating flag will prevent reset
      setCurrentStep(nextStep)
      
      // Record step change timestamp for additional protection
      lastStepChangeTimeRef.current = Date.now()
      
      message.success('Business information saved successfully')
      
      // Clear navigating flag after a longer delay to ensure formData update completes without resetting step
      // Increased to 3000ms to account for refreshBusinesses() call in parent
      setTimeout(() => {
        setIsNavigating(false)
      }, 3000) // Increased delay to ensure all formData updates complete
    } catch (error) {
      console.error('Failed to save business:', error)
      // Reset navigating flag on error so user can try again
      setIsNavigating(false)
      message.error(error.message || 'Failed to save business information')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentsSave = (documents) => {
    // Preserve documents data when navigating
    console.log('handleDocumentsSave - Received documents:', documents)
    if (documents) {
      // Filter out empty strings and ensure we only save documents with valid URLs
      const validDocuments = {}
      Object.keys(documents).forEach(key => {
        const url = documents[key]
        if (url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null') {
          validDocuments[key] = url
        }
      })
      
      // Only update if we have at least one valid document
      if (Object.keys(validDocuments).length > 0) {
        setApplicationData(prev => {
          const updated = {
            ...prev,
            lguDocuments: { ...prev.lguDocuments, ...validDocuments } // Merge to preserve existing documents
          }
          console.log('handleDocumentsSave - Updated applicationData.lguDocuments:', updated.lguDocuments)
          return updated
        })
      } else {
        console.warn('handleDocumentsSave - No valid documents to save:', documents)
      }
    }
    // Set navigating flag BEFORE step change to prevent reset
    setIsNavigating(true)
    // Move to next step
    const nextStep = 3
    setCurrentStep(nextStep)
    lastStepChangeTimeRef.current = Date.now()
    // Save step to storage immediately
    try {
      const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
      sessionStorage.setItem(key, String(nextStep))
    } catch (e) {
      // Ignore storage errors
    }
    // Clear navigating flag after a delay to allow formData to update
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }

  const handleDocumentsSaveFromModal = (documents) => {
    if (documents) {
      const validDocuments = {}
      Object.keys(documents).forEach(key => {
        const url = documents[key]
        if (url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null') {
          validDocuments[key] = url
        }
      })
      if (Object.keys(validDocuments).length > 0) {
        setApplicationData(prev => ({
          ...prev,
          lguDocuments: { ...prev.lguDocuments, ...validDocuments }
        }))
      }
    }
  }

  const handleBIRSave = (birData) => {
    // Preserve BIR registration data when navigating
    console.log('handleBIRSave - Received birData:', birData)
    if (birData) {
      // Filter out empty strings for URL fields and ensure we only save valid data
      const validBirData = { ...birData }
      const urlFields = ['certificateUrl', 'booksOfAccountsUrl', 'authorityToPrintUrl']
      urlFields.forEach(field => {
        const url = validBirData[field]
        if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
          // Keep the field but ensure it's a valid empty string (don't delete it)
          validBirData[field] = ''
        }
      })
      
      setApplicationData(prev => {
        const updated = {
          ...prev,
          birRegistration: { ...prev.birRegistration, ...validBirData } // Merge to preserve existing data
        }
        console.log('handleBIRSave - Updated applicationData.birRegistration:', updated.birRegistration)
        return updated
      })
    }
    // Set navigating flag BEFORE step change to prevent reset
    setIsNavigating(true)
    // Move to next step
    const nextStep = 4
    setCurrentStep(nextStep)
    lastStepChangeTimeRef.current = Date.now()
    // Save step to storage immediately
    try {
      const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
      sessionStorage.setItem(key, String(nextStep))
    } catch (e) {
      // Ignore storage errors
    }
    // Clear navigating flag after a delay to allow formData to update
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }

  const handleBIRSaveFromModal = (birData) => {
    if (birData) {
      const validBirData = { ...birData }
      const urlFields = ['certificateUrl', 'booksOfAccountsUrl', 'authorityToPrintUrl']
      urlFields.forEach(field => {
        const url = validBirData[field]
        if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
          validBirData[field] = ''
        }
      })
      setApplicationData(prev => ({
        ...prev,
        birRegistration: { ...prev.birRegistration, ...validBirData }
      }))
    }
  }

  const handleAgenciesSave = (agencyData) => {
    // Preserve other agency registrations data when navigating
    if (agencyData) {
      setApplicationData(prev => ({
        ...prev,
        otherAgencyRegistrations: agencyData
      }))
    }
    // Set navigating flag BEFORE step change to prevent reset
    setIsNavigating(true)
    // Move to next step
    const nextStep = 5
    setCurrentStep(nextStep)
    lastStepChangeTimeRef.current = Date.now()
    // Save step to storage immediately
    try {
      const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
      sessionStorage.setItem(key, String(nextStep))
    } catch (e) {
      // Ignore storage errors
    }
    // Clear navigating flag after a delay to allow formData to update
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }

  const handleAgenciesSaveFromModal = (agencyData) => {
    if (agencyData) {
      setApplicationData(prev => ({
        ...prev,
        otherAgencyRegistrations: agencyData
      }))
    }
  }

  const handleBusinessSaveFromModal = async (data) => {
    const targetBusinessId = actualBusinessId || businessId
    if (!targetBusinessId || targetBusinessId === 'new') {
      throw new Error('Please complete Step 2 (Application Form) first to create your business before editing.')
    }
    try {
      setLoading(true)
      const result = await updateBusiness(targetBusinessId, data)
      const updatedBusiness = result.businesses?.find(b => b.businessId === targetBusinessId) || data
      setApplicationData(prev => ({
        ...prev,
        businessData: updatedBusiness
      }))
      if (onSaveBusiness) {
        await onSaveBusiness(targetBusinessId)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReviewEdit = (stepIndex) => {
    setCurrentStep(stepIndex - 1) // Step 2 = index 1, Step 3 = index 2, etc.
  }

  const handleFinalSubmit = async () => {
    try {
      setLoading(true)
      const result = await submitBusinessApplication(businessId)
      
      setApplicationData(prev => ({
        ...prev,
        referenceNumber: result.referenceNumber,
        submittedAt: result.submittedAt
      }))
      
      Modal.success({
        title: 'Application Submitted Successfully',
        content: (
          <div>
            <p>Your application has been submitted to the LGU Officer for permit verification.</p>
            <p><strong>Reference Number: {result.referenceNumber}</strong></p>
            <p>Please keep this reference number for tracking your application status.</p>
          </div>
        ),
        width: 500,
        onOk: () => {
          setCurrentStep(7) // Go to status step
          lastStepChangeTimeRef.current = Date.now()
          if (onComplete) onComplete()
        }
      })
    } catch (error) {
      console.error('Failed to submit application:', error)
      message.error(error.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      // Set navigating flag to prevent step reset
      setIsNavigating(true)
      setCurrentStep(nextStep)
      lastStepChangeTimeRef.current = Date.now()
      // Save step to storage immediately
      try {
        const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
        sessionStorage.setItem(key, String(nextStep))
      } catch (e) {
        // Ignore storage errors
      }
      // Clear navigating flag after a delay
      setTimeout(() => {
        setIsNavigating(false)
      }, 1000)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      lastStepChangeTimeRef.current = Date.now()
      lastStepChangeTimeRef.current = Date.now()
      // Save step to storage when going back
      try {
        const key = actualBusinessId && actualBusinessId !== 'new' ? `business_registration_wizard_step_${actualBusinessId}` : 'business_registration_wizard_step_new'
        sessionStorage.setItem(key, String(prevStep))
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  const hasValidDocumentUrls = (docs) => {
    if (!docs || typeof docs !== 'object') return false
    return Object.values(docs).some(url => 
      url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null'
    )
  }

  const hasMeaningfulBirRegistration = (birData) => {
    if (!birData || typeof birData !== 'object') return false
    if (hasValidDocumentUrls(birData)) return true
    const textFields = ['registrationNumber']
    const numberFields = ['registrationFee', 'documentaryStampTax', 'businessCapital']
    const hasText = textFields.some(field => {
      const value = birData[field]
      return typeof value === 'string' && value.trim() !== ''
    })
    const hasNumber = numberFields.some(field => {
      const value = birData[field]
      return typeof value === 'number' && Number.isFinite(value) && value > 0
    })
    return hasText || hasNumber
  }

  const effectiveLguDocuments = hasValidDocumentUrls(applicationData.lguDocuments)
    ? applicationData.lguDocuments
    : formData?.lguDocuments

  const getStoredLguDocuments = () => {
    try {
      const key = `business_registration_lgu_documents_${actualBusinessId || businessId || 'new'}`
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  }

  const storedLguDocuments = getStoredLguDocuments()
  const effectiveLguDocumentsWithStorage = hasValidDocumentUrls(effectiveLguDocuments)
    ? effectiveLguDocuments
    : (hasValidDocumentUrls(storedLguDocuments) ? storedLguDocuments : effectiveLguDocuments)

  const effectiveBirRegistration = hasMeaningfulBirRegistration(applicationData.birRegistration)
    ? applicationData.birRegistration
    : formData?.birRegistration

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Requirements
        return (
          <RequirementsChecklistStep
            businessId={businessId}
            onConfirm={handleRequirementsConfirm}
            onNext={handleRequirementsConfirm}
          />
        )
      
      case 1: // Application Form
        return (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              // Auto-save form values to applicationData as user types
              setApplicationData(prev => ({
                ...prev,
                businessData: { ...prev.businessData, ...allValues }
              }))
            }}
          >
            <BusinessRegistrationForm
              form={form}
              initialValues={applicationData.businessData || formData}
              onValuesChange={() => {}}
            />
          </Form>
        )
      
      case 2: // Documents
        return (
          <LGUDocumentsUploadStep
            businessId={actualBusinessId || businessId}
            businessType={applicationData.businessData?.businessType || formData?.businessType}
            initialDocuments={effectiveLguDocumentsWithStorage}
            onSave={handleDocumentsSave}
            onNext={handleDocumentsSave}
          />
        )
      
      case 3: // BIR
        return (
          <BIRRegistrationStep
            businessId={actualBusinessId || businessId}
            initialData={effectiveBirRegistration}
            onSave={handleBIRSave}
            onNext={handleBIRSave}
          />
        )
      
      case 4: // Agencies
        return (
          <OtherAgenciesStep
            businessId={actualBusinessId || businessId}
            initialData={applicationData.otherAgencyRegistrations}
            onSave={handleAgenciesSave}
            onNext={handleAgenciesSave}
          />
        )
      
      case 5: // Review
        // Prioritize applicationData over formData for documents since applicationData is updated immediately when saved
        // Only fall back to formData if applicationData doesn't have valid documents
        let reviewLguDocuments = null
        if (hasValidDocumentUrls(effectiveLguDocumentsWithStorage)) {
          reviewLguDocuments = effectiveLguDocumentsWithStorage
        }
        
        let reviewBirRegistration = null
        if (applicationData.birRegistration && hasValidDocumentUrls(applicationData.birRegistration)) {
          reviewBirRegistration = applicationData.birRegistration
        } else if (formData?.birRegistration && hasValidDocumentUrls(formData.birRegistration)) {
          reviewBirRegistration = formData.birRegistration
        } else if (applicationData.birRegistration) {
          // Even if no URLs, keep the structure for other fields like registrationNumber
          reviewBirRegistration = applicationData.birRegistration
        } else if (formData?.birRegistration) {
          reviewBirRegistration = formData.birRegistration
        }
        
        const reviewOtherAgencies = applicationData.otherAgencyRegistrations || formData?.otherAgencyRegistrations || null
        
        // Debug logging to track what data is being passed
        console.log('Review Step - applicationData.lguDocuments:', applicationData.lguDocuments)
        console.log('Review Step - applicationData.birRegistration:', applicationData.birRegistration)
        console.log('Review Step - formData?.lguDocuments:', formData?.lguDocuments)
        console.log('Review Step - formData?.birRegistration:', formData?.birRegistration)
        console.log('Review Step - Final lguDocuments passed:', reviewLguDocuments)
        console.log('Review Step - Final birRegistration passed:', reviewBirRegistration)
        
        return (
          <ApplicationReviewStep
            businessData={applicationData.businessData || formData}
            lguDocuments={reviewLguDocuments}
            birRegistration={reviewBirRegistration}
            otherAgencyRegistrations={reviewOtherAgencies}
            onEdit={handleReviewEdit}
            businessId={actualBusinessId || businessId}
            onDocumentsSave={handleDocumentsSaveFromModal}
            onBIRSave={handleBIRSaveFromModal}
            onAgenciesSave={handleAgenciesSaveFromModal}
            onBusinessSave={handleBusinessSaveFromModal}
          />
        )
      
      case 6: // Submit
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
              <h2>Ready to Submit</h2>
              <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>
                Review all information and submit your application to the LGU Officer for permit verification.
              </p>
              <Button
                type="primary"
                size="large"
                onClick={handleFinalSubmit}
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Submit Application
              </Button>
            </div>
          </Card>
        )
      
      case 7: // Status
        return (
          <ApplicationStatusCard
            businessId={businessId}
            status={formData?.applicationStatus}
            referenceNumber={applicationData.referenceNumber || formData?.applicationReferenceNumber}
            submittedAt={applicationData.submittedAt || formData?.submittedAt}
          />
        )
      
      default:
        return <div>Unknown step</div>
    }
  }

  // Don't allow navigation to steps after submission if already submitted
  const isSubmitted = formData?.applicationStatus === 'submitted' || 
                     formData?.applicationStatus === 'under_review' ||
                     formData?.applicationStatus === 'approved' ||
                     formData?.applicationStatus === 'rejected' ||
                     formData?.applicationStatus === 'needs_revision'

  return (
    <div style={{ padding: isMobile ? '8px' : '16px' }}>
      <Card>
        <Steps
          current={currentStep}
          onChange={isSubmitted && currentStep < 7 ? undefined : handleStepChange}
          direction={isMobile ? 'vertical' : 'horizontal'}
          items={steps.map((step, index) => ({
            ...step,
            icon: React.cloneElement(step.icon, { 
              style: { fontSize: isMobile ? '12px' : '14px' } 
            }),
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
          }))}
          size={isMobile ? 'small' : 'default'}
          style={{ 
            marginBottom: isMobile ? 24 : 32,
            padding: isMobile ? '0 8px' : '0 16px'
          }}
        />

        <div style={{ 
          minHeight: isMobile ? 300 : 400,
          padding: isMobile ? '8px' : '16px'
        }}>
          {renderStepContent()}
        </div>

        {currentStep < 6 && !isSubmitted && (
          <div style={{ 
            marginTop: isMobile ? 24 : 32, 
            display: 'flex', 
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0
          }}>
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              size={isMobile ? 'middle' : 'large'}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Previous
            </Button>
            <div>
              {currentStep === 1 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={async () => {
                    try {
                      const values = await form.validateFields()
                      await handleFormSave(values)
                    } catch (error) {
                      if (!error.errorFields) {
                        message.error('Please fill in all required fields')
                      }
                    }
                  }}
                  loading={loading}
                >
                  Save and Continue
                </Button>
              )}
              {currentStep === 5 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNext}
                >
                  Proceed to Submit
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
