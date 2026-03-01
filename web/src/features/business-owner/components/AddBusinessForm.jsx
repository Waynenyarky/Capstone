import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Typography, Button, Card, Space, Spin, Alert, Result, Grid, theme, Modal, App, Descriptions } from 'antd'
import { ArrowLeftOutlined, ShopOutlined, FileProtectOutlined, BugOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'
import { addBusiness, updateBusiness } from '../services/businessProfileService'
import { uploadFile as uploadFileToIpfs } from '../services/businessRegistrationService'
import { getFeePreview } from '../services/feeService'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness'
import DynamicFormRenderer, { filterSectionsByFormValues } from './DynamicFormRenderer'

const DRAFT_STORAGE_KEY = 'addBusinessFormDraft'

function FeePreviewCard({ lob }) {
  const [feeData, setFeeData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lob) { setFeeData(null); return }
    setLoading(true)
    getFeePreview(lob)
      .then(res => setFeeData(res?.data || res))
      .catch(() => setFeeData(null))
      .finally(() => setLoading(false))
  }, [lob])

  if (!lob) return null
  if (loading) return <Card size="small" style={{ marginBottom: 16 }}><Spin size="small" /> Loading fee estimate...</Card>
  if (!feeData?.feeConfig) return null

  const cfg = feeData.feeConfig
  const fmt = (v) => v != null ? `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'

  return (
    <Card size="small" title={<><DollarOutlined /> Fee Estimate</>} style={{ marginBottom: 16 }}>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Line of Business">{cfg.lineOfBusiness || lob}</Descriptions.Item>
        {cfg.mayorPermitFee != null && <Descriptions.Item label="Mayor's Permit Fee">{fmt(cfg.mayorPermitFee)}</Descriptions.Item>}
        {cfg.businessTax != null && <Descriptions.Item label="Business Tax">{fmt(cfg.businessTax)}</Descriptions.Item>}
        {cfg.sanitaryFee != null && <Descriptions.Item label="Sanitary Fee">{fmt(cfg.sanitaryFee)}</Descriptions.Item>}
        {cfg.fireSafetyFee != null && <Descriptions.Item label="Fire Safety Fee">{fmt(cfg.fireSafetyFee)}</Descriptions.Item>}
        {cfg.environmentalFee != null && <Descriptions.Item label="Environmental Fee">{fmt(cfg.environmentalFee)}</Descriptions.Item>}
      </Descriptions>
      <Alert type="info" message="This is an estimate. Final fees will be calculated during processing." showIcon style={{ marginTop: 8 }} />
    </Card>
  )
}

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

function createMockFile(fieldName) {
  const fileName = `${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}_sample.pdf`
  const mockContent = new Blob(['Mock PDF content for testing'], { type: 'application/pdf' })
  const file = new File([mockContent], fileName, { type: 'application/pdf' })

  return {
    uid: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: fileName,
    status: 'done',
    originFileObj: file,
    type: 'application/pdf',
    size: mockContent.size,
  }
}

// Alaminos City, Pangasinan – PSGC codes for test data (full address shape for PhilippineAddressFields)
const ALAMINOS_TEST_ADDRESS = {
  streetAddress: '123 Rizal Street',
  province: '015500000',
  provinceName: 'Pangasinan',
  city: '015503000',
  cityName: 'City of Alaminos',
  barangay: '015503021',
  barangayName: 'Poblacion',
  postalCode: '2404',
}

/** Convert date fields in formData to dayjs so Ant Design DatePicker does not throw .isValid is not a function */
function formDataWithDayjs(formData, definition) {
  if (!formData || typeof formData !== 'object') return formData
  const dateKeys = new Set()
  const repeatableDateKeys = {}
  ;(definition?.sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      const key = item.key || item.label
      if (item.type === 'date') dateKeys.add(key)
      if (item.type === 'repeatable_group' && item.groupFields?.length) {
        const groupDateKeys = new Set()
        item.groupFields.forEach((gf) => {
          if (gf.type === 'date') groupDateKeys.add(gf.key || gf.label)
        })
        if (groupDateKeys.size) repeatableDateKeys[key] = groupDateKeys
      }
    })
  })
  const out = { ...formData }
  dateKeys.forEach((k) => {
    const v = out[k]
    if (v != null && v !== '' && !dayjs.isDayjs(v) && (typeof v === 'string' || typeof v === 'number')) {
      const d = dayjs(v)
      if (d.isValid()) out[k] = d
    }
  })
  Object.keys(repeatableDateKeys).forEach((listKey) => {
    if (!Array.isArray(out[listKey])) return
    out[listKey] = out[listKey].map((row) => {
      if (!row || typeof row !== 'object') return row
      const r = { ...row }
      repeatableDateKeys[listKey].forEach((fk) => {
        const v = r[fk]
        if (v != null && v !== '' && !dayjs.isDayjs(v) && (typeof v === 'string' || typeof v === 'number')) {
          const d = dayjs(v)
          if (d.isValid()) r[fk] = d
        }
      })
      return r
    })
  })
  return out
}

function generateTestDataForField(field) {
  const fieldName = field.key || field.label

  switch (field.type) {
    case 'text':
      if (fieldName.toLowerCase().includes('name')) return 'Juan Dela Cruz'
      if (fieldName.toLowerCase().includes('email')) return 'juan.delacruz@example.com'
      if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('contact')) return '09171234567'
      if (fieldName.toLowerCase().includes('tin')) return '123-456-789-000'
      if (fieldName.toLowerCase().includes('business') && fieldName.toLowerCase().includes('name')) return 'ABC Trading Corp.'
      return `Test ${field.label || 'Value'}`

    case 'textarea':
      return `This is sample text for ${field.label || 'this field'}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`

    case 'number':
      if (fieldName.toLowerCase().includes('capital')) return 500000
      if (fieldName.toLowerCase().includes('employee')) return 10
      if (fieldName.toLowerCase().includes('gross')) return 1200000
      if (fieldName.toLowerCase().includes('area') || fieldName.toLowerCase().includes('sqm')) return 150
      return 100

    case 'date': {
      const key = (fieldName || '').toLowerCase()
      if (key.includes('birth') || key.includes('dob')) {
        return dayjs().subtract(30, 'year')
      }
      if (key.includes('registration') || key.includes('application') || key.includes('dateofapplication')) {
        return dayjs().subtract(1, 'year')
      }
      return dayjs().subtract(1, 'month')
    }

    case 'select':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions[0]
      }
      return null

    case 'multiselect':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions.slice(0, Math.min(2, field.dropdownOptions.length))
      }
      return []

    case 'checkbox':
      return true

    case 'file':
      return [createMockFile(fieldName)]

    case 'download':
      return undefined

    case 'address':
    case 'address_alaminos':
      return undefined

    case 'repeatable_group':
      const groupFields = field.groupFields || []
      if (groupFields.length === 0) return [{}]
      const row = {}
      groupFields.forEach(gf => {
        const gfName = gf.key || gf.label
        if (gf.type === 'select' && gf.dropdownOptions?.length > 0) {
          row[gfName] = gf.dropdownOptions[0]
        } else if (gf.type === 'number') {
          row[gfName] = 100
        } else {
          row[gfName] = `Test ${gf.label || 'Value'}`
        }
      })
      return [row]

    default:
      return `Test ${field.label || 'Value'}`
  }
}

function generateTestDataForDefinition(definition, category = null) {
  const testData = {}

  if (category) {
    testData.category = category
  }

  const sections = definition?.sections || []

  sections.forEach(section => {
    const items = section.items || []
    items.forEach(field => {
      const fieldName = field.key || field.label
      if (field.type === 'address') {
        testData[fieldName] = { ...ALAMINOS_TEST_ADDRESS }
        return
      }
      if (field.type === 'address_alaminos') {
        testData[fieldName] = {
          streetAddress: ALAMINOS_TEST_ADDRESS.streetAddress,
          barangay: ALAMINOS_TEST_ADDRESS.barangay,
          barangayName: ALAMINOS_TEST_ADDRESS.barangayName,
          postalCode: ALAMINOS_TEST_ADDRESS.postalCode,
        }
        return
      }
      if (field.type === 'ai_lob_recommendation') {
        // LOB section uses hidden fields; set them so prefill includes line of business
        const firstLob = LINE_OF_BUSINESS[0]
        const firstDetailed = firstLob?.detailedLines?.[0]
        const firstPsic = firstLob?.psicCodes?.[0] || ''
        testData.businessDescriptionText = 'Retail store selling groceries and general merchandise.'
        testData.hasAnalyzedBusinessDescription = true
        testData.businessActivities = firstLob && firstDetailed
          ? [{ taxCode: firstLob.taxCode, lineOfBusiness: firstLob.lineOfBusiness, detailedLineOfBusiness: firstDetailed, psicCode: firstPsic }]
          : []
        return
      }
      const value = generateTestDataForField(field)
      if (value !== undefined) {
        testData[fieldName] = value
      }
    })
  })

  return testData
}

const GENERAL_PERMIT_CATEGORIES = [
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'association_foundation', label: 'Association / Foundation' },
  { value: 'chainsaw', label: 'Chainsaw Permit' },
  { value: 'firecrackers_stallholders', label: 'Firecrackers Stallholders' },
  { value: 'bazaar_festival_vendors', label: 'Bazaar / Festival Vendors' },
  { value: 'peddlers', label: 'Peddlers' },
  { value: 'promotions_exhibitors', label: 'Promotions / Exhibitors' },
  { value: 'cemetery_stallholders', label: 'Cemetery Stallholders' },
  { value: 'fish_trap_fish_pen', label: 'Fish Trap / Fish Pen' },
  { value: 'fish_pond', label: 'Fish Pond' },
]

function RegistrationTypeSelector({ onSelect, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const options = [
    {
      key: 'permit',
      icon: <ShopOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
      title: 'New Business Application',
      description: 'Apply for a new Unified Business Permit for your business.',
    },
    {
      key: 'general_permit',
      icon: <FileProtectOutlined style={{ fontSize: 32, color: token.colorSuccess }} />,
      title: 'General Permit',
      description: 'Apply for special permits such as Cooperative, Peddlers, Fish Pond, etc.',
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>What would you like to do?</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Select the type of application you want to submit.
      </Paragraph>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 16
      }}>
        {options.map((option) => (
          <Card
            key={option.key}
            hoverable
            onClick={() => onSelect(option.key)}
            style={{
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              transition: 'all 0.2s',
            }}
            styles={{
              body: { padding: 24 }
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgLayout,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {option.icon}
              </div>
              <Title level={5} style={{ margin: 0 }}>{option.title}</Title>
              <Text type="secondary">{option.description}</Text>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GeneralPermitCategorySelector({ onSelect, onBack, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Back to selection
      </Button>

      <Title level={4} style={{ marginBottom: 8 }}>Select Permit Category</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Choose the type of general permit you want to apply for.
      </Paragraph>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 12
      }}>
        {GENERAL_PERMIT_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            size="small"
            onClick={() => onSelect(category.value)}
            style={{
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
            }}
            styles={{
              body: { padding: '12px 16px' }
            }}
          >
            <Text strong>{category.label}</Text>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default forwardRef(function AddBusinessForm({ onBack, editingBusiness, onDraftCreated, embedded = false, onSubmittingChange, readOnly: readOnlyProp = false, onSubmitted }, ref) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [form] = Form.useForm()

  const isEditing = !!editingBusiness
  const [step, setStep] = useState(isEditing ? 'form' : 'type_selection')
  const [registrationType, setRegistrationType] = useState(editingBusiness?.formType || null)
  const [generalPermitCategory, setGeneralPermitCategory] = useState(editingBusiness?.category || null)
  const [formDefinition, setFormDefinition] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formValues, setFormValues] = useState(editingBusiness?.formData || {})
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false)
  const [documentCids, setDocumentCids] = useState({})
  const [draftBusinessId, setDraftBusinessId] = useState(null)

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
      if (Array.isArray(val)) return val.length > 0
      if (typeof val === 'object') return Object.keys(val).length > 0 && Object.values(val).some((v) => v !== undefined && v !== null && v !== '')
      return true
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
      // No required fields: complete only if at least one field in this section has a value
      const atLeastOneFilled = items.some((field) => {
        const key = field.key || field.label
        const val = formValues[key]
        return hasValue(val)
      })
      map[idx] = atLeastOneFilled
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
      setActiveSectionIndex(0)
    }
  }, [visibleSections.length, activeSectionIndex])

  // Restore draft from localStorage on initial mount (non-editing only)
  const draftRestoredRef = useRef(false)
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
  useEffect(() => {
    if (!editingBusiness) {
      setStep('type_selection')
      setRegistrationType(null)
      setGeneralPermitCategory(null)
      setFormDefinition(null)
      setFormValues({})
      setDocumentCids({})
      setDraftBusinessId(null)
      setError(null)
      setLoading(false)
      setActiveSectionIndex(0)
      setHasUnsavedChanges(false)
      form.resetFields()
    }
  }, [editingBusiness])

  // Load form definition when editing
  useEffect(() => {
    if (isEditing && editingBusiness?.formType) {
      fetchFormDefinition(editingBusiness.formType, editingBusiness.category)
    }
  }, [isEditing, editingBusiness?.formType, editingBusiness?.category, editingBusiness?.businessId, editingBusiness?._id])

  // Set form values when editing and form definition is loaded
  useEffect(() => {
    if (isEditing && formDefinition && editingBusiness?.formData) {
      const values = formDataWithDayjs(editingBusiness.formData, formDefinition)
      form.setFieldsValue(values)
      setFormValues(values)
      setHasUnsavedChanges(false)
    }
  }, [isEditing, formDefinition, editingBusiness?.formData, form])

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
        setActiveSectionIndex(0)

        if (category && !isEditing) {
          setFormValues({ category })
          form.setFieldValue('category', category)
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

  const handleTypeSelect = async (type) => {
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
  }

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
          formData: { category },
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

  const handleBackToTypeSelection = () => {
    setStep('type_selection')
    setRegistrationType(null)
    setGeneralPermitCategory(null)
    setFormDefinition(null)
    setError(null)
    form.resetFields()
    setFormValues({})
    setActiveSectionIndex(0)
  }

  const handleBackToCategorySelection = () => {
    setStep('category_selection')
    setFormDefinition(null)
    setError(null)
    form.resetFields()
    setFormValues({ category: generalPermitCategory })
    setActiveSectionIndex(0)
  }

  const handleFormValuesChange = (changedValues, allValues) => {
    setFormValues(allValues)
    setHasUnsavedChanges(true)
  }

  const handleSubmit = async (values, shouldSubmit = true, onSuccess) => {
    setSubmitting(true)

    try {
      // When saving draft while editing, merge with existing formData so we don't overwrite with partial data
      const existingFormData = isEditing && editingBusiness?.formData && typeof editingBusiness.formData === 'object' && !shouldSubmit
        ? editingBusiness.formData
        : {}
      const mergedValues = { ...existingFormData }
      Object.entries(values || {}).forEach(([k, v]) => {
        if (v !== undefined) mergedValues[k] = v
      })

      const processedValues = { ...mergedValues }
      Object.keys(processedValues).forEach(key => {
        const val = processedValues[key]
        if (Array.isArray(val) && val.length > 0 && val[0]?.originFileObj) {
          processedValues[key] = val.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            status: 'pending_upload',
          }))
        }
        // Keep file fields that have cid (uploaded to IPFS) as metadata only for formData
        if (Array.isArray(val) && val.length > 0 && val[0]?.cid) {
          processedValues[key] = val.map(f => ({ name: f.name, status: 'done', cid: f.cid }))
        }
      })

      // Build documentCids from state (set by upload callback) and from form values (file fields with cid)
      const cidsFromForm = {}
      ;(formDefinition?.sections || []).forEach(section => {
        (section.items || []).forEach(item => {
          if (item.type === 'file') {
            const key = item.documentKey || item.key || item.label
            if (!key) return
            const val = values[key]
            if (Array.isArray(val) && val.length > 0 && val[0]?.cid) {
              cidsFromForm[key] = val[0].cid
            }
          }
        })
      })
      const payloadDocumentCids = { ...documentCids, ...cidsFromForm }

      const extractedBusinessType = processedValues['Industry'] ||
        processedValues['industry'] ||
        processedValues['Industry Classification'] ||
        processedValues['industryClassification'] ||
        processedValues['PSIC Section'] ||
        null

      const primaryFromForm = processedValues['Business Type'] || processedValues['businessType'] || processedValues['Line of Business'] || processedValues['lineOfBusiness']
      const primaryFromActivities = Array.isArray(processedValues.businessActivities) && processedValues.businessActivities.length > 0
        ? processedValues.businessActivities[0].lineOfBusiness
        : null
      const primaryLineOfBusiness = primaryFromForm || primaryFromActivities || null

      const payload = {
        formType: registrationType,
        formDefinitionId: formDefinition?._id,
        applicationStatus: shouldSubmit ? 'submitted' : 'draft',
        ...(shouldSubmit && { submittedAt: new Date().toISOString() }),
        ...(generalPermitCategory && { category: generalPermitCategory }),
        formData: processedValues,
        ...(Object.keys(payloadDocumentCids).length > 0 && { documentCids: payloadDocumentCids }),
        businessName: processedValues['Business Name'] || processedValues['businessName'] || processedValues['Trade Name'] || processedValues['tradeName'] || 'New Business Application',
        ...(extractedBusinessType && { businessType: extractedBusinessType }),
        primaryLineOfBusiness,
        tinNumber: processedValues['TIN'] || processedValues['tin'] || processedValues['TIN Number'] || null,
        contactNumber: processedValues['Contact Number'] || processedValues['contactNumber'] || processedValues['Phone'] || processedValues['phone'] || null,
        email: processedValues['Email'] || processedValues['email'] || processedValues['Business Email'] || null,
        capitalInvestment: processedValues['Capital Investment'] || processedValues['capitalInvestment'] || null,
        numberOfEmployees: processedValues['Number of Employees'] || processedValues['numberOfEmployees'] || processedValues['Employee Count'] || null,
      }

      let response
      if (isEditing) {
        const businessId = editingBusiness.businessId || editingBusiness._id

        if (shouldSubmit && Object.keys(payloadDocumentCids).length === 0) {
          const fileFieldsWithFiles = []
          ;(formDefinition?.sections || []).forEach(section => {
            (section.items || []).forEach(item => {
              if (item.type === 'file') {
                const key = item.documentKey || item.key || item.label
                if (!key) return
                const val = values[key]
                if (!Array.isArray(val) || val.length === 0) return
                const first = val[0]
                const file = first?.originFileObj ?? first?.file ?? (typeof first === 'object' && first && 'size' in first && 'name' in first ? first : null)
                if (file && typeof file === 'object' && file.name && file instanceof File) {
                  fileFieldsWithFiles.push({ key, file })
                }
              }
            })
          })

          if (fileFieldsWithFiles.length > 0) {
            const uploadedCids = {}
            for (const { key, file } of fileFieldsWithFiles) {
              try {
                const res = await uploadFileToIpfs(businessId, file, key)
                const cid = res?.cid || res?.ipfsCid
                if (cid) uploadedCids[key] = cid
              } catch (uploadErr) {
                console.error('IPFS upload failed for', key, uploadErr)
                message.warning(`Upload failed for ${key}; submitting without this document.`)
              }
            }
            if (Object.keys(uploadedCids).length > 0) {
              payload.documentCids = { ...payloadDocumentCids, ...uploadedCids }
            }
          }
        }

        response = await updateBusiness(businessId, payload)
        message.success(shouldSubmit ? 'Application updated and submitted!' : 'Application saved as draft!')
        if (shouldSubmit) {
          setSubmitted(true)
          setHasUnsavedChanges(false)
          try { localStorage.removeItem(DRAFT_STORAGE_KEY) } catch { /* ignore */ }
          onSuccess?.()
          onSubmitted?.(response)
        }
      } else {
        // New application: if user submitted with file(s) but no draft (no businessId), create draft first, upload files, then submit
        const fileFieldsWithFiles = []
        ;(formDefinition?.sections || []).forEach(section => {
          (section.items || []).forEach(item => {
            if (item.type === 'file') {
              const key = item.documentKey || item.key || item.label
              if (!key) return
              const val = values[key]
              if (!Array.isArray(val) || val.length === 0) return
              const first = val[0]
              const file = first?.originFileObj ?? first?.file ?? (typeof first === 'object' && first && 'size' in first && 'name' in first ? first : null)
              if (file && typeof file === 'object' && file.name) {
                fileFieldsWithFiles.push({ key, file })
              }
            }
          })
        })

        if (shouldSubmit && fileFieldsWithFiles.length > 0 && Object.keys(payloadDocumentCids).length === 0) {
          const draftPayload = { ...payload, applicationStatus: 'draft' }
          delete draftPayload.submittedAt
          delete draftPayload.documentCids
          response = await addBusiness(draftPayload)
          if (!response.businessId) throw new Error('Failed to create application')
          const businessId = response.businessId
          const uploadedCids = {}
          for (const { key, file } of fileFieldsWithFiles) {
            try {
              const res = await uploadFileToIpfs(businessId, file, key)
              const cid = res?.cid || res?.ipfsCid
              if (cid) uploadedCids[key] = cid
            } catch (uploadErr) {
              console.error('IPFS upload failed for', key, uploadErr)
              message.warning(`Upload failed for ${key}; submitting without this document.`)
            }
          }
          const finalPayload = {
            ...payload,
            ...(Object.keys(uploadedCids).length > 0 && { documentCids: { ...payloadDocumentCids, ...uploadedCids } }),
          }
          response = await updateBusiness(businessId, finalPayload)
          message.success('Application submitted successfully!')
          setSubmitted(true)
          setHasUnsavedChanges(false)
          onSuccess?.()
          onSubmitted?.(response)
        } else {
          response = await addBusiness(payload)
          if (response.businessId) {
            if (!shouldSubmit) {
              setDraftBusinessId(response.businessId)
            }
            message.success(shouldSubmit ? 'Application submitted successfully!' : 'Application saved as draft!')
            if (shouldSubmit) {
              setSubmitted(true)
              setHasUnsavedChanges(false)
              onSuccess?.()
              onSubmitted?.(response)
            }
          } else {
            throw new Error('Failed to create business application')
          }
        }
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
      message.error(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const doFillTestData = () => {
    if (!formDefinition) return
    const testData = generateTestDataForDefinition(formDefinition, generalPermitCategory)
    form.setFieldsValue(testData)
    setFormValues(prev => ({ ...prev, ...testData }))
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
    setActiveSectionIndex(0)
  }

  if (submitted && !embedded) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="success"
          title="Application Submitted!"
          subTitle="Your application has been submitted successfully. You will be notified once it has been reviewed."
          extra={[
            <Button key="dashboard" type="primary" onClick={onBack}>
              Back to Dashboard
            </Button>,
            <Button key="new" onClick={handleStartNew}>
              Submit Another Application
            </Button>,
          ]}
        />
      </div>
    )
  }

  const formReadOnly = readOnlyProp || (embedded && submitted)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {step === 'form' && formDefinition ? (
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
                {isEditing && (
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        setShowLeaveConfirmModal(true)
                      } else {
                        onBack()
                      }
                    }}
                    style={{ padding: 0 }}
                  >
                    Back
                  </Button>
                )}
                <Space wrap style={{ marginLeft: isEditing ? undefined : 'auto' }}>
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
                    Save
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
                        handleSubmit(values, true)
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
                                    (it.type === 'address' || it.type === 'address_alaminos') && (it.key || it.label) === searchKey
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
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={registrationType === 'general_permit' ? handleBackToCategorySelection : handleBackToTypeSelection}
                  style={{ marginBottom: 16, padding: 0 }}
                >
                  {registrationType === 'general_permit' ? 'Back to category selection' : 'Back to selection'}
                </Button>
              )}

              <Title level={4} style={{ marginBottom: 4 }}>
                {isEditing
                  ? `Edit Application - ${editingBusiness?.businessName || 'Business'}`
                  : registrationType === 'permit'
                    ? 'New Business Application'
                    : `General Permit - ${GENERAL_PERMIT_CATEGORIES.find(c => c.value === generalPermitCategory)?.label || 'Application'}`
                }
              </Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Complete each section below. 
              </Paragraph>
            </div>
          )}

          {/* Form with two-panel layout */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleFormValuesChange}
            initialValues={isEditing ? {} : formValues}
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
                            color: isComplete ? token.colorSuccess : token.colorTextDisabled,
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
                {/* Fee preview when LOB is selected */}
                <FeePreviewCard lob={
                  Array.isArray(formValues.businessActivities) && formValues.businessActivities.length > 0
                    ? formValues.businessActivities[0].lineOfBusiness
                    : null
                } />

                <DynamicFormRenderer
                  definition={formDefinition}
                  form={form}
                  formValues={formValues}
                  isMobile={isMobile}
                  activeSectionIndex={activeSectionIndex}
                  readOnly={formReadOnly}
                  businessId={editingBusiness?.businessId || editingBusiness?._id || draftBusinessId || null}
                  onDocumentCid={(key, cid) => setDocumentCids(prev => ({ ...prev, [key]: cid }))}
                  formDataKey={editingBusiness?.businessId ?? editingBusiness?._id ?? draftBusinessId ?? 'new'}
                />
              </div>
            </div>
          </Form>
        </div>
      ) : (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (hasUnsavedChanges) {
                setShowLeaveConfirmModal(true)
              } else {
                onBack()
              }
            }}
            style={{ marginBottom: 24, alignSelf: 'flex-start' }}
          >
            {isEditing ? 'Back' : 'Back to Dashboard'}
          </Button>

          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Loading form...</Text>
                </div>
              </div>
            ) : error ? (
              <Alert
                type="error"
                message="Unable to Load Form"
                description={error}
                showIcon
                action={
                  <Button size="small" onClick={handleBackToTypeSelection}>
                    Go Back
                  </Button>
                }
              />
            ) : step === 'type_selection' ? (
              <RegistrationTypeSelector onSelect={handleTypeSelect} token={token} />
            ) : step === 'category_selection' ? (
              <GeneralPermitCategorySelector
                onSelect={handleCategorySelect}
                onBack={handleBackToTypeSelection}
                token={token}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Keep form instance connected when not on form step (avoids Ant Design useForm warning) */}
      {(step !== 'form' || !formDefinition) && <Form form={form} style={{ display: 'none' }} />}

      <Modal
          title="Unsaved changes"
          open={showLeaveConfirmModal}
          onCancel={() => setShowLeaveConfirmModal(false)}
          footer={[
            <Button key="stay" onClick={() => setShowLeaveConfirmModal(false)}>
              Stay
            </Button>,
            <Button key="leave" onClick={() => {
              setShowLeaveConfirmModal(false)
              onBack()
            }}>
              Leave without saving
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={submitting}
              onClick={async () => {
                try {
                  const values = form.getFieldsValue(true)
                  await handleSubmit(values, false, () => {
                    setShowLeaveConfirmModal(false)
                    onBack()
                  })
                } catch (err) {
                  message.error(err?.message || 'Failed to save draft')
                }
              }}
            >
              Save draft and leave
            </Button>,
          ]}
        >
        You have unsaved changes. Do you want to save your progress before leaving?
      </Modal>
    </div>
  )
})
