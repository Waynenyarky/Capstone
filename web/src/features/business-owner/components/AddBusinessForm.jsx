import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Typography, Button, Space, Result, Grid, theme, App, Empty } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { BugOutlined, CheckCircleOutlined, DashboardOutlined } from '@ant-design/icons'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'
import { addBusiness } from '../services/businessProfileService'
import DynamicFormRenderer, { filterSectionsByFormValues } from './DynamicFormRenderer'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import RegistrationTypeSelector from './RegistrationTypeSelector'
import GeneralPermitCategorySelector from './GeneralPermitCategorySelector'
import ApplicationOverview from './ApplicationOverview'
import { generateTestDataForDefinition, formDataWithDayjs } from '../utils/businessFormUtils'
import { GENERAL_PERMIT_CATEGORIES } from '../constants/businessFormConstants'
import useBusinessFormSubmit from '../hooks/useBusinessFormSubmit'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid
const DRAFT_STORAGE_KEY = 'addBusinessFormDraft'

export default forwardRef(function AddBusinessForm({
  onBack,
  editingBusiness,
  onDraftCreated,
  embedded = false,
  onSubmittingChange,
  readOnly: readOnlyProp = false,
  onSubmitted,
  initialRegistrationType = null,
  hideActionButtons = false,
  updateFn = null, // Optional: override updateBusiness (officer walk-in uses PUT /api/business/walk-in/:id)
}, ref) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [form] = Form.useForm()

  const isEditing = !!editingBusiness
  const [step, setStep] = useState(isEditing ? 'form' : (initialRegistrationType ? 'form' : 'type_selection'))
  const [registrationType, setRegistrationType] = useState(editingBusiness?.formType || initialRegistrationType || (isEditing ? 'permit' : null))
  const [generalPermitCategory, setGeneralPermitCategory] = useState(editingBusiness?.category || null)
  const [formDefinition, setFormDefinition] = useState(null)
  // Start loading if editing OR if initialRegistrationType is provided (will auto-create draft)
  const [loading, setLoading] = useState(isEditing || !!initialRegistrationType)
  const [submitted, setSubmitted] = useState(false)
  const [formValues, setFormValues] = useState(() => {
    const initial = editingBusiness?.formData || {}
    // Ensure generalPermitCategory is set for conditional section visibility
    if (editingBusiness?.category && !initial.generalPermitCategory) {
      return { ...initial, generalPermitCategory: editingBusiness.category }
    }
    return initial
  })
  const [activeSectionIndex, setActiveSectionIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false)
  const [hasInitializedDraft, setHasInitializedDraft] = useState(false) // Prevent multiple draft creations
  const [documentCids, setDocumentCids] = useState({})
  const [draftBusinessId, setDraftBusinessId] = useState(null)
  const currentApplicationStatus = (editingBusiness?.applicationStatus || '').toLowerCase()
  const isRevisionMode = isEditing && currentApplicationStatus === 'needs_revision' && !readOnlyProp
  const isResubmissionMode = isEditing && (currentApplicationStatus === 'needs_revision' || currentApplicationStatus === 'resubmit') && !readOnlyProp
  const revisionFieldKeys = useMemo(() => {
    if (!isRevisionMode || !editingBusiness?.fieldReviewDecisions) return new Set()
    const normalized = new Set()

    Object.entries(editingBusiness.fieldReviewDecisions)
      .filter(([, decision]) => decision?.status === 'rejected')
      .forEach(([fieldKey]) => {
        if (!fieldKey || typeof fieldKey !== 'string') return

        // Preserve raw key as fallback
        normalized.add(fieldKey)

        // Legacy owner format: section_2_businessName -> businessName
        const legacy = fieldKey.match(/^section_\d+_(.+)$/i)
        if (legacy?.[1]) normalized.add(legacy[1])

        // Officer review format: "{sectionIdx}.{itemKey}" or "{sectionIdx}.{groupKey}.{rowIdx}"
        const parts = fieldKey.split('.')
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          normalized.add(parts[1])
        }

        // LOB virtual keys from officer panel
        if (fieldKey === 'lob_description') {
          normalized.add('businessDescriptionText')
          normalized.add('aiLobRecommendation')
        }
        if (/^lob_activity_\d+$/i.test(fieldKey)) {
          normalized.add('businessActivities')
          normalized.add('aiLobRecommendation')
        }
      })

    return normalized
  }, [isRevisionMode, editingBusiness?.fieldReviewDecisions])

  // Visible sections for step-by-step tabs (depends on form definition + form values)
  const visibleSections = useMemo(() => {
    if (!formDefinition?.sections) return []
    return filterSectionsByFormValues(formDefinition.sections, formValues)
  }, [formDefinition, formValues])

  // Section completion: true if all required fields in that section have a value;
  // if a section has no required fields, true only when at least one field has a value
  // LOB (AI) section: complete only when user has clicked Analyze and has at least one line of business
  const sectionCompleteMap = useMemo(() => {
    const hasValue = (val) => {
      if (val === undefined || val === null) return false
      if (typeof val === 'string') return val.trim() !== ''
      if (typeof val === 'boolean') return true
      if (typeof val === 'number') return true
      if (Array.isArray(val)) {
        // Array must have at least one item with actual content
        if (val.length === 0) return false
        return val.some(item => {
          if (item === undefined || item === null) return false
          if (typeof item === 'string') return item.trim() !== ''
          if (typeof item === 'boolean') return true
          if (typeof item === 'number') return true
          if (typeof item === 'object' && item !== null) {
            // Object in array must have at least one non-empty value
            const objValues = Object.values(item)
            if (objValues.length === 0) return false
            return objValues.some(v => 
              v !== undefined && v !== null && v !== '' && 
              !(typeof v === 'string' && v.trim() === '')
            )
          }
          return false
        })
      }
      if (typeof val === 'object' && val !== null) {
        // Object must have at least one non-empty value
        const values = Object.values(val)
        if (values.length === 0) return false
        return values.some(v => {
          if (v === undefined || v === null) return false
          if (typeof v === 'string') return v.trim() !== ''
          if (typeof v === 'boolean') return true
          if (typeof v === 'number') return true
          if (Array.isArray(v)) return v.length > 0 && hasValue(v)
          if (typeof v === 'object' && v !== null) {
            return Object.values(v).some(nested => 
              nested !== undefined && nested !== null && nested !== '' &&
              !(typeof nested === 'string' && nested.trim() === '')
            )
          }
          return false
        })
      }
      return false
    }
    const map = {}
    visibleSections.forEach((section, idx) => {
      const items = section.items || []
      const isLobSection = items.some((f) => f.type === 'ai_lob_recommendation' || f.key === 'aiLobRecommendation')
      if (isLobSection) {
        map[idx] =
          Array.isArray(formValues.businessActivities) &&
          formValues.businessActivities.length > 0
        return
      }
      const requiredFields = items.filter((f) => f.required)
      if (requiredFields.length > 0) {
        const allFilled = requiredFields.every((field) => {
          const key = field.key || field.label
          const val = formValues[key]
          return hasValue(val)
        })
        map[idx] = allFilled
        return
      }
      // No required fields: section is complete only if at least one field has a real value
      // Filter to only items that have a key/label (actual form fields)
      const formFields = items.filter(f => f.key || f.label)
      if (formFields.length === 0) {
        map[idx] = false
        return
      }
      // Check if at least one field has a meaningful value
      const hasAtLeastOneValue = formFields.some((field) => {
        const key = field.key || field.label
        const val = formValues[key]
        return hasValue(val)
      })
      map[idx] = hasAtLeastOneValue
    })
    return map
  }, [visibleSections, formValues])

  // Map field name (or first part of nested name) to section index for scrolling to first error on validation fail
  const fieldToSectionIndex = useMemo(() => {
    const map = {}
    visibleSections.forEach((section, idx) => {
      ;(section.items || []).forEach((item) => {
        const name = item.key || item.label
        if (name) map[name] = idx
      })
      // LOB (AI) section uses these internal field names
      const isLobSection = (section.items || []).some(
        (f) => f.type === 'ai_lob_recommendation' || f.key === 'aiLobRecommendation'
      )
      if (isLobSection) {
        map.businessDescriptionText = idx
        map.hasAnalyzedBusinessDescription = idx
        map.businessActivities = idx
      }
    })
    return map
  }, [visibleSections])

  // Keep active tab in range when visible sections change
  useEffect(() => {
    if (visibleSections.length > 0 && activeSectionIndex >= visibleSections.length) {
      setActiveSectionIndex(-1)
    }
  }, [visibleSections.length, activeSectionIndex])

  // Restore draft from localStorage on initial mount (non-editing only)
  const draftRestoredRef = useRef(false)
  const initialTypeRef = useRef(initialRegistrationType)
  const draftCreatedRef = useRef(false)
  useEffect(() => {
    if (isEditing || draftRestoredRef.current) return
    draftRestoredRef.current = true
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft?.registrationType) setRegistrationType(draft.registrationType)
      if (draft?.generalPermitCategory) setGeneralPermitCategory(draft.generalPermitCategory)
      if (draft?.formValues && Object.keys(draft.formValues).length > 0) {
        setFormValues(draft.formValues)
      }
    } catch { /* ignore */ }
  }, [isEditing])

  // Persist draft to localStorage on form value changes
  useEffect(() => {
    if (isEditing || !hasUnsavedChanges) return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ registrationType, generalPermitCategory, formValues }))
    } catch { /* ignore */ }
  }, [formValues, hasUnsavedChanges, registrationType, generalPermitCategory, isEditing])

  // When switching to "Add" (editingBusiness becomes null), reset to type selection
  // BUT skip reset if initialRegistrationType is provided (coming from welcome modal)
  // When editingBusiness changes to a new business, update formValues immediately
  useEffect(() => {
    if (!editingBusiness && !initialTypeRef.current) {
      setStep('type_selection')
      setRegistrationType(null)
      setGeneralPermitCategory(null)
      setFormDefinition(null)
      setFormValues({})
      setDocumentCids({})
      setDraftBusinessId(null)
      setError(null)
      setLoading(false)
      setActiveSectionIndex(-1)
      setHasUnsavedChanges(false)
      form.resetFields()
    } else if (editingBusiness) {
      // When editingBusiness is set (e.g., after draft creation), update formValues immediately
      // so conditional sections are visible before formDefinition loads
      const initial = editingBusiness.formData || {}
      if (editingBusiness.category && !initial.generalPermitCategory) {
        setFormValues({ ...initial, generalPermitCategory: editingBusiness.category })
      } else {
        setFormValues(initial)
      }
      setGeneralPermitCategory(editingBusiness.category || null)
      setRegistrationType(editingBusiness.formType || 'permit')
    }
  }, [editingBusiness])

  // Load form definition when editing
  useEffect(() => {
    if (isEditing) {
      const type = editingBusiness?.formType || 'permit'
      fetchFormDefinition(type, editingBusiness?.category)
    }
  }, [isEditing, editingBusiness?.formType, editingBusiness?.category, editingBusiness?.businessId, editingBusiness?._id])

  // Set form values when editing and form definition is loaded
  useEffect(() => {
    if (isEditing && formDefinition && editingBusiness?.formData) {
      const values = formDataWithDayjs(editingBusiness.formData, formDefinition)
      // Ensure generalPermitCategory is set for conditional section visibility
      // (legacy drafts may have 'category' instead of 'generalPermitCategory')
      if (editingBusiness.category && !values.generalPermitCategory) {
        values.generalPermitCategory = editingBusiness.category
      }
      form.setFieldsValue(values)
      setFormValues(values)
      setHasUnsavedChanges(false)
    }
  }, [isEditing, formDefinition, editingBusiness?.formData, editingBusiness?.category, form])

  const { handleSubmit, submitting, error, setError } = useBusinessFormSubmit({
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
    setHasUnsavedChanges,
    updateFn,
  })

  useEffect(() => {
    onSubmittingChange?.(submitting)
  }, [submitting, onSubmittingChange])

  const fetchFormDefinition = async (type, category = null) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getActiveFormDefinition(type)

      if (response.success && response.definition) {
        setFormDefinition(response.definition)
        setActiveSectionIndex(-1)

        if (category && !isEditing) {
          setFormValues({ generalPermitCategory: category })
          form.setFieldValue('generalPermitCategory', category)
        }

        setStep('form')
      } else {
        setError(response.error || 'No active form definition found for this type.')
      }
    } catch (err) {
      console.error('Failed to fetch form definition:', err)
      setError(err.message || 'Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = useCallback(async (type) => {
    setRegistrationType(type)

    if (type === 'general_permit') {
      setStep('category_selection')
      return
    }

    // type === 'permit': create draft when onDraftCreated provided (dashboard flow), else load form in-place
    if (type === 'permit' && onDraftCreated && !isEditing) {
      setLoading(true)
      setError(null)
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
        setError(err.message || 'Failed to create draft.')
      } finally {
        setLoading(false)
      }
      return
    }

    fetchFormDefinition(type)
  }, [onDraftCreated, isEditing, message])

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
      setError(null)
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
        setError(err.message || 'Failed to create draft.')
      } finally {
        setLoading(false)
      }
      return
    }

    fetchFormDefinition('general_permit', category)
  }

  const handleFormValuesChange = (changedValues, allValues) => {
    setFormValues(allValues)
    setHasUnsavedChanges(true)
  }

  const doFillTestData = () => {
    if (!formDefinition) return
    const testData = generateTestDataForDefinition(formDefinition, generalPermitCategory)
    const processedTestData = formDataWithDayjs(testData, formDefinition)
    form.setFieldsValue(processedTestData)
    setFormValues(prev => ({ ...prev, ...processedTestData }))
    message.success('Form filled with test data')
  }

  useImperativeHandle(ref, () => ({
    submitApplication: () => form.submit(),
    saveDraft: async () => {
      try {
        const values = form.getFieldsValue(true)
        await handleSubmit(values, false)
      } catch (err) {
        message.error(err?.message || 'Failed to save draft')
      }
    },
    fillTestData: doFillTestData,
  }), [formDefinition, generalPermitCategory, form, handleSubmit])

  const handleStartNew = () => {
    setStep('type_selection')
    setRegistrationType(null)
    setGeneralPermitCategory(null)
    setFormDefinition(null)
    setError(null)
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

  const formReadOnly = readOnlyProp || (embedded && submitted)

  // Switch to first section if Overview is active when form becomes read-only
  useEffect(() => {
    if (formReadOnly && activeSectionIndex === -1) {
      setActiveSectionIndex(0)
    }
  }, [formReadOnly, activeSectionIndex])

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
        console.error('Auto-save failed:', err)
        // Don't show error message for auto-save failures to avoid disrupting UX
      }
    }

    autoSave()
    previousSectionRef.current = activeSectionIndex
  }, [activeSectionIndex, isEditing, draftBusinessId, formReadOnly, hasUnsavedChanges, submitting, form, handleSubmit])

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
              padding: 24,
            }}
          >
            {!embedded && (
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
                      onClick={async () => {
                        try {
                          const values = form.getFieldsValue(true)
                          await handleSubmit(values, false)
                        } catch (err) {
                          message.error(err?.message || 'Failed to save draft')
                        }
                      }}
                      loading={submitting}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="primary"
                      htmlType="button"
                      loading={submitting}
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const values = await form.validateFields()
                          await handleSubmit(values, true)
                        } catch (err) {
                          const errorFields = err?.errorFields || []
                          const firstErrorName = errorFields[0]?.name

                          const doSwitchAndFocus = () => {
                            let switched = false
                            // 1. Try DOM: find first error element
                            const firstErrorEl = document.querySelector('.ant-form-item-has-error')
                            if (firstErrorEl) {
                              const sectionWrapper = firstErrorEl.closest('[data-section-index]')
                              if (sectionWrapper != null) {
                                const idx = parseInt(sectionWrapper.getAttribute('data-section-index'), 10)
                                if (!Number.isNaN(idx)) {
                                  setActiveSectionIndex(idx)
                                  switched = true
                                }
                              }
                            }
                            // 2. Fallback: use field name from error
                            if (!switched && firstErrorName != null) {
                              const nameParts = Array.isArray(firstErrorName) ? firstErrorName : [firstErrorName]
                              for (const part of nameParts) {
                                const sectionIdx = fieldToSectionIndex[part]
                                if (typeof sectionIdx === 'number') {
                                  setActiveSectionIndex(sectionIdx)
                                  break
                                }
                              }
                            }
                            // 3. Fallback: iterate sections to find which contains this field
                            if (!switched && firstErrorName != null && visibleSections.length > 0) {
                              const searchKey = Array.isArray(firstErrorName) ? firstErrorName[0] : firstErrorName
                              const lobFieldNames = ['businessDescriptionText', 'hasAnalyzedBusinessDescription', 'businessActivities']
                              for (let i = 0; i < visibleSections.length; i++) {
                                const items = visibleSections[i].items || []
                                const hasField =
                                  items.some(
                                    (it) =>
                                      (it.key || it.label) === searchKey ||
                                      ((it.type === 'address' || it.type === 'address_alaminos') && (it.key || it.label) === searchKey)
                                  ) ||
                                  (lobFieldNames.includes(searchKey) &&
                                    items.some((it) => it.type === 'ai_lob_recommendation' || it.key === 'aiLobRecommendation'))
                                if (hasField) {
                                  setActiveSectionIndex(i)
                                  break
                                }
                              }
                            }
                            // 3. Focus and scroll
                            const firstErrorControl = document.querySelector(
                              '.ant-form-item-has-error input:not([type="hidden"]), .ant-form-item-has-error select, .ant-form-item-has-error textarea, .ant-form-item-has-error .ant-picker-input input, .ant-form-item-has-error .ant-input-number-input'
                            )
                            if (firstErrorControl) {
                              firstErrorControl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              if (typeof firstErrorControl.focus === 'function') firstErrorControl.focus()
                            }
                          }

                          // Run after React has applied Form error state to DOM
                          setTimeout(doSwitchAndFocus, 0)
                          setTimeout(doSwitchAndFocus, 150)
                        }
                      }}
                    >
                      Submit
                    </Button>
                  </Space>
                </div>

                {!isEditing && (
                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {registrationType === 'general_permit'
                        ? `General Permit - ${GENERAL_PERMIT_CATEGORIES.find(c => c.value === generalPermitCategory)?.label || 'Application'}`
                        : 'New Business Application'
                      }
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
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
                  onClick={async () => {
                    try {
                      const values = form.getFieldsValue(true)
                      await handleSubmit(values, false)
                    } catch (err) {
                      message.error(err?.message || 'Failed to save draft')
                    }
                  }}
                  loading={submitting}
                >
                  Save as Draft
                </Button>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={submitting}
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    try {
                      const values = await form.validateFields()
                      await handleSubmit(values, true)
                    } catch (err) {
                      const errorFields = err?.errorFields || []
                      const firstErrorName = errorFields[0]?.name

                      const doSwitchAndFocus = () => {
                        let switched = false
                        const firstErrorEl = document.querySelector('.ant-form-item-has-error')
                        if (firstErrorEl) {
                          const sectionWrapper = firstErrorEl.closest('[data-section-index]')
                          if (sectionWrapper != null) {
                            const idx = parseInt(sectionWrapper.getAttribute('data-section-index'), 10)
                            if (!Number.isNaN(idx)) {
                              setActiveSectionIndex(idx)
                              switched = true
                            }
                          }
                        }
                        if (!switched && firstErrorName != null) {
                          const nameParts = Array.isArray(firstErrorName) ? firstErrorName : [firstErrorName]
                          for (const part of nameParts) {
                            const sectionIdx = fieldToSectionIndex[part]
                            if (typeof sectionIdx === 'number') {
                              setActiveSectionIndex(sectionIdx)
                              break
                            }
                          }
                        }
                        if (!switched && firstErrorName != null && visibleSections.length > 0) {
                          const searchKey = Array.isArray(firstErrorName) ? firstErrorName[0] : firstErrorName
                          const lobFieldNames = ['businessDescriptionText', 'hasAnalyzedBusinessDescription', 'businessActivities']
                          for (let i = 0; i < visibleSections.length; i++) {
                            const items = visibleSections[i].items || []
                            const hasField =
                              items.some(
                                (it) =>
                                  (it.key || it.label) === searchKey ||
                                  ((it.type === 'address' || it.type === 'address_alaminos') && (it.key || it.label) === searchKey)
                              ) ||
                              (lobFieldNames.includes(searchKey) &&
                                items.some((it) => it.type === 'ai_lob_recommendation' || it.key === 'aiLobRecommendation'))
                            if (hasField) {
                              setActiveSectionIndex(i)
                              break
                            }
                          }
                        }
                        const firstErrorControl = document.querySelector(
                          '.ant-form-item-has-error input:not([type="hidden"]), .ant-form-item-has-error select, .ant-form-item-has-error textarea, .ant-form-item-has-error .ant-picker-input input, .ant-form-item-has-error .ant-input-number-input'
                        )
                        if (firstErrorControl) {
                          firstErrorControl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          if (typeof firstErrorControl.focus === 'function') firstErrorControl.focus()
                        }
                      }

                      setTimeout(doSwitchAndFocus, 0)
                      setTimeout(doSwitchAndFocus, 150)
                    }
                  }}
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
                gap: 24,
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              {/* Left panel: section tab buttons */}
              <div
                style={{
                  flexShrink: 0,
                  width: isMobile ? '100%' : 220,
                  minWidth: isMobile ? undefined : 220,
                  borderRight: isMobile ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                  paddingRight: isMobile ? 0 : 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  overflowY: isMobile ? 'visible' : 'auto',
                }}
              >
                {/* Overview tab - only show for drafts and editable forms */}
                {!formReadOnly && (
                  <Button
                    key="overview"
                    type={activeSectionIndex === -1 ? 'primary' : 'default'}
                    onClick={() => setActiveSectionIndex(-1)}
                    style={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      fontWeight: activeSectionIndex === -1 ? 600 : 400,
                      whiteSpace: 'normal',
                      height: 'auto',
                      minHeight: 40,
                      padding: '8px 12px',
                      lineHeight: 1.4,
                      marginBottom: 8,
                    }}
                  >
                    <DashboardOutlined style={{ marginRight: 8 }} />
                    Overview
                  </Button>
                )}
                
                {visibleSections.map((section, idx) => {
                  const isComplete = sectionCompleteMap[idx] === true
                  return (
                    <Button
                      key={idx}
                      type={idx === activeSectionIndex ? 'primary' : 'default'}
                      onClick={() => setActiveSectionIndex(idx)}
                      style={{
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        fontWeight: idx === activeSectionIndex ? 600 : 400,
                        whiteSpace: 'normal',
                        height: 'auto',
                        minHeight: 40,
                        padding: '8px 12px',
                        lineHeight: 1.4,
                      }}
                    >
                      {!formReadOnly && (
                        <CheckCircleOutlined
                          style={{
                            marginRight: 8,
                            color: idx === activeSectionIndex 
                              ? (isComplete ? '#fff' : 'rgba(255, 255, 255, 0.65)') // White or semi-transparent white for selected button
                              : (isComplete ? token.colorSuccess : token.colorTextDisabled), // Original colors for unselected
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {section.category || `Section ${idx + 1}`}
                    </Button>
                  )
                })}
              </div>

              {/* Right panel: scrollable form content */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  overflow: 'auto',
                  paddingTop: isMobile ? 16 : 0,
                  borderTop: isMobile ? `1px solid ${token.colorBorderSecondary}` : 'none',
                }}
              >
                {/* Overview content - show when activeSectionIndex is -1 */}
                {activeSectionIndex === -1 && (
                  <ApplicationOverview 
                    visibleSections={visibleSections}
                    sectionCompleteMap={sectionCompleteMap}
                    token={token}
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
                    businessId={editingBusiness?.businessId || editingBusiness?._id || draftBusinessId || null}
                    onDocumentCid={(key, cid) => setDocumentCids(prev => ({ ...prev, [key]: cid }))}
                    onSaveDraft={async () => {
                      try {
                        const values = form.getFieldsValue(true)
                        await handleSubmit(values, false)
                      } catch (err) {
                        console.error('Auto-save draft failed:', err)
                      }
                    }}
                    formDataKey={editingBusiness?.businessId ?? editingBusiness?._id ?? draftBusinessId ?? 'new'}
                    documents={(() => {
                      const lguDocs = editingBusiness?.lguDocuments || editingBusiness?.documentCids || {}
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
            ) : error ? (
              <Result
                status="error"
                title="Unable to Load Form"
                subTitle={error}
              />
            ) : step === 'type_selection' ? (
              <RegistrationTypeSelector onSelect={handleTypeSelect} />
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
    </>
  )
})
