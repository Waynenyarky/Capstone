import { useState, useEffect, useRef } from 'react'
import { App, Form } from 'antd'
import { addBusiness, updateBusiness } from '../../../services/businessProfileService'
import { submitBusinessApplication } from '../services/businessRegistrationService'
import { wizardSteps } from '../constants/wizardSteps.jsx'

export function useBusinessRegistrationWizard({
  businessId,
  isNewBusiness,
  formData,
  onComplete,
  onSaveBusiness
}) {
  const { message, modal } = App.useApp()

  const [actualBusinessId, setActualBusinessId] = useState(businessId)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastStepChangeTimeRef = useRef(0)
  const [currentStep, setCurrentStep] = useState(() => getInitialStep(businessId))
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)
  const [applicationData, setApplicationData] = useState({
    businessData: null,
    lguDocuments: null,
    birRegistration: null,
    otherAgencyRegistrations: null,
    referenceNumber: null,
    submittedAt: null
  })

  useEffect(() => {
    if (businessId && businessId !== 'new') {
      setActualBusinessId(businessId)
    } else if (businessId === 'new') {
      clearNewBusinessStorage()
      setCurrentStep(0)
    }
  }, [businessId])

  useEffect(() => {
    if (actualBusinessId && actualBusinessId !== 'new' && businessId === 'new') {
      migrateNewStorage(actualBusinessId)
    }
  }, [actualBusinessId, businessId])

  const storageKey = actualBusinessId && actualBusinessId !== 'new'
    ? `business_registration_wizard_step_${actualBusinessId}`
    : 'business_registration_wizard_step_new'

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(currentStep))
    } catch (e) {
      console.warn('Failed to persist step to sessionStorage:', e)
    }
  }, [currentStep, storageKey])

  useEffect(() => {
    if (!formData) {
      try {
        const stored = sessionStorage.getItem(storageKey)
        if (stored !== null) {
          const step = parseInt(stored, 10)
          if (step >= 0 && step < wizardSteps.length && step !== currentStep) {
            setCurrentStep(step)
          }
        }
      } catch (e) {
        console.warn('Failed to restore step from sessionStorage:', e)
      }
    }
  }, [businessId, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const restored = restoreApplicationData(actualBusinessId)
    if (!restored) return

    setApplicationData(restored)
    if (currentStep === 1 && restored.businessData) {
      setTimeout(() => {
        form.setFieldsValue(restored.businessData)
      }, 100)
    }
  }, [actualBusinessId]) // Restore when actualBusinessId changes

  useEffect(() => {
    if (currentStep === 1 && applicationData.businessData && Object.keys(applicationData.businessData).length > 0) {
      const currentFormValues = form.getFieldsValue()
      const hasEmptyForm = !currentFormValues.businessName && !currentFormValues.businessRegistrationNumber
      if (hasEmptyForm) {
        requestAnimationFrame(() => {
          form.setFieldsValue(applicationData.businessData)
        })
      }
    }
  }, [applicationData.businessData, currentStep, form])

  useEffect(() => {
    try {
      const key = actualBusinessId && actualBusinessId !== 'new'
        ? `business_registration_data_${actualBusinessId}`
        : 'business_registration_data_new'
      const hasData = Object.values(applicationData).some(
        (val) => val !== null && val !== undefined && val !== ''
      )
      if (hasData) {
        sessionStorage.setItem(key, JSON.stringify(serializeApplicationData(applicationData)))
      }
    } catch (e) {
      console.warn('Failed to save application data to sessionStorage:', e)
    }
  }, [applicationData, actualBusinessId])

  useEffect(() => {
    if (!formData) {
      restoreStepFromStorage(storageKey, currentStep, setCurrentStep, lastStepChangeTimeRef)
      return
    }
    if (isNavigating) return

    setApplicationData(prev => mergeFormData(prev, formData))
    updateStepFromStatus({
      formData,
      applicationData,
      currentStep,
      isNavigating,
      lastStepChangeTimeRef,
      setCurrentStep
    })
  }, [formData, businessId, storageKey, isNavigating, currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStepChange = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step)
      lastStepChangeTimeRef.current = Date.now()
      return
    }
    if (!isSubmitted(formData)) {
      message.warning('Please complete the current step before proceeding')
      return
    }
    setCurrentStep(step)
  }

  const handleRequirementsConfirm = () => {
    setCurrentStep(1)
    lastStepChangeTimeRef.current = Date.now()
  }

  const handleFormValuesChange = (_, allValues) => {
    setApplicationData(prev => ({
      ...prev,
      businessData: { ...prev.businessData, ...allValues }
    }))
  }

  const handleFormSave = async (data) => {
    setIsNavigating(true)
    try {
      setLoading(true)
      let result
      let resolvedBusinessId = businessId

      if (isNewBusiness) {
        result = await addBusiness(data)
        const registeredName = data.registeredBusinessName || data.businessName
        const newBusiness = result.businesses?.find(b =>
          (b.businessName === registeredName || b.registeredBusinessName === registeredName) &&
          b.businessRegistrationNumber === data.businessRegistrationNumber
        )
        if (newBusiness) {
          resolvedBusinessId = newBusiness.businessId
          setActualBusinessId(resolvedBusinessId)
          if (onSaveBusiness) onSaveBusiness(resolvedBusinessId)
          setApplicationData(prev => ({
            ...prev,
            businessData: newBusiness,
            lguDocuments: newBusiness.lguDocuments || null
          }))
        }
      } else {
        result = await updateBusiness(businessId, data)
        if (onSaveBusiness) onSaveBusiness(businessId)
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

      const nextStep = 2
      try {
        const key = resolvedBusinessId && resolvedBusinessId !== 'new'
          ? `business_registration_wizard_step_${resolvedBusinessId}`
          : 'business_registration_wizard_step_new'
        sessionStorage.setItem(key, String(nextStep))
      } catch (e) {
        console.warn('Failed to persist step after form save:', e)
      }

      setCurrentStep(nextStep)
      lastStepChangeTimeRef.current = Date.now()
      message.success('Business information saved successfully')
      setTimeout(() => setIsNavigating(false), 3000)
    } catch (error) {
      console.error('Failed to save business:', error)
      setIsNavigating(false)
      message.error(error.message || 'Failed to save business information')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    if (currentStep !== 1) {
      message.info('Please complete the Application Form step (Step 2) to save your draft.')
      return false
    }
    try {
      const values = form.getFieldsValue(true)
      const data = { ...(applicationData.businessData || {}), ...values }
      const draftPlaceholders = {
        businessName: data.businessName || data.registeredBusinessName || data.businessTradeName || 'Draft',
        registeredBusinessName: data.registeredBusinessName || data.businessName || data.businessTradeName || 'Draft',
        businessRegistrationNumber: (data.businessRegistrationNumber && String(data.businessRegistrationNumber).trim())
          ? data.businessRegistrationNumber
          : `DRAFT-${Date.now()}`,
        registrationAgency: data.registrationAgency || 'LGU'
      }
      const defaultGeo = { lat: 14.5995, lng: 120.9842 }
      const normalizedLocation = {
        ...(data.location || {}),
        geolocation: {
          ...defaultGeo,
          ...(data.location?.geolocation || {})
        }
      }
      const payload = { ...data, ...draftPlaceholders, location: normalizedLocation }
      if (isNewBusiness) {
        const result = await addBusiness(payload)
        const registeredName = payload.registeredBusinessName || payload.businessName
        const regNum = payload.businessRegistrationNumber
        const newBusiness = result.businesses?.find(
          (b) =>
            (b.businessName === registeredName || b.registeredBusinessName === registeredName) &&
            b.businessRegistrationNumber === regNum
        )
        if (newBusiness && onSaveBusiness) onSaveBusiness(newBusiness.businessId)
      } else {
        await updateBusiness(businessId, payload)
        if (onSaveBusiness) onSaveBusiness(businessId)
      }
      return true
    } catch (error) {
      console.error('Failed to save draft:', error)
      message.error(error?.message || 'Failed to save draft')
      return false
    }
  }

  const handleDocumentsSave = (documents) => {
    if (documents) {
      const validDocuments = filterValidUrls(documents)
      if (Object.keys(validDocuments).length > 0) {
        setApplicationData(prev => ({
          ...prev,
          lguDocuments: { ...prev.lguDocuments, ...validDocuments }
        }))
      }
    }
    advanceStep(3)
  }

  const handleDocumentsSaveFromModal = (documents) => {
    if (documents) {
      const validDocuments = filterValidUrls(documents)
      if (Object.keys(validDocuments).length > 0) {
        setApplicationData(prev => ({
          ...prev,
          lguDocuments: { ...prev.lguDocuments, ...validDocuments }
        }))
      }
    }
  }

  const handleBIRSave = (birData) => {
    if (birData) {
      const validBirData = normalizeBirData(birData)
      setApplicationData(prev => ({
        ...prev,
        birRegistration: { ...prev.birRegistration, ...validBirData }
      }))
    }
    advanceStep(4)
  }

  const handleBIRSaveFromModal = (birData) => {
    if (birData) {
      const validBirData = normalizeBirData(birData)
      setApplicationData(prev => ({
        ...prev,
        birRegistration: { ...prev.birRegistration, ...validBirData }
      }))
    }
  }

  const handleAgenciesSave = (agencyData) => {
    if (agencyData) {
      setApplicationData(prev => ({
        ...prev,
        otherAgencyRegistrations: agencyData
      }))
    }
    advanceStep(5)
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
    setCurrentStep(stepIndex - 1)
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
      modal.success({
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
          setCurrentStep(7)
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
    if (currentStep < wizardSteps.length - 1) {
      advanceStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      lastStepChangeTimeRef.current = Date.now()
      try {
        const key = actualBusinessId && actualBusinessId !== 'new'
          ? `business_registration_wizard_step_${actualBusinessId}`
          : 'business_registration_wizard_step_new'
        sessionStorage.setItem(key, String(prevStep))
      } catch (e) {
        console.warn('Failed to persist previous step:', e)
      }
    }
  }

  const effectiveLguDocumentsWithStorage = resolveEffectiveLguDocuments({
    applicationData,
    formData,
    actualBusinessId,
    businessId
  })
  const effectiveBirRegistration = resolveEffectiveBirRegistration(applicationData, formData)

  return {
    actualBusinessId,
    currentStep,
    isMobile,
    loading,
    form,
    applicationData,
    effectiveLguDocumentsWithStorage,
    effectiveBirRegistration,
    isSubmitted: isSubmitted(formData),
    handleStepChange,
    handleRequirementsConfirm,
    handleFormValuesChange,
    handleFormSave,
    handleDocumentsSave,
    handleDocumentsSaveFromModal,
    handleBIRSave,
    handleBIRSaveFromModal,
    handleAgenciesSave,
    handleAgenciesSaveFromModal,
    handleBusinessSaveFromModal,
    handleReviewEdit,
    handleFinalSubmit,
    handleNext,
    handlePrev,
    saveDraft
  }

  function advanceStep(nextStep) {
    setIsNavigating(true)
    setCurrentStep(nextStep)
    lastStepChangeTimeRef.current = Date.now()
    try {
      const key = actualBusinessId && actualBusinessId !== 'new'
        ? `business_registration_wizard_step_${actualBusinessId}`
        : 'business_registration_wizard_step_new'
      sessionStorage.setItem(key, String(nextStep))
    } catch (e) {
      console.warn('Failed to persist step change:', e)
    }
    setTimeout(() => {
      setIsNavigating(false)
    }, 1000)
  }
}

function getInitialStep(businessId) {
  try {
    const key = businessId && businessId !== 'new'
      ? `business_registration_wizard_step_${businessId}`
      : 'business_registration_wizard_step_new'
    const stored = sessionStorage.getItem(key)
    if (stored !== null) {
      const step = parseInt(stored, 10)
      if (step >= 0 && step < wizardSteps.length) {
        return step
      }
    }
  } catch (e) {
    console.warn('Failed to restore initial step from sessionStorage:', e)
  }
  return 0
}

function clearNewBusinessStorage() {
  try {
    sessionStorage.removeItem('business_registration_wizard_step_new')
    sessionStorage.removeItem('business_registration_data_new')
    sessionStorage.removeItem('business_registration_lgu_documents_new')
    sessionStorage.removeItem('business_registration_bir_new')
    sessionStorage.removeItem('business_registration_agencies_new')
  } catch (e) {
    console.warn('Failed to clear new business storage:', e)
  }
}

function migrateNewStorage(actualBusinessId) {
  try {
    const newStepKey = 'business_registration_wizard_step_new'
    const newDataKey = 'business_registration_data_new'
    const actualStepKey = `business_registration_wizard_step_${actualBusinessId}`
    const actualDataKey = `business_registration_data_${actualBusinessId}`

    const storedStep = sessionStorage.getItem(newStepKey)
    if (storedStep) {
      sessionStorage.setItem(actualStepKey, storedStep)
    }
    const storedData = sessionStorage.getItem(newDataKey)
    if (storedData) {
      sessionStorage.setItem(actualDataKey, storedData)
    }
  } catch (e) {
    console.warn('Failed to migrate data from "new" to actual businessId:', e)
  }
}

function restoreApplicationData(actualBusinessId) {
  try {
    const key = actualBusinessId && actualBusinessId !== 'new'
      ? `business_registration_data_${actualBusinessId}`
      : 'business_registration_data_new'
    let stored = sessionStorage.getItem(key)
    if (!stored && (actualBusinessId === 'new' || !actualBusinessId)) {
      stored = sessionStorage.getItem('business_registration_data_new')
    }
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      businessData: parsed.businessData || null,
      lguDocuments: parsed.lguDocuments || null,
      birRegistration: parsed.birRegistration || null,
      otherAgencyRegistrations: parsed.otherAgencyRegistrations || null,
      referenceNumber: parsed.referenceNumber || null,
      submittedAt: parsed.submittedAt || null
    }
  } catch (e) {
    console.warn('Failed to restore application data from sessionStorage:', e)
    return null
  }
}

function serializeApplicationData(applicationData) {
  const businessData = applicationData.businessData
    ? {
        ...applicationData.businessData,
        businessStartDate: normalizeDateValue(applicationData.businessData.businessStartDate),
        incorporationDate: normalizeDateValue(applicationData.businessData.incorporationDate)
      }
    : null
  return { ...applicationData, businessData }
}

function normalizeDateValue(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return value?.format?.('YYYY-MM-DD') || value
}

function mergeFormData(prev, formData) {
  const hasData = (obj) => {
    if (!obj || typeof obj !== 'object') return false
    return Object.values(obj).some((val) => {
      if (typeof val === 'string' && val.trim() !== '') return true
      if (val && typeof val === 'object') {
        return Object.values(val).some((nestedVal) =>
          typeof nestedVal === 'string' && nestedVal.trim() !== ''
        )
      }
      return false
    })
  }

  const mergeDocuments = (prevDocs, formDocs) => {
    if (prevDocs && typeof prevDocs === 'object') {
      const prevHasData = hasData(prevDocs)
      if (prevHasData) {
        if (formDocs && typeof formDocs === 'object' && hasData(formDocs)) {
          const merged = { ...prevDocs }
          Object.keys(formDocs).forEach(key => {
            const prevValue = merged[key]
            const formValue = formDocs[key]
            if ((!prevValue || (typeof prevValue === 'string' && prevValue.trim() === '')) &&
              formValue && typeof formValue === 'string' && formValue.trim() !== '') {
              merged[key] = formValue
            }
          })
          return merged
        }
        return prevDocs
      }
    }
    if (formDocs && typeof formDocs === 'object' && hasData(formDocs)) {
      return formDocs
    }
    return prevDocs || null
  }

  return {
    ...prev,
    businessData: formData || prev.businessData,
    lguDocuments: mergeDocuments(prev.lguDocuments, formData.lguDocuments),
    birRegistration: mergeDocuments(prev.birRegistration, formData.birRegistration),
    otherAgencyRegistrations: mergeDocuments(prev.otherAgencyRegistrations, formData.otherAgencyRegistrations),
    referenceNumber: formData.applicationReferenceNumber || prev.referenceNumber,
    submittedAt: formData.submittedAt || prev.submittedAt
  }
}

function updateStepFromStatus({
  formData,
  applicationData,
  currentStep,
  isNavigating,
  lastStepChangeTimeRef,
  setCurrentStep
}) {
  const timeSinceLastStepChange = Date.now() - lastStepChangeTimeRef.current
  const stepChangedRecently = timeSinceLastStepChange < 3000
  if (isNavigating || stepChangedRecently) return

  const status = formData.applicationStatus
  let statusBasedStep = null
  if (status === 'submitted' || status === 'resubmit' || status === 'under_review' ||
      status === 'approved' || status === 'rejected' || status === 'needs_revision') {
    statusBasedStep = 7
  } else if (status === 'agencies_registered') {
    statusBasedStep = 5
  } else if (status === 'bir_registered') {
    statusBasedStep = 4
  } else if (status === 'documents_uploaded') {
    statusBasedStep = 3
  } else if (status === 'form_completed') {
    statusBasedStep = 2
  } else if (status === 'requirements_viewed') {
    statusBasedStep = 1
  } else if (status === 'draft') {
    const hasBusinessData = (data) => {
      if (!data) return false
      return !!(data.businessName || data.registeredBusinessName || data.businessRegistrationNumber ||
        data.businessType || data.businessAddress || data.ownerName)
    }
    if (hasBusinessData(formData) || hasBusinessData(applicationData.businessData)) {
      statusBasedStep = 1
    } else {
      statusBasedStep = 0
    }
  }

  if (statusBasedStep !== null && statusBasedStep !== currentStep) {
    if (statusBasedStep > currentStep) {
      setCurrentStep(statusBasedStep)
      lastStepChangeTimeRef.current = Date.now()
    }
  }
}

function restoreStepFromStorage(storageKey, currentStep, setCurrentStep, lastStepChangeTimeRef) {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (stored !== null) {
      const step = parseInt(stored, 10)
      if (step >= 0 && step < wizardSteps.length && step !== currentStep) {
        setCurrentStep(step)
        lastStepChangeTimeRef.current = Date.now()
      }
    }
  } catch (e) {
    console.warn('Failed to restore step from sessionStorage:', e)
  }
}

function filterValidUrls(documents) {
  const validDocuments = {}
  Object.keys(documents).forEach((key) => {
    const url = documents[key]
    if (url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null') {
      validDocuments[key] = url
    }
  })
  return validDocuments
}

function normalizeBirData(birData) {
  const validBirData = { ...birData }
  const urlFields = ['certificateUrl', 'booksOfAccountsUrl', 'authorityToPrintUrl']
  urlFields.forEach((field) => {
    const url = validBirData[field]
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
      validBirData[field] = ''
    }
  })
  return validBirData
}

