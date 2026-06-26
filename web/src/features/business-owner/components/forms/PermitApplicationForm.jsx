import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Typography, Button, Space, Result, Grid, theme, App, Empty } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { BugOutlined } from '@ant-design/icons'
import { addBusiness } from '../../services/businessProfileService'
import { getFeeGroupForForm } from '../../services/feeService'
import { post } from '@/lib/http'
import DynamicFormRenderer from './DynamicFormRenderer'
import { filterSectionsByFormValues } from '../../utils/formUtils.js'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import ApplicationTypeSelector from '../onboarding/ApplicationTypeSelector'
import GeneralPermitCategorySelector from '../onboarding/GeneralPermitCategorySelector'
import ApplicationOverview from '../views/ApplicationOverview'
import { generateTestDataForDefinition, formDataWithDayjs } from '../../utils/businessFormUtils'
import { GENERAL_PERMIT_CATEGORIES } from '../../constants/businessFormConstants'
import useBusinessFormSubmit from '../../hooks/useBusinessFormSubmit'
import useApplicationAutosave from '../../hooks/useApplicationAutosave'
import { calculateRevisionFieldKeys, buildFieldToSectionIndexMap } from '../../utils/formUtils.js'
import { useSectionCompletion } from '../../hooks/useSectionCompletion.js'
import { useDraftPersistence } from '../../hooks/useDraftPersistence.js'
import { useFormDefinitionLoader } from '../../hooks/useFormDefinitionLoader.js'
import FormSectionTabs from './FormSectionTabs.jsx'
import MockPaymentModal from '../MockPaymentModal'
import PaymentReceiptModal from '../PaymentReceiptModal'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default forwardRef(function PermitApplicationForm({
  onBack: _onBack,
  editingApplication,
  onDraftCreated,
  embedded = false,
  onSubmittingChange,
  readOnly: readOnlyProp = false,
  onSubmitted,
  initialRegistrationType = null,
  hideActionButtons = false,
  onSectionCompleteChange = null,
  onAutosaveStatusChange = null,
  updateFn = null, // Optional: override updateBusiness (officer walk-in uses PUT /api/business/walk-in/:id)
}, ref) {
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.lg
  const [form] = Form.useForm()

  const isEditing = !!editingApplication
  const [step, setStep] = useState(isEditing ? 'form' : (initialRegistrationType ? 'form' : 'type_selection'))
  const [registrationType, setRegistrationType] = useState(editingApplication?.formType || initialRegistrationType || (isEditing ? 'permit' : null))
  const [generalPermitCategory, setGeneralPermitCategory] = useState(editingApplication?.category || null)
  const [formDefinition, setFormDefinition] = useState(null)
  // Start loading if editing OR if initialRegistrationType is provided (will auto-create draft)
  const [loading, setLoading] = useState(isEditing || !!initialRegistrationType)
  const [submitted, setSubmitted] = useState(false)
  const [formValues, setFormValues] = useState(() => {
    const initial = editingApplication?.formData || {}
    // Ensure generalPermitCategory is set for conditional section visibility
    if (editingApplication?.category && !initial.generalPermitCategory) {
      return { ...initial, generalPermitCategory: editingApplication.category }
    }
    return initial
  })
  const [activeSectionIndex, setActiveSectionIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [documentCids, setDocumentCids] = useState({})
  const [draftBusinessId, setDraftBusinessId] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [feeData, setFeeData] = useState(null)
  const [loadingFees, setLoadingFees] = useState(true)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const currentApplicationStatus = (editingApplication?.applicationStatus || '').toLowerCase()
  const isRevisionMode = isEditing && currentApplicationStatus === 'needs_revision' && !readOnlyProp
  const isResubmissionMode = isEditing && (currentApplicationStatus === 'needs_revision' || currentApplicationStatus === 'resubmit') && !readOnlyProp
  const formReadOnly = readOnlyProp || (embedded && submitted)

  // Switch to first section if Overview is active when form becomes read-only
  useEffect(() => {
    if (formReadOnly && activeSectionIndex === -1) {
      setActiveSectionIndex(0)
    }
  }, [formReadOnly, activeSectionIndex])
  useEffect(() => {
    const fetchFees = async () => {
      if (!registrationType) return
      try {
        setLoadingFees(true)
        const category = registrationType === 'general_permit' ? generalPermitCategory : null
        const response = await getFeeGroupForForm(registrationType, category)
        setFeeData(response)
      } catch (err) {
        console.error('Failed to fetch fee data:', err)
        setFeeData(null)
      } finally {
        setLoadingFees(false)
      }
    }
    fetchFees()
  }, [registrationType, generalPermitCategory])

  const revisionFieldKeys = useMemo(() => 
    calculateRevisionFieldKeys(editingApplication?.fieldReviewDecisions),
    [editingApplication?.fieldReviewDecisions]
  )

  // Visible sections for step-by-step tabs (depends on form definition + form values)
  const visibleSections = useMemo(() => {
    if (!formDefinition?.sections) return []
    return filterSectionsByFormValues(formDefinition.sections, formValues)
  }, [formDefinition, formValues])

  const sectionCompleteMap = useSectionCompletion(visibleSections, formValues)

  // Calculate if all sections are complete
  const allSectionsComplete = useMemo(() => {
    if (visibleSections.length === 0) return false
    return visibleSections.every((_, idx) => sectionCompleteMap[idx] === true)
  }, [visibleSections, sectionCompleteMap])

  // Notify parent when section completion status changes
  useEffect(() => {
    if (onSectionCompleteChange) {
      onSectionCompleteChange(allSectionsComplete)
    }
  }, [allSectionsComplete, onSectionCompleteChange])

  const fieldToSectionIndex = useMemo(() => 
    buildFieldToSectionIndexMap(visibleSections),
    [visibleSections]
  )

  // Keep active tab in range when visible sections change
  useEffect(() => {
    if (visibleSections.length > 0 && activeSectionIndex >= visibleSections.length) {
      setActiveSectionIndex(-1)
    }
  }, [visibleSections.length, activeSectionIndex])

  const initialTypeRef = useRef(initialRegistrationType)
  const draftCreatedRef = useRef(false)
  const { DRAFT_STORAGE_KEY, restorationComplete } = useDraftPersistence(
    formValues, hasUnsavedChanges, registrationType, generalPermitCategory, isEditing,
    setRegistrationType, setGeneralPermitCategory, setFormValues, draftBusinessId, setDraftBusinessId
  )

  // When switching to "Add" (editingApplication becomes null), reset to type selection
  // BUT skip reset if initialRegistrationType is provided (coming from welcome modal)
  // When editingApplication changes to a new business, update formValues immediately
  useEffect(() => {
    if (!editingApplication && !initialTypeRef.current) {
      setStep('type_selection')
      setRegistrationType(null)
      setGeneralPermitCategory(null)
      setFormDefinition(null)
      setFormValues({})
      setDocumentCids({})
      setDraftBusinessId(null)
      setLoading(false)
      setActiveSectionIndex(-1)
      setHasUnsavedChanges(false)
      form.resetFields()
    } else if (editingApplication) {
      // When editingApplication is set (e.g., after draft creation), update formValues immediately
      // so conditional sections are visible before formDefinition loads
      const initial = editingApplication.formData || {}
      if (editingApplication.category && !initial.generalPermitCategory) {
        setFormValues({ ...initial, generalPermitCategory: editingApplication.category })
      } else {
        setFormValues(initial)
      }
      setGeneralPermitCategory(editingApplication.category || null)
      setRegistrationType(editingApplication.formType || 'permit')
      // Set draftBusinessId to the business ID when editing
      setDraftBusinessId(editingApplication.businessId || editingApplication._id)
    }
  }, [editingApplication, form])

  const { error: definitionError, fetchFormDefinition } = useFormDefinitionLoader()

  // Load form definition when editing
  useEffect(() => {
    if (isEditing) {
      const type = editingApplication?.formType || 'permit'
      fetchFormDefinition(type, editingApplication?.category, isEditing, setFormDefinition, setStep, setActiveSectionIndex, setFormValues, form)
    }
  }, [isEditing, editingApplication?.formType, editingApplication?.category, editingApplication?.businessId, editingApplication?._id, fetchFormDefinition, setFormDefinition, setStep, setActiveSectionIndex, setFormValues, form])

  // Set form values when editing and form definition is loaded
  useEffect(() => {
    if (isEditing && formDefinition && editingApplication?.formData) {
      const values = formDataWithDayjs(editingApplication.formData, formDefinition)
      // Ensure generalPermitCategory is set for conditional section visibility
      // (legacy drafts may have 'category' instead of 'generalPermitCategory')
      if (editingApplication.category && !values.generalPermitCategory) {
        values.generalPermitCategory = editingApplication.category
      }
      form.setFieldsValue(values)
      setFormValues(values)
      setHasUnsavedChanges(false)
    }
  }, [isEditing, formDefinition, editingApplication?.formData, editingApplication?.category, form])

  const { handleSubmit, submitting } = useBusinessFormSubmit({
    isEditing,
    editingApplication,
    registrationType,
    generalPermitCategory,
    documentCids,
    formDefinition,
    onSubmitted,
    draftBusinessId,
    setDraftBusinessId,
    setSubmitted,
    setHasUnsavedChanges,
    updateFn,
  })

  const handleSubmitAndPay = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (receiptId) => {
    setShowPaymentModal(false)
    setIsSubmittingPayment(true)
    // Store receipt data to show after submission
    const receiptInfo = {
      receiptId,
      transactionDate: new Date().toLocaleString(),
      transactionName: 'Business Permit Application',
      fees: feeData?.fees || [],
      totalAmount: feeData?.total || 0,
      applicationReferenceNumber: editingApplication?.applicationReferenceNumber || 'N/A',
    }
    setReceiptData(receiptInfo)
    // Submit application after successful payment
    try {
      const values = await form.validateFields()
      await handleSubmit(values, true)
      
      // Create mock payment record in backend
      let backendReceiptNumber = null
      try {
        const businessId = editingApplication?.businessId || editingApplication?._id
        const paymentResponse = await post('/api/business/payments/mock', {
          businessId,
          amount: receiptInfo.totalAmount,
          fees: receiptInfo.fees,
          transactionName: receiptInfo.transactionName,
        })
        backendReceiptNumber = paymentResponse?.data?.receiptNumber
      } catch (err) {
        console.error('Failed to create mock payment record:', err)
        // Continue anyway - payment record creation is non-blocking
      }
      
      // Update receipt data with backend receipt number
      setReceiptData(prev => ({ ...prev, receiptNumber: backendReceiptNumber }))
      
      // Show receipt modal after successful submission
      setShowReceiptModal(true)
    } catch {
      // Form validation or submission error - let the existing error handling work
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handlePaymentFail = () => {
    setShowPaymentModal(false)
    message.error('Payment cancelled. Application was not submitted.')
  }

  useEffect(() => {
    onSubmittingChange?.(submitting)
  }, [submitting, onSubmittingChange])

  // Autosave hook - saves draft automatically when form values change
  const handleAutosave = useCallback(async (values) => {
    if (!formDefinition) return
    if (submitting) return
    if (formReadOnly) return
    if (!isEditing && !draftBusinessId) return

    try {
      await handleSubmit(values, false)
    } catch (err) {
      console.error('Autosave failed:', err)
    }
  }, [formDefinition, submitting, formReadOnly, isEditing, draftBusinessId, handleSubmit])

  const handleAutosaveComplete = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  const { isSaving: isAutosaving } = useApplicationAutosave(
    formValues,
    handleAutosave,
    // Enable autosave only when:
    // - Draft restoration is complete
    // - We have a draft (editing or new with draftBusinessId)
    // - Not in read-only mode
    // - Not currently submitting
    restorationComplete && (isEditing || draftBusinessId) && !formReadOnly && !submitting,
    { delayMs: 5000 }, // Configurable delay (default is 5000ms)
    hasUnsavedChanges,
    handleAutosaveComplete // Reset unsaved flag after successful autosave
  )

  // Notify parent of autosave status changes
  useEffect(() => {
    onAutosaveStatusChange?.({ isAutosaving, hasUnsavedChanges })
  }, [isAutosaving, hasUnsavedChanges, onAutosaveStatusChange])

  // Auto-save when switching sections
  useEffect(() => {
    if (activeSectionIndex === -1) return // Don't save when going back to overview
    if (!restorationComplete) return // Don't save during restoration
    if (!draftBusinessId && !isEditing) return // No draft to save to
    if (!hasUnsavedChanges) return // Nothing to save

    // Save immediately when section changes
    const saveOnSectionChange = async () => {
      try {
        await handleAutosave(formValues)
      } catch (err) {
        console.error('Save on section change failed:', err)
      }
    }

    saveOnSectionChange()
  }, [activeSectionIndex, restorationComplete, draftBusinessId, isEditing, hasUnsavedChanges, formValues, handleAutosave])


  const handleTypeSelect = useCallback(async (type) => {
    setRegistrationType(type)

    if (type === 'general_permit') {
      setStep('category_selection')
      return
    }

    // type === 'permit': create draft when onDraftCreated provided (dashboard flow), else load form in-place
    if (type === 'permit' && onDraftCreated && !isEditing) {
      setLoading(true)
      try {
        const payload = {
          businessName: 'New Business Application',
          applicationStatus: 'draft',
          formType: 'permit',
          formData: {},
        }
        const response = await addBusiness(payload)
        const businessId = response.businessId
        const newBusiness = (response.businesses || []).find(b => (b.businessId || b._id) === businessId)
        if (newBusiness && onDraftCreated) {
          onDraftCreated(newBusiness)
        } else {
          message.error('Draft created but could not load. Please select it from the list.')
        }
      } catch (err) {
        console.error('Failed to create draft:', err)
        message.error(err.message || 'Failed to create draft.')
      } finally {
        setLoading(false)
      }
      return
    }

    fetchFormDefinition(type, null, isEditing, setFormDefinition, setStep, setActiveSectionIndex, setFormValues, form)
  }, [onDraftCreated, isEditing, fetchFormDefinition, setFormDefinition, setStep, setActiveSectionIndex, setFormValues, form, message])

  // Auto-create draft when initialRegistrationType is provided (from welcome modal)
  // Runs ONLY on mount - ref flag prevents duplicate in React Strict Mode
  useEffect(() => {
    if (draftCreatedRef.current) return
    if (initialTypeRef.current && onDraftCreated && !isEditing) {
      draftCreatedRef.current = true
      const type = initialTypeRef.current
      if (type === 'general_permit') {
        setStep('category_selection')
        setLoading(false) // Stop loading spinner, show category selection
      } else {
        // Create draft for permit type
        (async () => {
          setLoading(true)
          try {
            const payload = {
              businessName: 'New Business Application',
              applicationStatus: 'draft',
              formType: 'permit',
              formData: {},
            }
            const response = await addBusiness(payload)
            const businessId = response.businessId
            const newBusiness = (response.businesses || []).find(b => (b.businessId || b._id) === businessId)
            if (newBusiness) {
              onDraftCreated(newBusiness)
            }
          } catch (err) {
            console.error('Failed to create draft:', err)
            message.error(err.message || 'Failed to create draft.')
            setLoading(false)
          }
          // Note: Don't setLoading(false) on success - onDraftCreated will unmount this component
        })()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCategorySelect = async (category) => {
    setGeneralPermitCategory(category)

    const categoryLabel = GENERAL_PERMIT_CATEGORIES.find(c => c.value === category)?.label || category

    if (onDraftCreated && !isEditing) {
      setLoading(true)
      try {
        const payload = {
          businessName: `General Permit - ${categoryLabel}`,
          applicationStatus: 'draft',
          formType: 'general_permit',
          category,
          formData: { generalPermitCategory: category },
        }
        const response = await addBusiness(payload)
        const businessId = response.businessId
        const newBusiness = (response.businesses || []).find(b => (b.businessId || b._id) === businessId)
        if (newBusiness && onDraftCreated) {
          onDraftCreated(newBusiness)
        } else {
          message.error('Draft created but could not load. Please select it from the list.')
        }
      } catch (err) {
        console.error('Failed to create draft:', err)
        message.error(err.message || 'Failed to create draft.')
      } finally {
        setLoading(false)
      }
      return
    }

    fetchFormDefinition('general_permit', category, isEditing, setFormDefinition, setStep, setActiveSectionIndex, setFormValues, form)
  }

  const handleFormValuesChange = (changedValues, allValues) => {
    setFormValues(allValues)
    // Don't mark as unsaved during restoration to prevent autosave race condition
    if (restorationComplete) {
      setHasUnsavedChanges(true)
    }
  }

  const doFillTestData = useCallback(async () => {
    if (!formDefinition) return
    const testData = generateTestDataForDefinition(formDefinition, generalPermitCategory)
    const processedTestData = formDataWithDayjs(testData, formDefinition)
    form.setFieldsValue(processedTestData)
    setFormValues(prev => ({ ...prev, ...processedTestData }))

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
  }, [formDefinition, generalPermitCategory, form, message, isEditing, draftBusinessId, registrationType, addBusiness, setDraftBusinessId])

  useImperativeHandle(ref, () => ({
    submitApplication: async () => {
      const values = await form.validateFields()
      return handleSubmit(values, true)
    },
    fillTestData: doFillTestData,
  }), [form, doFillTestData, handleSubmit])

  // Auto-save draft when switching between sections
  const previousSectionRef = useRef(-1)
  useEffect(() => {
    // Skip auto-save if:
    // - Not editing/no draft exists yet
    // - Form is read-only
    // - No unsaved changes
    // - Still on the same section (initial render)
    // - Currently submitting
    if (!isEditing && !draftBusinessId) return
    if (formReadOnly) return
    if (!hasUnsavedChanges) return
    if (previousSectionRef.current === activeSectionIndex) return
    if (submitting) return

    // Auto-save when switching sections
    const autoSave = async () => {
      try {
        const values = form.getFieldsValue(true)
        await handleSubmit(values, false)
      } catch (err) {
        console.error('Autosave failed:', err)
      }
    }
    autoSave()
    previousSectionRef.current = activeSectionIndex
  }, [activeSectionIndex, isEditing, draftBusinessId, formReadOnly, hasUnsavedChanges, submitting, form, handleSubmit])

  const handleStartNew = () => {
    setStep('type_selection')
    setRegistrationType(null)
    setGeneralPermitCategory(null)
    setFormDefinition(null)
    setSubmitted(false)
    form.resetFields()
    setFormValues({})
    setActiveSectionIndex(-1)
  }

  if (submitted && !embedded) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="success"
          title="Application Submitted!"
          subTitle="Your application has been submitted successfully. You will be notified once it has been reviewed."
          extra={[
            <Button key="new" onClick={handleStartNew}>
              Submit Another Application
            </Button>
          ]}
        />
      </div>
    )
  }

  return (
    <>
      {step === 'form' && formDefinition ? (
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {!embedded && !hideActionButtons && (
              <div style={{ flexShrink: 0, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <Space wrap style={{ marginLeft: 'auto' }}>
                    {import.meta.env.DEV && (
                    <Button
                      type="dashed"
                      icon={<BugOutlined />}
                      onClick={doFillTestData}
                    >
                      Fill with Test Data
                    </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="button"
                      loading={submitting || isSubmittingPayment}
                      onClick={handleSubmitAndPay}
                      disabled={isSubmittingPayment}
                    >
                      Submit
                    </Button>
                  </Space>
                </div>

                {!isEditing && (
                  <div>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      {registrationType === 'general_permit'
                        ? `General Permit - ${GENERAL_PERMIT_CATEGORIES.find(c => c.value === generalPermitCategory)?.label || 'Application'}`
                        : 'New Business Application'
                      }
                    </Title>
                    <Paragraph style={{ margin: 0 }}>
                      Complete each section below.
                    </Paragraph>
                  </div>
                )}
              </div>
            )}

          {embedded && isResubmissionMode && !hideActionButtons && (
            <div style={{ flexShrink: 0, marginBottom: 16 }}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={submitting}
                  onClick={handleSubmitAndPay}
                >
                  {isRevisionMode ? 'Resubmit Application' : 'Submit'}
                </Button>
              </Space>
            </div>
          )}

          {/* Form with two-panel layout */}
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleSubmit(values, true)}
            onValuesChange={handleFormValuesChange}
            initialValues={isEditing ? {} : formValues}
            preserve={true}
            style={{ 
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Two-panel: sticky section tabs (left), scrollable form content (right) */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <FormSectionTabs
                visibleSections={visibleSections}
                sectionCompleteMap={sectionCompleteMap}
                activeSectionIndex={activeSectionIndex}
                setActiveSectionIndex={setActiveSectionIndex}
                formReadOnly={formReadOnly}
                isMobile={isMobile}
                token={token}
              />

              {/* Right panel: scrollable form content */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  overflow: 'auto',
                  padding: isMobile ? 16 : 24,
                  borderTop: isMobile ? `1px solid ${token.colorBorderSecondary}` : 'none',
                }}
              >
                {/* Overview content - show when activeSectionIndex is -1 */}
                {activeSectionIndex === -1 && (
                  <ApplicationOverview 
                    visibleSections={visibleSections}
                    sectionCompleteMap={sectionCompleteMap}
                    token={token}
                    formType={registrationType}
                    category={generalPermitCategory}
                  />
                )}
                {/* Always render form fields so they're in DOM for validation */}
                                <div style={{ display: activeSectionIndex === -1 ? 'none' : 'block' }}>
                  <DynamicFormRenderer
                    definition={formDefinition}
                    form={form}
                    formValues={formValues}
                    isMobile={isMobile}
                    activeSectionIndex={activeSectionIndex === -1 ? 0 : activeSectionIndex}
                    readOnly={formReadOnly}
                    revisionFieldKeys={isRevisionMode ? revisionFieldKeys : undefined}
                    businessId={editingApplication?.businessId || editingApplication?._id || draftBusinessId || null}
                    onDocumentCid={(key, cid) => {
                      setDocumentCids(prev => ({ ...prev, [key]: cid }))
                      // Sync formValues on next tick after form.setFieldValue completes
                      // (programmatic setFieldValue doesn't trigger onValuesChange)
                      setTimeout(() => setFormValues(form.getFieldsValue(true)), 0)
                    }}
                    onSaveDraft={async () => {
                      try {
                        const values = form.getFieldsValue(true)
                        // Sync formValues so useSectionCompletion recalculates
                        // (form.setFieldValue doesn't trigger onValuesChange)
                        setFormValues(values)
                        await handleSubmit(values, false)
                      } catch (err) {
                        console.error('Auto-save draft failed:', err)
                      }
                    }}
                    formDataKey={editingApplication?.businessId ?? editingApplication?._id ?? draftBusinessId ?? 'new'}
                    documents={(() => {
                      const lguDocs = editingApplication?.lguDocuments || editingApplication?.documentCids || {}
                      const resolved = { ...lguDocs }
                      // Resolve *IpfsCid keys to base keys (e.g. dtiSecCdaCertificateIpfsCid -> dtiSecCdaCertificate)
                      Object.keys(lguDocs).forEach((k) => {
                        const val = lguDocs[k]
                        if (k.endsWith('IpfsCid') && typeof val === 'string' && val.trim()) {
                          const baseKey = k.slice(0, -7) // remove 'IpfsCid'
                          resolved[baseKey] = resolveIpfsUrl(val.trim()) || val.trim()
                        }
                      })
                      return resolved
                    })()}
                  />
                </div>
              </div>
            </div>
          </Form>
          </div>
        </div>
      ) : (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <LottieSpinner size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Loading form...</Text>
                </div>
              </div>
            ) : definitionError ? (
              <Result
                status="error"
                title="Unable to Load Form"
                subTitle={definitionError}
              />
            ) : step === 'type_selection' ? (
              <ApplicationTypeSelector onSelect={handleTypeSelect} />
            ) : step === 'category_selection' ? (
              <GeneralPermitCategorySelector
                onSelect={handleCategorySelect}
                onBack={() => {
                  setStep('type_selection')
                  setRegistrationType(null)
                }}
              />
            ) : (
              <Empty description="No form available" />
            )}
          </div>
          {/* Keep form instance connected when not on form step (avoids Ant Design useForm warning) */}
          <Form form={form} style={{ display: 'none' }} />
        </div>
      )}

      <MockPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        onFail={handlePaymentFail}
        amount={feeData?.total || 0}
        transactionName="Business Permit Application"
        fees={feeData?.fees || []}
      />
      
      <PaymentReceiptModal
        visible={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptId={receiptData?.receiptId}
        receiptNumber={receiptData?.receiptNumber}
        transactionDate={receiptData?.transactionDate}
        transactionName={receiptData?.transactionName}
        fees={receiptData?.fees}
        totalAmount={receiptData?.totalAmount}
        applicationReferenceNumber={receiptData?.applicationReferenceNumber}
      />
    </>
  )
})
