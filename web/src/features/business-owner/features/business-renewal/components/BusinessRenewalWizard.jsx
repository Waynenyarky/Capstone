import React, { useState, useEffect, useRef } from 'react'
import { Steps, Button, Card, Modal, Form, App, Grid } from 'antd'
import { 
  CalendarOutlined, 
  EyeOutlined, 
  FileTextOutlined, 
  DollarOutlined, 
  UploadOutlined, 
  CalculatorOutlined, 
  CreditCardOutlined, 
  SendOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons'
import RenewalPeriodConfirmationStep from './RenewalPeriodConfirmationStep'
import BusinessProfileReviewStep from './BusinessProfileReviewStep'
import RenewalRequirementsStep from './RenewalRequirementsStep'
import GrossReceiptsDeclarationStep from './GrossReceiptsDeclarationStep'
import RenewalDocumentsUploadStep from './RenewalDocumentsUploadStep'
import RenewalAssessmentStep from './RenewalAssessmentStep'
import RenewalPaymentStep from './RenewalPaymentStep'
import RenewalSubmitStep from './RenewalSubmitStep'
import RenewalStatusCard from './RenewalStatusCard'
import { startRenewal, submitRenewal } from '../services/businessRenewalService'

const steps = [
  { 
    key: 'period', 
    title: 'Renewal Period', 
    description: 'Confirm Period',
    icon: <CalendarOutlined /> 
  },
  { 
    key: 'review', 
    title: 'Business Profile', 
    description: 'Review Info',
    icon: <EyeOutlined /> 
  },
  { 
    key: 'requirements', 
    title: 'Requirements', 
    description: 'Checklist',
    icon: <FileTextOutlined /> 
  },
  { 
    key: 'receipts', 
    title: 'Gross Receipts', 
    description: 'Declare Gross Receipts',
    icon: <DollarOutlined /> 
  },
  { 
    key: 'documents', 
    title: 'Documents', 
    description: 'Upload Files',
    icon: <UploadOutlined /> 
  },
  { 
    key: 'assessment', 
    title: 'Assessment', 
    description: 'Review Fees',
    icon: <CalculatorOutlined /> 
  },
  { 
    key: 'payment', 
    title: 'Payment', 
    description: 'Pay Fees',
    icon: <CreditCardOutlined /> 
  },
  { 
    key: 'submit', 
    title: 'Submit', 
    description: 'Final Step',
    icon: <SendOutlined /> 
  },
  { 
    key: 'status', 
    title: 'Status', 
    description: 'Track Progress',
    icon: <ClockCircleOutlined /> 
  }
]

export default function BusinessRenewalWizard({ 
  businessId, 
  businessData,
  renewalData,
  onComplete
}) {
  const { message } = App.useApp()
  const { useBreakpoint } = Grid
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [renewalId, setRenewalId] = useState(renewalData?.renewalId || null)
  const [renewalYear, setRenewalYear] = useState(new Date().getFullYear())
  const [renewalApplicationData, setRenewalApplicationData] = useState({
    periodAcknowledged: false,
    grossReceipts: null,
    documents: null,
    assessment: null,
    payment: null,
    referenceNumber: null,
    submittedAt: null,
    renewalStatus: null
  })
  
  // Use ref to track validated renewalId and prevent race conditions
  const validatedRenewalIdRef = useRef(null)

  // Centralized renewalId validation function
  const validateRenewalId = async (targetRenewalId = renewalId) => {
    if (!targetRenewalId || !businessId || businessId === 'new') {
      return { valid: false, renewalId: null }
    }
    
    try {
      const { getBusinessProfile } = await import('@/features/business-owner/services/businessProfileService')
      const profile = await getBusinessProfile()
      const business = profile?.businesses?.find(b => b.businessId === businessId)
      
      if (!business) {
        return { valid: false, renewalId: null }
      }
      
      // Check if the requested renewalId exists
      const renewal = business.renewals?.find(r => r.renewalId === targetRenewalId)
      
      if (renewal) {
        validatedRenewalIdRef.current = targetRenewalId
        return { valid: true, renewalId: targetRenewalId, renewal }
      }
      
      // Renewal not found, find the best replacement
      if (business.renewals && business.renewals.length > 0) {
        // Prefer renewals with gross receipts declared, then by most recent
        const sortedRenewals = business.renewals
          .map(r => ({
            ...r,
            hasGrossReceipts: (r.grossReceipts?.amount || r.grossReceipts?.cy2025) > 0,
            createdAt: new Date(r.createdAt || 0).getTime()
          }))
          .sort((a, b) => {
            // First sort by having gross receipts (prefer those with gross receipts)
            if (a.hasGrossReceipts !== b.hasGrossReceipts) {
              return b.hasGrossReceipts ? 1 : -1
            }
            // Then by most recent
            return b.createdAt - a.createdAt
          })
        
        const bestRenewal = sortedRenewals[0]
        if (bestRenewal?.renewalId) {
          console.log(`RenewalId ${targetRenewalId} not found, using ${bestRenewal.renewalId}`)
          validatedRenewalIdRef.current = bestRenewal.renewalId
          return { valid: true, renewalId: bestRenewal.renewalId, renewal: bestRenewal, corrected: true }
        }
      }
      
      return { valid: false, renewalId: null }
    } catch (error) {
      console.error('Failed to validate renewalId:', error)
      return { valid: false, renewalId: null }
    }
  }

  // Monitor renewalId and validate it periodically
  useEffect(() => {
    if (!renewalId || !businessId || businessId === 'new') return
    
    const checkRenewalId = async () => {
      const validation = await validateRenewalId()
      if (!validation.valid || validation.corrected) {
        if (validation.corrected && validation.renewalId) {
          // Update renewalId if it was corrected
          setRenewalId(validation.renewalId)
          
          // Reload renewal data
          if (validation.renewal) {
            setRenewalApplicationData({
              periodAcknowledged: validation.renewal.periodAcknowledged || false,
              grossReceipts: validation.renewal.grossReceipts || null,
              documents: validation.renewal.renewalDocuments || null,
              assessment: validation.renewal.assessment || null,
              payment: validation.renewal.payment || null,
              referenceNumber: validation.renewal.referenceNumber || null,
              submittedAt: validation.renewal.submittedAt || null,
              renewalStatus: validation.renewal.renewalStatus || 'draft'
            })
          }
          
          message.warning('Using the latest renewal from your account')
        }
      }
    }
    
    // Validate immediately
    checkRenewalId()
    
    // Set up periodic validation (every 30 seconds)
    const interval = setInterval(checkRenewalId, 30000)
    
    return () => clearInterval(interval)
  }, [renewalId, businessId, message])

  // Initialize wizard with existing renewal data if provided
  useEffect(() => {
    if (renewalData && renewalData.renewalId) {
      // Set renewalId and renewalYear from renewalData
      setRenewalId(renewalData.renewalId)
      if (renewalData.renewalYear) {
        setRenewalYear(renewalData.renewalYear)
      }
      
      // Load existing renewal data into state
      setRenewalApplicationData({
        periodAcknowledged: renewalData.periodAcknowledged || false,
        grossReceipts: renewalData.grossReceipts || null,
        documents: renewalData.renewalDocuments || null,
        assessment: renewalData.assessment || null,
        payment: renewalData.payment || null,
        referenceNumber: renewalData.referenceNumber || null,
        submittedAt: renewalData.submittedAt || null,
        renewalStatus: renewalData.renewalStatus || null
      })

      // Determine current step based on renewal status and progress
      const status = renewalData.renewalStatus || 'draft'
      
      if (['submitted', 'under_review', 'approved', 'rejected'].includes(status)) {
        // If submitted/approved, go to Status step
        setCurrentStep(8)
      } else if (renewalData.payment && renewalData.payment.status === 'paid') {
        // If payment completed, go to Submit step
        setCurrentStep(7)
      } else if (renewalData.assessment && renewalData.assessment.total > 0) {
        // If assessment calculated, go to Payment step
        setCurrentStep(6)
      } else if (renewalData.renewalDocuments && Object.keys(renewalData.renewalDocuments).length > 0) {
        // If documents uploaded, go to Assessment step
        setCurrentStep(5)
      } else if (renewalData.grossReceipts && (renewalData.grossReceipts.amount > 0 || renewalData.grossReceipts.cy2025 > 0)) {
        // If gross receipts declared (support both new and legacy structure), go to Documents step
        setCurrentStep(4)
      } else if (renewalData.periodAcknowledged) {
        // If period acknowledged, go to Gross Receipts step
        setCurrentStep(3)
      }
      // Otherwise start from beginning
    }
  }, [renewalData])

  // Initialize renewal if not already started
  useEffect(() => {
    const initializeRenewal = async () => {
      if (!renewalId && businessId && businessId !== 'new' && !renewalData) {
        try {
          setLoading(true)
          
          // First check if there's an existing draft renewal we should use
          try {
            const { getBusinessProfile } = await import('@/features/business-owner/services/businessProfileService')
            const profile = await getBusinessProfile()
            const business = profile?.businesses?.find(b => b.businessId === businessId)
            
            if (business?.renewals && business.renewals.length > 0) {
              // Find draft renewals for the current year, prefer those with gross receipts
              const draftRenewals = business.renewals
                .filter(r => (r.renewalStatus === 'draft' || !r.renewalStatus) && r.renewalYear === renewalYear)
                .map(r => ({
                  ...r,
                  hasGrossReceipts: (r.grossReceipts?.amount || r.grossReceipts?.cy2025) > 0,
                  createdAt: new Date(r.createdAt || 0).getTime()
                }))
                .sort((a, b) => {
                  // First sort by having gross receipts (prefer those with gross receipts)
                  if (a.hasGrossReceipts !== b.hasGrossReceipts) {
                    return b.hasGrossReceipts ? 1 : -1
                  }
                  // Then by most recent
                  return b.createdAt - a.createdAt
                })
              
              if (draftRenewals.length > 0) {
                // Use the best draft renewal (prefer one with gross receipts)
                const bestDraft = draftRenewals[0]
                console.log('Using existing draft renewal:', bestDraft.renewalId, bestDraft.hasGrossReceipts ? '(with gross receipts)' : '')
                setRenewalId(bestDraft.renewalId)
                validatedRenewalIdRef.current = bestDraft.renewalId
                if (bestDraft.renewalYear) {
                  setRenewalYear(bestDraft.renewalYear)
                }
                
                // Initialize state with existing data
                setRenewalApplicationData({
                  periodAcknowledged: bestDraft.periodAcknowledged || false,
                  grossReceipts: bestDraft.grossReceipts || null,
                  documents: bestDraft.renewalDocuments || null,
                  assessment: bestDraft.assessment || null,
                  payment: bestDraft.payment || null,
                  referenceNumber: bestDraft.referenceNumber || null,
                  submittedAt: bestDraft.submittedAt || null,
                  renewalStatus: bestDraft.renewalStatus || 'draft'
                })
                setLoading(false)
                return
              }
            }
          } catch (profileError) {
            console.warn('Failed to check existing renewals:', profileError)
            // Continue to create new renewal
          }
          
          // No existing draft renewal, create a new one
          const result = await startRenewal(businessId, renewalYear)
          // Backend returns: { renewal: {...}, businessId, renewalId: renewal.renewalId }
          const newRenewalId = result?.renewalId || result?.renewal?.renewalId
          if (newRenewalId) {
            setRenewalId(newRenewalId)
            validatedRenewalIdRef.current = newRenewalId
            // Ensure renewalYear is set from result if available
            if (result?.renewal?.renewalYear) {
              setRenewalYear(result.renewal.renewalYear)
            }
          } else {
            throw new Error('Renewal ID not returned from server')
          }
        } catch (error) {
          console.error('Failed to start renewal:', error)
          message.error('Failed to initialize renewal. Please try again.')
        } finally {
          setLoading(false)
        }
      }
    }

    initializeRenewal()
  }, [businessId, renewalYear, renewalId, renewalData, message])

  // Restore step from storage
  useEffect(() => {
    if (renewalId) {
      try {
        const key = `business_renewal_wizard_step_${businessId}_${renewalId}`
        const stored = sessionStorage.getItem(key)
        if (stored !== null) {
          const step = parseInt(stored, 10)
          if (step >= 0 && step < steps.length) {
            setCurrentStep(step)
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [renewalId, businessId])

  // Persist step to storage
  useEffect(() => {
    if (renewalId) {
      try {
        const key = `business_renewal_wizard_step_${businessId}_${renewalId}`
        sessionStorage.setItem(key, String(currentStep))
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [currentStep, renewalId, businessId])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleStepChange = async (step) => {
    // Prevent navigation away from Status step if renewal is complete
    const isComplete = renewalApplicationData.renewalStatus === 'submitted' ||
                      renewalApplicationData.renewalStatus === 'under_review' ||
                      renewalApplicationData.renewalStatus === 'approved' ||
                      renewalApplicationData.renewalStatus === 'rejected'
    
    if (isComplete && currentStep === 8 && step !== 8) {
      // Don't allow navigation away from Status step if renewal is complete
      return
    }
    
    // Validate renewalId before step navigation
    if (renewalId && businessId && businessId !== 'new') {
      const validation = await validateRenewalId()
      if (!validation.valid) {
        message.error('Renewal not found. Please refresh the page.')
        return
      }
      if (validation.corrected && validation.renewalId) {
        setRenewalId(validation.renewalId)
        if (validation.renewal) {
          setRenewalApplicationData(prev => ({
            ...prev,
            periodAcknowledged: validation.renewal.periodAcknowledged || prev.periodAcknowledged,
            grossReceipts: validation.renewal.grossReceipts || prev.grossReceipts,
            documents: validation.renewal.renewalDocuments || prev.documents,
            assessment: validation.renewal.assessment || prev.assessment,
            payment: validation.renewal.payment || prev.payment
          }))
        }
        message.warning('Using the latest renewal from your account')
      }
    }
    
    // Prevent navigation to Assessment step (step 5) if gross receipts are not saved
    if (step === 5) {
      const grossReceipts = renewalApplicationData.grossReceipts
      // Support both new structure (amount) and legacy (cy2025) for backward compatibility
      const amount = grossReceipts?.amount || grossReceipts?.cy2025
      const calendarYear = grossReceipts?.calendarYear || (renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1)
      if (!grossReceipts || !amount || amount <= 0) {
        message.warning(`Please complete the Gross Receipts step first. Gross receipts for CY ${calendarYear} must be declared before calculating assessment.`)
        return
      }
    }
    
    // Prevent navigation away from Gross Receipts step (step 3) if gross receipts are not saved
    if (currentStep === 3 && step !== 3) {
      const grossReceipts = renewalApplicationData.grossReceipts
      // Support both new structure (amount) and legacy (cy2025) for backward compatibility
      const amount = grossReceipts?.amount || grossReceipts?.cy2025
      const calendarYear = grossReceipts?.calendarYear || (renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1)
      if (!grossReceipts || !amount || amount <= 0) {
        message.warning(`Please enter and save gross receipts for CY ${calendarYear} before proceeding. The amount must be greater than 0.`)
        return
      }
    }
    
    setCurrentStep(step)
    window.scrollTo(0, 0)
  }

  const handlePeriodConfirm = async () => {
    // Ensure renewal exists before proceeding
    if (!renewalId && businessId && businessId !== 'new') {
      try {
        setLoading(true)
        const result = await startRenewal(businessId, renewalYear)
        // Backend returns: { renewal: {...}, businessId, renewalId: renewal.renewalId }
        const newRenewalId = result?.renewalId || result?.renewal?.renewalId
        if (newRenewalId) {
          setRenewalId(newRenewalId)
          validatedRenewalIdRef.current = newRenewalId
          setRenewalApplicationData(prev => ({ ...prev, periodAcknowledged: true }))
          handleNext()
        } else {
          message.error('Failed to initialize renewal. Please try again.')
        }
      } catch (error) {
        console.error('Failed to start renewal:', error)
        message.error('Failed to initialize renewal. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      setRenewalApplicationData(prev => ({ ...prev, periodAcknowledged: true }))
      handleNext()
    }
  }

  const handleProfileConfirm = () => {
    handleNext()
  }

  const handleRequirementsConfirm = () => {
    handleNext()
  }

  const handleGrossReceiptsSave = (data) => {
    setRenewalApplicationData(prev => ({ ...prev, grossReceipts: data }))
    handleNext()
  }

  const handleDocumentsSave = (documents) => {
    setRenewalApplicationData(prev => ({ ...prev, documents }))
    handleNext()
  }

  const handleAssessmentConfirm = async () => {
    // Load the assessment to save it to state
    if (businessId && renewalId) {
      try {
        const { calculateAssessment } = await import('../services/businessRenewalService')
        const { getBusinessProfile } = await import('@/features/business-owner/services/businessProfileService')
        
        // First verify the renewal exists
        try {
          const assessment = await calculateAssessment(businessId, renewalId)
          setRenewalApplicationData(prev => ({ ...prev, assessment }))
        } catch (error) {
          // If renewal doesn't exist, try to find the latest renewal
          if (error?.message?.includes('not found')) {
            console.warn('Renewal not found, attempting to find latest renewal')
            const profile = await getBusinessProfile()
            const business = profile?.businesses?.find(b => b.businessId === businessId)
            if (business?.renewals && business.renewals.length > 0) {
              // Use the latest renewal (most recently created)
              const latestRenewal = business.renewals.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateB - dateA
              })[0]
              
              if (latestRenewal?.renewalId) {
                console.log('Using latest renewal:', latestRenewal.renewalId)
                setRenewalId(latestRenewal.renewalId)
                // Try again with the correct renewalId
                const assessment = await calculateAssessment(businessId, latestRenewal.renewalId)
                setRenewalApplicationData(prev => ({ ...prev, assessment }))
                message.warning('Using the latest renewal from your account')
              } else {
                throw error
              }
            } else {
              throw error
            }
          } else {
            throw error
          }
        }
      } catch (error) {
        console.error('Failed to load assessment:', error)
        message.error(error?.message || 'Failed to calculate assessment. Please try again.')
        return // Don't proceed to next step if assessment fails
      }
    }
    // Move to next step (Payment)
    handleNext()
  }

  const handlePaymentSave = (paymentData) => {
    setRenewalApplicationData(prev => ({ ...prev, payment: paymentData }))
    handleNext()
  }

  const handleFinalSubmit = async () => {
    try {
      setLoading(true)
      const result = await submitRenewal(businessId, renewalId)
      
      // Load latest status from backend
      const { getRenewalStatus } = await import('../services/businessRenewalService')
      const statusData = await getRenewalStatus(businessId, renewalId)
      
      setRenewalApplicationData(prev => ({
        ...prev,
        referenceNumber: result.referenceNumber || statusData.referenceNumber,
        submittedAt: result.submittedAt || statusData.submittedAt || new Date().toISOString(),
        renewalStatus: statusData.renewalStatus || 'submitted'
      }))
      
      setCurrentStep(8) // Go to status step and stay there
      message.success('Renewal submitted successfully!')
      if (onComplete) onComplete(result)
    } catch (error) {
      console.error('Failed to submit renewal:', error)
      message.error(error?.message || 'Failed to submit renewal')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Renewal Period Confirmation
        return (
          <RenewalPeriodConfirmationStep
            businessId={businessId}
            renewalId={renewalId}
            onConfirm={handlePeriodConfirm}
            onNext={handlePeriodConfirm}
          />
        )
      
      case 1: // Business Profile Review
        return (
          <BusinessProfileReviewStep
            businessData={businessData}
            onConfirm={handleProfileConfirm}
            onNext={handleProfileConfirm}
          />
        )
      
      case 2: // Requirements
        return (
          <RenewalRequirementsStep
            businessId={businessId}
            renewalId={renewalId}
            onConfirm={handleRequirementsConfirm}
            onNext={handleRequirementsConfirm}
          />
        )
      
      case 3: // Gross Receipts
        return (
          <GrossReceiptsDeclarationStep
            businessId={businessId}
            renewalId={renewalId}
            renewalYear={renewalYear}
            businessData={businessData}
            initialData={renewalApplicationData.grossReceipts}
            onSave={handleGrossReceiptsSave}
            onNext={handleGrossReceiptsSave}
            onRenewalIdUpdate={(newRenewalId) => {
              setRenewalId(newRenewalId)
            }}
          />
        )
      
      case 4: // Documents
        return (
          <RenewalDocumentsUploadStep
            businessId={businessId}
            renewalId={renewalId}
            businessType={businessData?.businessType}
            initialDocuments={renewalApplicationData.documents}
            onSave={handleDocumentsSave}
            onNext={handleDocumentsSave}
          />
        )
      
      case 5: // Assessment
        return (
          <RenewalAssessmentStep
            businessId={businessId}
            renewalId={renewalId}
            renewalYear={renewalYear}
            initialAssessment={renewalApplicationData.assessment}
            grossReceipts={renewalApplicationData.grossReceipts}
            onConfirm={handleAssessmentConfirm}
            onNext={handleAssessmentConfirm}
            onRenewalIdUpdate={(newRenewalId) => {
              setRenewalId(newRenewalId)
            }}
          />
        )
      
      case 6: // Payment
        // Load assessment if not already loaded
        const assessmentToUse = renewalApplicationData.assessment || null
        return (
          <RenewalPaymentStep
            businessId={businessId}
            renewalId={renewalId}
            assessment={assessmentToUse}
            onSave={handlePaymentSave}
            onNext={handlePaymentSave}
          />
        )
      
      case 7: // Submit
        return (
          <RenewalSubmitStep
            businessId={businessId}
            renewalId={renewalId}
            renewalYear={renewalYear}
            grossReceipts={renewalApplicationData.grossReceipts}
            onComplete={handleFinalSubmit}
          />
        )
      
      case 8: // Status
        return (
          <RenewalStatusCard
            businessId={businessId}
            renewalId={renewalId}
            status={renewalApplicationData.renewalStatus || renewalData?.renewalStatus || 'submitted'}
            referenceNumber={renewalApplicationData.referenceNumber || renewalData?.referenceNumber}
            submittedAt={renewalApplicationData.submittedAt || renewalData?.submittedAt}
            onRenewalIdUpdate={(newRenewalId) => {
              setRenewalId(newRenewalId)
              // Also reload the renewal data when renewalId changes
              const loadRenewalData = async () => {
                try {
                  const { getBusinessProfile } = await import('@/features/business-owner/services/businessProfileService')
                  const profile = await getBusinessProfile()
                  const business = profile?.businesses?.find(b => b.businessId === businessId)
                  const renewal = business?.renewals?.find(r => r.renewalId === newRenewalId)
                  if (renewal) {
                    setRenewalApplicationData({
                      periodAcknowledged: renewal.periodAcknowledged || false,
                      grossReceipts: renewal.grossReceipts || null,
                      documents: renewal.renewalDocuments || null,
                      assessment: renewal.assessment || null,
                      payment: renewal.payment || null,
                      referenceNumber: renewal.referenceNumber || null,
                      submittedAt: renewal.submittedAt || null,
                      renewalStatus: renewal.renewalStatus || null
                    })
                  }
                } catch (error) {
                  console.error('Failed to reload renewal data:', error)
                }
              }
              loadRenewalData()
            }}
          />
        )
      
      default:
        return <div>Unknown step</div>
    }
  }

  const isSubmitted = renewalApplicationData.renewalStatus === 'submitted' || 
                     renewalApplicationData.renewalStatus === 'under_review' ||
                     renewalApplicationData.renewalStatus === 'approved' ||
                     renewalApplicationData.renewalStatus === 'rejected' ||
                     (renewalData && (renewalData.renewalStatus === 'submitted' ||
                                      renewalData.renewalStatus === 'under_review' ||
                                      renewalData.renewalStatus === 'approved' ||
                                      renewalData.renewalStatus === 'rejected'))

  return (
    <div style={{ padding: isMobile ? '8px' : '16px' }}>
      <Card>
        <Steps
          current={currentStep}
          onChange={isSubmitted ? undefined : handleStepChange}
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

        {currentStep < 7 && !isSubmitted && (
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
          </div>
        )}
      </Card>
    </div>
  )
}