function hasValidDocumentUrls(docs) {
  if (!docs || typeof docs !== 'object') return false
  return Object.values(docs).some(url =>
    url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null'
  )
}

function hasMeaningfulBirRegistration(birData) {
  if (!birData || typeof birData !== 'object') return false
  if (hasValidDocumentUrls(birData)) return true
  const textFields = ['registrationNumber']
  const numberFields = ['registrationFee', 'documentaryStampTax', 'businessCapital']
  const hasText = textFields.some((field) => {
    const value = birData[field]
    return typeof value === 'string' && value.trim() !== ''
  })
  const hasNumber = numberFields.some((field) => {
    const value = birData[field]
    return typeof value === 'number' && Number.isFinite(value) && value > 0
  })
  return hasText || hasNumber
}

function resolveEffectiveLguDocuments({ applicationData, formData, actualBusinessId, businessId }) {
  const effectiveLguDocuments = hasValidDocumentUrls(applicationData.lguDocuments)
    ? applicationData.lguDocuments
    : formData?.lguDocuments
  const storedLguDocuments = getStoredLguDocuments(actualBusinessId || businessId)
  if (hasValidDocumentUrls(effectiveLguDocuments)) return effectiveLguDocuments
  if (hasValidDocumentUrls(storedLguDocuments)) return storedLguDocuments
  return effectiveLguDocuments
}

function getStoredLguDocuments(businessId) {
  try {
    const key = `business_registration_lgu_documents_${businessId || 'new'}`
    const stored = sessionStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch (e) {
    return null
  }
}

function resolveEffectiveBirRegistration(applicationData, formData) {
  if (hasMeaningfulBirRegistration(applicationData.birRegistration)) {
    return applicationData.birRegistration
  }
  return formData?.birRegistration
}

function isSubmitted(formData) {
  return formData?.applicationStatus === 'submitted' ||
    formData?.applicationStatus === 'resubmit' ||
    formData?.applicationStatus === 'under_review' ||
    formData?.applicationStatus === 'approved' ||
    formData?.applicationStatus === 'rejected' ||
    formData?.applicationStatus === 'needs_revision'
}
