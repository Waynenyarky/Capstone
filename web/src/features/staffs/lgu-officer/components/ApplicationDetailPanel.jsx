import React, { useState, useEffect } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Typography, Tag, Button, Descriptions, Space, theme, Empty, Radio, Input, Alert, Badge, Spin, Image, Modal, App, Select, Popover, Progress, Collapse, message } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  RobotOutlined,
  UserOutlined,
  ShopOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { PermitApplicationService } from '@/features/lgu-officer/infrastructure/services'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import { filterSectionsByFormValues } from '@/features/business-owner/components/DynamicFormRenderer'
import {
  getFieldKey,
  REJECTION_REASON_OPTIONS,
  REASON_OTHER_CODE,
  LOB_FIELD_DESCRIPTION,
  getLobActivityFieldKey,
  getReviewableFieldKeys,
} from '../constants/rejectionReasons'
import OwnerInfoReadOnlyView from './OwnerInfoReadOnlyView'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness'

const { Text, Title } = Typography
const { TextArea } = Input

/** Get a single displayable file URL from form value (string CID/URL or fileList item with cid/url) */
function getFileUrlFromFormValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first && typeof first === 'object') {
      const cid = first.cid || first.response?.cid
      const url = first.url || first.response?.url
      if (url && typeof url === 'string') return url
      if (cid && typeof cid === 'string') return cid
    }
  }
  return ''
}

/** Inline Accept/Reject UI for one field */
function FieldDecisionControl({ fieldKey, decision, onAccept, onReject, token }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reasonCode, setReasonCode] = useState(undefined)
  const [reasonOther, setReasonOther] = useState('')

  const handleConfirmReject = () => {
    if (reasonCode === REASON_OTHER_CODE && !reasonOther?.trim()) return
    onReject(fieldKey, { status: 'rejected', reasonCode: reasonCode || undefined, reasonOther: reasonCode === REASON_OTHER_CODE ? reasonOther?.trim() : undefined })
    setRejectOpen(false)
    setReasonCode(undefined)
    setReasonOther('')
  }

  const rejectContent = (
    <Space direction="vertical" size={8} style={{ width: 280 }}>
      <Select
        placeholder="Select reason"
        options={REJECTION_REASON_OPTIONS}
        value={reasonCode}
        onChange={(v) => { setReasonCode(v); if (v !== REASON_OTHER_CODE) setReasonOther('') }}
        style={{ width: '100%' }}
      />
      {reasonCode === REASON_OTHER_CODE && (
        <TextArea
          placeholder="Specify reason (required)"
          value={reasonOther}
          onChange={(e) => setReasonOther(e.target.value)}
          rows={2}
        />
      )}
      <Button type="primary" danger size="small" onClick={handleConfirmReject} disabled={reasonCode === REASON_OTHER_CODE && !reasonOther?.trim()}>
        Confirm Reject
      </Button>
    </Space>
  )

  if (decision) {
    const isAccepted = decision.status === 'accepted'
    const reasonText = decision.status === 'rejected'
      ? (decision.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === decision.reasonCode)?.label || decision.reasonCode || 'Rejected')
      : ''
    return (
      <Space size={8}>
        {isAccepted ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Accepted</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>Rejected{reasonText ? `: ${reasonText}` : ''}</Tag>
        )}
        {isAccepted ? (
          <Popover open={rejectOpen} onOpenChange={setRejectOpen} content={rejectContent} trigger="click">
            <Button type="link" size="small">Change</Button>
          </Popover>
        ) : (
          <Button type="link" size="small" onClick={() => onAccept(fieldKey)}>Change</Button>
        )}
      </Space>
    )
  }

  return (
    <Space size={8}>
      <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => onAccept(fieldKey)}>Accept</Button>
      <Popover open={rejectOpen} onOpenChange={setRejectOpen} content={rejectContent} trigger="click">
        <Button size="small" danger icon={<CloseCircleOutlined />}>Reject</Button>
      </Popover>
    </Space>
  )
}

/** Render one form section as read-only with document/file viewers and per-field Accept/Reject */
function SectionReadOnlyContent({
  section,
  sectionIdx,
  formData,
  documents = {},
  token,
  formatDate,
  formatBoolean,
  formatCurrency,
  formatNumber,
  DocumentViewer,
  onViewDocument,
  primaryLineOfBusiness,
  fieldReviewDecisions = {},
  onFieldDecision,
}) {
  const items = section?.items || []
  if (!items.length) {
    return <Text type="secondary">No fields in this section.</Text>
  }

  const handleAccept = (fieldKey) => {
    if (onFieldDecision) onFieldDecision(fieldKey, { status: 'accepted' })
  }
  const handleReject = (fieldKey, payload) => {
    if (onFieldDecision) onFieldDecision(fieldKey, payload)
  }

  return (
    <Descriptions column={1} size="small" bordered>
      {items.map((item, idx) => {
        const key = item.key || item.label
        const value = formData?.[key]
        const label = item.label || key || `Field ${idx + 1}`

        const renderValue = () => {
          // Line of Business (AI): skip here; LOB section is rendered by LobReviewBlock
          if (item.type === 'ai_lob_recommendation' || key === 'aiLobRecommendation') {
            return null
          }
          if (item.type === 'file') {
            const urlFromForm = getFileUrlFromFormValue(value)
            const url = urlFromForm || documents[item.documentKey] || documents[key] || documents[item.label] || ''
            return <DocumentViewer url={url} label={label} onViewDocument={onViewDocument} />
          }
          if (item.type === 'date') {
            return formatDate(value)
          }
          if (item.type === 'checkbox') {
            return formatBoolean(value)
          }
          if (item.type === 'number') {
            return formatNumber(value)
          }
          if (item.type === 'currency') {
            return formatCurrency(value)
          }
          if (item.type === 'select') {
            const opts = item.dropdownOptions || []
            const option = opts.find((o) => (typeof o === 'object' ? o.value === value : o === value))
            const display = typeof option === 'object' ? option?.label : option
            return display != null ? String(display) : (value != null && value !== '' ? String(value) : 'N/A')
          }
          if (item.type === 'repeatable_group') {
            if (!Array.isArray(value) || value.length === 0) return 'N/A'
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {value.map((row, i) => (
                  <div key={i} style={{ padding: 8, background: token.colorFillQuaternary, borderRadius: token.borderRadius }}>
                    {(item.groupFields || []).map((gf) => {
                      const gk = gf.key || gf.label
                      const gv = row?.[gk]
                      const gLabel = gf.label || gk
                      const gDisplay = gf.type === 'date' ? formatDate(gv) : (gv != null && gv !== '' ? String(gv) : '—')
                      return <div key={gk}><Text type="secondary" style={{ fontSize: 12 }}>{gLabel}: </Text>{gDisplay}</div>
                    })}
                  </div>
                ))}
              </div>
            )
          }
          if (item.type === 'address' || item.type === 'address_alaminos') {
            const prefix = key
            const parts = [
              formData?.[`${prefix}_streetAddress`] || formData?.[`${prefix}_street`],
              formData?.[`${prefix}_barangay`] || formData?.[`${prefix}_barangayName`],
              formData?.[`${prefix}_city`] || formData?.[`${prefix}_cityName`],
              formData?.[`${prefix}_province`] || formData?.[`${prefix}_provinceName`],
              formData?.[`${prefix}_postalCode`] || formData?.[`${prefix}_zipCode`]
            ].filter(Boolean)
            return parts.length ? parts.join(', ') : 'N/A'
          }
          if (item.type === 'download') return null
          return value != null && value !== '' ? String(value) : 'N/A'
        }

        const rendered = renderValue()
        if (rendered === null) return null

        const showDecision = onFieldDecision && (item.type !== 'repeatable_group' ? true : Array.isArray(value) && value.length > 0)

        if (item.type === 'repeatable_group' && Array.isArray(value) && value.length > 0) {
          return (
            <React.Fragment key={idx}>
              {value.map((row, i) => {
                const fk = getFieldKey(sectionIdx, item, i)
                const dec = fieldReviewDecisions[fk]
                const gLabel = item.label || item.key || `Row ${i + 1}`
                const rowContent = (
                  <div style={{ padding: 8, background: token.colorFillQuaternary, borderRadius: token.borderRadius }}>
                    {(item.groupFields || []).map((gf) => {
                      const gk = gf.key || gf.label
                      const gv = row?.[gk]
                      const gl = gf.label || gk
                      const gDisplay = gf.type === 'date' ? formatDate(gv) : (gv != null && gv !== '' ? String(gv) : '—')
                      return <div key={gk}><Text type="secondary" style={{ fontSize: 12 }}>{gl}: </Text>{gDisplay}</div>
                    })}
                  </div>
                )
                return (
                  <Descriptions.Item key={fk} label={`${gLabel} (row ${i + 1})`}>
                    <Space direction="vertical" size={4}>
                      <div>{rowContent}</div>
                      {showDecision && <FieldDecisionControl fieldKey={fk} decision={dec} onAccept={handleAccept} onReject={handleReject} token={token} />}
                    </Space>
                  </Descriptions.Item>
                )
              })}
            </React.Fragment>
          )
        }

        const fieldKey = getFieldKey(sectionIdx, item)
        const decision = fieldReviewDecisions[fieldKey]
        return (
          <Descriptions.Item key={idx} label={label}>
            <Space direction="vertical" size={4}>
              <div>{rendered}</div>
              {showDecision && <FieldDecisionControl fieldKey={fieldKey} decision={decision} onAccept={handleAccept} onReject={handleReject} token={token} />}
            </Space>
          </Descriptions.Item>
        )
      })}
    </Descriptions>
  )
}

/** LOB section: description + activities with Accept/Reject and editable list; Save calls PATCH form-data */
function LobReviewBlock({
  formData,
  fieldReviewDecisions = {},
  onFieldDecision,
  onSaveLob,
  token,
  saving = false,
  primaryLineOfBusiness,
}) {
  const desc = formData?.businessDescriptionText ?? formData?.aiLobRecommendation ?? ''
  const activities = Array.isArray(formData?.businessActivities) ? formData.businessActivities : []
  const [localDesc, setLocalDesc] = useState(desc)
  const [localActivities, setLocalActivities] = useState(activities.map((a) => ({
    taxCode: a.taxCode ?? '',
    lineOfBusiness: a.lineOfBusiness ?? '',
    detailedLineOfBusiness: a.detailedLineOfBusiness ?? a.detailedLine ?? '',
  })))

  useEffect(() => {
    setLocalDesc(desc)
    setLocalActivities(activities.map((a) => ({
      taxCode: a.taxCode ?? '',
      lineOfBusiness: a.lineOfBusiness ?? '',
      detailedLineOfBusiness: a.detailedLineOfBusiness ?? a.detailedLine ?? '',
    })))
  }, [desc, activities])

  const handleAccept = (fieldKey) => {
    if (onFieldDecision) onFieldDecision(fieldKey, { status: 'accepted' })
  }
  const handleReject = (fieldKey, payload) => {
    if (onFieldDecision) onFieldDecision(fieldKey, payload)
  }

  const addRow = () => {
    setLocalActivities((prev) => [...prev, { taxCode: '', lineOfBusiness: '', detailedLineOfBusiness: '' }])
  }
  const removeRow = (index) => {
    setLocalActivities((prev) => prev.filter((_, i) => i !== index))
  }
  const updateRow = (index, field, value) => {
    setLocalActivities((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const hasChanges = localDesc !== desc || JSON.stringify(localActivities) !== JSON.stringify(activities)
  const handleSave = () => {
    if (!onSaveLob) return
    onSaveLob({
      businessDescriptionText: localDesc,
      businessActivities: localActivities.filter((a) => a.taxCode || a.lineOfBusiness || a.detailedLineOfBusiness),
    })
  }

  const taxCodeOptions = (LINE_OF_BUSINESS || []).map((l) => ({ value: l.taxCode, label: `${l.taxCode} — ${l.label || l.lineOfBusiness}` }))
  const getDetailedForTaxCode = (taxCode) => {
    const lob = (LINE_OF_BUSINESS || []).find((l) => l.taxCode === taxCode)
    return (lob?.detailedLines || []).map((d) => ({ value: d, label: d }))
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Text strong style={{ fontSize: 12 }}>Business description</Text>
        <TextArea
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
          rows={3}
          style={{ marginTop: 4, width: '100%' }}
        />
        {onFieldDecision && (
          <div style={{ marginTop: 8 }}>
            <FieldDecisionControl
              fieldKey={LOB_FIELD_DESCRIPTION}
              decision={fieldReviewDecisions[LOB_FIELD_DESCRIPTION]}
              onAccept={handleAccept}
              onReject={handleReject}
              token={token}
            />
          </div>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12 }}>Lines of business</Text>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow}>Add row</Button>
        </div>
        {localActivities.length === 0 && !primaryLineOfBusiness && (
          <Text type="secondary">No activities. Add a row or they will be filled from primary line of business.</Text>
        )}
        {localActivities.map((row, i) => (
          <div key={i} style={{ padding: 12, background: token.colorFillQuaternary, borderRadius: token.borderRadius, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space direction="vertical" size={4} style={{ flex: 1 }}>
                <Select
                  placeholder="Tax code"
                  options={taxCodeOptions}
                  value={row.taxCode || undefined}
                  onChange={(v) => {
                    const lob = (LINE_OF_BUSINESS || []).find((l) => l.taxCode === v)
                    updateRow(i, 'taxCode', v)
                    updateRow(i, 'lineOfBusiness', lob?.lineOfBusiness ?? '')
                  }}
                  style={{ width: 240 }}
                  allowClear
                />
                <Input
                  placeholder="Line of business"
                  value={row.lineOfBusiness}
                  onChange={(e) => updateRow(i, 'lineOfBusiness', e.target.value)}
                  style={{ width: 280 }}
                />
                <Select
                  placeholder="Detailed line"
                  options={getDetailedForTaxCode(row.taxCode)}
                  value={row.detailedLineOfBusiness || undefined}
                  onChange={(v) => updateRow(i, 'detailedLineOfBusiness', v)}
                  style={{ width: 280 }}
                  allowClear
                />
              </Space>
              <Space>
                {onFieldDecision && (
                  <FieldDecisionControl
                    fieldKey={getLobActivityFieldKey(i)}
                    decision={fieldReviewDecisions[getLobActivityFieldKey(i)]}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    token={token}
                  />
                )}
                <Button type="text" danger size="small" icon={<CloseCircleOutlined />} onClick={() => removeRow(i)}>Remove</Button>
              </Space>
            </div>
          </div>
        ))}
      </div>
      {hasChanges && onSaveLob && (
        <Button type="primary" loading={saving} onClick={handleSave}>
          Save LOB changes
        </Button>
      )}
    </Space>
  )
}

export default function ApplicationDetailPanel({
  application: initialApplication,
  onReviewComplete,
  onReview,
  onReviewStarted
}) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [startingReview, setStartingReview] = useState(false)
  const [savingLob, setSavingLob] = useState(false)
  const [application, setApplication] = useState(initialApplication)
  const [decision, setDecision] = useState(null)
  const [formDefinition, setFormDefinition] = useState(null)
  const [formDefLoading, setFormDefLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('review')
  const [documentModal, setDocumentModal] = useState({ open: false, url: null, label: '', type: 'other' })
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const permitService = new PermitApplicationService()

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication)
      setActiveTab('review')
      loadApplicationDetails()
      setDecision(null)
      form.resetFields()
      handleStartReview()
    }
  }, [initialApplication?.applicationId])

  // Fetch form definition for dynamic section tabs (always when application is loaded)
  useEffect(() => {
    const app = application || initialApplication
    if (!app?.applicationId) {
      setFormDefinition(null)
      return
    }

    let cancelled = false
    setFormDefLoading(true)
    setFormDefinition(null)

    const formDefId = app?.formDefinitionId
    const formType = app?.formType || 'permit'

    const fetchDef = async () => {
      try {
        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, app?.businessRegistration?.businessType || null, null)
        }
        if (cancelled) return
        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load form definition for review:', e)
      } finally {
        if (!cancelled) setFormDefLoading(false)
      }
    }
    fetchDef()
    return () => { cancelled = true }
  }, [application?.applicationId, application?.formDefinitionId, application?.formType, application?.businessRegistration?.businessType])

  const handleStartReview = async () => {
    if (!initialApplication?.applicationId) return
    if (!['submitted', 'resubmit', 'needs_revision'].includes(initialApplication?.status)) return

    setStartingReview(true)
    try {
      const result = await permitService.startReview({
        applicationId: initialApplication.applicationId,
        businessId: initialApplication.businessId
      })
      
      if (result?.lockedByOfficer) {
        message.warning(`This application is already under review by ${result.lockedByOfficer}`)
        await loadApplicationDetails()
      } else if (result?.application) {
        setApplication(result.application)
        if (onReviewStarted) {
          onReviewStarted(result.application)
        }
      } else {
        await loadApplicationDetails()
      }
    } catch (error) {
      console.error('Failed to start review:', error)
      await loadApplicationDetails()
    } finally {
      setStartingReview(false)
    }
  }

  const loadApplicationDetails = async () => {
    if (!initialApplication?.applicationId) return

    setLoading(true)
    try {
      const details = await permitService.getApplicationById(
        initialApplication.applicationId,
        initialApplication.businessId
      )
      setApplication(details)
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldDecision = async (fieldKey, payload) => {
    if (!application?.applicationId) return
    try {
      const updated = await permitService.updateFieldDecisions({
        applicationId: application.applicationId,
        businessId: application.businessId,
        fieldKey,
        status: payload.status,
        reasonCode: payload.reasonCode,
        reasonOther: payload.reasonOther,
      })
      if (updated) setApplication(updated)
    } catch (error) {
      console.error('Failed to update field decision:', error)
      message.error(error?.message || 'Failed to update field decision')
    }
  }

  const handleSaveLob = async (payload) => {
    if (!application?.applicationId) return
    setSavingLob(true)
    try {
      const updated = await permitService.updateLobFormData({
        applicationId: application.applicationId,
        businessId: application.businessId,
        businessDescriptionText: payload.businessDescriptionText,
        businessActivities: payload.businessActivities,
      })
      if (updated) setApplication(updated)
      message.success('LOB changes saved')
    } catch (error) {
      console.error('Failed to save LOB:', error)
      message.error(error?.message || 'Failed to save LOB changes')
    } finally {
      setSavingLob(false)
    }
  }

  const handleDecisionChange = (e) => {
    setDecision(e.target.value)
    form.setFieldsValue({ 
      rejectionReason: undefined,
      requestChangesMessage: undefined
    })
  }

  const handleReview = async (values) => {
    if (!decision) {
      message.error('Please select a decision')
      return
    }

    if (canReview && allFieldKeys.length > 0 && !allFieldsReviewed) {
      message.error(`Please review all fields before submitting. (${decidedCount} of ${allFieldKeys.length} completed)`)
      return
    }

    if (!values.comments || values.comments.trim() === '') {
      message.error('Comments are required')
      return
    }

    if (decision === 'reject' && (!values.rejectionReason || values.rejectionReason.trim() === '')) {
      message.error('Rejection reason is required when rejecting an application')
      return
    }

    if (decision === 'request_changes' && (!values.requestChangesMessage || values.requestChangesMessage.trim() === '')) {
      message.error('Please specify what changes are needed')
      return
    }

    setReviewing(true)
    try {
      const reviewComments = decision === 'request_changes' && values.requestChangesMessage
        ? `${values.comments}\n\nRequired Changes:\n${values.requestChangesMessage}`
        : values.comments

      const result = await onReview({
        applicationId: application.applicationId,
        decision,
        comments: reviewComments,
        rejectionReason: values.rejectionReason,
        businessId: application.businessId
      })

      if (result?.application) {
        setApplication(result.application)
      } else {
        await loadApplicationDetails()
      }

      if (onReviewComplete) {
        onReviewComplete()
      }
    } catch (error) {
      console.error('Review failed:', error)
      message.error(error.message || 'Failed to review application')
    } finally {
      setReviewing(false)
    }
  }

  const handleConfirmReview = (values) => {
    const decisionValue = values?.decision || decision
    const decisionLabel = decisionValue === 'approve'
      ? 'approve'
      : decisionValue === 'reject'
        ? 'reject'
        : 'request changes for'
    Modal.confirm({
      title: 'Submit Review?',
      content: `You are about to ${decisionLabel} this application. Do you want to continue?`,
      okText: 'Submit Review',
      cancelText: 'Cancel',
      onOk: () => handleReview(values)
    })
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return dayjs(date).format('YYYY-MM-DD HH:mm')
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A'
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (value) => {
    if (value == null || value === '') return 'N/A'
    const num = Number(value)
    if (Number.isNaN(num)) return String(value)
    return new Intl.NumberFormat('en-PH', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatBoolean = (value) => {
    if (value === true || value === 'yes' || value === 'Yes') return <Tag color="success">Yes</Tag>
    if (value === false || value === 'no' || value === 'No') return <Tag color="default">No</Tag>
    return 'N/A'
  }

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Pending Review' },
      'resubmit': { color: 'processing', text: 'Resubmit' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const DocumentViewer = ({ url, label, onViewDocument }) => {
    if (!url || url.trim() === '') {
      return <Text type="secondary">Not uploaded</Text>
    }

    const resolvedUrl = resolveIpfsUrl(url)
    if (!resolvedUrl) {
      return <Text type="secondary">Not available</Text>
    }

    // Infer type from extension in resolved URL first, then original url (IPFS CIDs often have no extension in gateway URL)
    const urlPath = resolvedUrl.split('?')[0]
    const originalPath = (typeof url === 'string' ? url : '').split('?')[0]
    const isImage = urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || originalPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    const isPdf = urlPath.toLowerCase().includes('.pdf') || originalPath.toLowerCase().includes('.pdf')
    const docType = isImage ? 'image' : isPdf ? 'pdf' : 'other'

    const openModal = () => {
      if (onViewDocument) {
        onViewDocument({ url: resolvedUrl, label: label || 'Document', type: docType })
      } else {
        window.open(resolvedUrl, '_blank')
      }
    }

    if (isImage) {
      return (
        <Space direction="vertical" size={4}>
          <div
            role="button"
            tabIndex={0}
            onClick={openModal}
            onKeyDown={(e) => e.key === 'Enter' && openModal()}
            style={{ cursor: 'pointer', display: 'inline-block' }}
          >
            <Image
              src={resolvedUrl}
              alt={label || 'Document'}
              width={120}
              height={120}
              style={{ objectFit: 'cover', borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}` }}
              preview={false}
            />
          </div>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={openModal}>
            View document
          </Button>
        </Space>
      )
    }

    if (isPdf) {
      return (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={openModal}>
            View document
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} href={resolvedUrl} download>
            Download
          </Button>
        </Space>
      )
    }

    return (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={openModal}>
          View document
        </Button>
      </Space>
    )
  }

  if (!initialApplication) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select an application to view details</Text>}
        />
      </div>
    )
  }

  const reviewableStatuses = ['submitted', 'resubmit', 'under_review', 'needs_revision', 'pending_review']
  const canReview = reviewableStatuses.includes(application?.status)
  const isFinalDecision = application?.status === 'approved' || application?.status === 'rejected'
  const isDraft = ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered'].includes(application?.status)

  const ownerIdentity = application?.ownerIdentity || {}
  const businessReg = application?.businessRegistration || {}
  const location = application?.location || {}
  const riskProfile = application?.riskProfile || {}
  const birRegistration = application?.birRegistration || {}
  const otherAgencies = application?.otherAgencyRegistrations || {}
  const documents = application?.documents || {}
  const aiValidation = application?.aiValidation

  const ownerName = ownerIdentity.fullName || 
                   businessReg.ownerFullName || 
                   application?.businessOwner?.name || 
                   'N/A'

  const requirementsChecklist = application?.requirementsChecklist || {}

  const formData = application?.formData && typeof application.formData === 'object' ? application.formData : {}
  const sections = formDefinition ? filterSectionsByFormValues(formDefinition.sections || [], formData) : []
  // ST-PA-17: Officer field editing is intentionally scoped to LOB fields only.
  // Other form fields (business info, address, etc.) are owner-controlled and
  // can only be changed via the Edit Request workflow.
  const { keys: allFieldKeys = [], lobSectionIndex } = getReviewableFieldKeys(sections, formData)
  const fieldReviewDecisions = application?.fieldReviewDecisions && typeof application.fieldReviewDecisions === 'object' ? application.fieldReviewDecisions : {}
  const decidedCount = allFieldKeys.filter((k) => fieldReviewDecisions[k]?.status).length
  const allFieldsReviewed = allFieldKeys.length > 0 && decidedCount >= allFieldKeys.length
  const rejectedFields = allFieldKeys.filter((k) => fieldReviewDecisions[k]?.status === 'rejected')
  const applicationHistory = application?.applicationHistory || []

  const sectionTabs = sections.map((section, idx) => {
    const isLobSection = idx === lobSectionIndex
    return {
      key: `section-${idx}`,
      label: section.category || `Section ${idx + 1}`,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {formDefLoading ? (
            <Spin tip="Loading..." />
          ) : isLobSection ? (
            <LobReviewBlock
              formData={formData}
              fieldReviewDecisions={fieldReviewDecisions}
              onFieldDecision={handleFieldDecision}
              onSaveLob={handleSaveLob}
              token={token}
              saving={savingLob}
              primaryLineOfBusiness={businessReg.primaryLineOfBusiness}
            />
          ) : (
            <SectionReadOnlyContent
              section={section}
              sectionIdx={idx}
              formData={formData}
              documents={application?.documents || {}}
              token={token}
              formatDate={formatDate}
              formatBoolean={formatBoolean}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              DocumentViewer={DocumentViewer}
              onViewDocument={({ url, label, type }) => setDocumentModal({ open: true, url, label, type })}
              primaryLineOfBusiness={businessReg.primaryLineOfBusiness}
              fieldReviewDecisions={fieldReviewDecisions}
              onFieldDecision={handleFieldDecision}
            />
          )}
        </div>
      ),
    }
  })

  const reviewTab = {
    key: 'review',
    label: 'Review',
    children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {/* Application Info Summary */}
          {formDefLoading && (
            <div style={{ marginBottom: 16 }}>
              <Spin size="small" tip="Loading form sections..." />
            </div>
          )}
          {!formDefLoading && !formDefinition && (
            <Alert
              message="Form definition not loaded"
              description="No active form definition is available for this application type. Section tabs will appear when an active form is published by the admin."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Reference Number">
              <Text copyable strong style={{ fontFamily: 'monospace', color: token.colorPrimary }}>
                {application?.applicationReferenceNumber || 'N/A'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Application Type">
              <Tag color={application?.applicationType === 'new_registration' ? 'blue' : 'cyan'}>
                {application?.applicationType === 'new_registration' ? 'New Registration' : 'Renewal'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted Date">{formatDate(application?.submittedAt)}</Descriptions.Item>
            <Descriptions.Item label="Created Date">{formatDate(application?.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Primary Line of Business">
              {businessReg.primaryLineOfBusiness || (formData?.businessActivities?.[0]?.lineOfBusiness) || 'N/A'}
            </Descriptions.Item>
          </Descriptions>

          {/* Applicant snapshot */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Applicant: <Text strong>{ownerName}</Text>
              {' · '}
              Ref: <Text strong copyable>{application?.applicationReferenceNumber || 'N/A'}</Text>
            </Text>
          </div>

          {/* Review progress */}
          {canReview && allFieldKeys.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong style={{ fontSize: 13 }}>Review progress</Text>
                <Progress
                  percent={allFieldKeys.length ? Math.round((decidedCount / allFieldKeys.length) * 100) : 0}
                  status={rejectedFields.length > 0 ? 'exception' : allFieldsReviewed ? 'success' : 'active'}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {decidedCount} of {allFieldKeys.length} fields reviewed
                  {rejectedFields.length > 0 && ` · ${rejectedFields.length} rejected`}
                </Text>
              </Space>
            </div>
          )}

          {/* Application timeline */}
          {(application?.submittedAt || application?.reviewedAt || application?.updatedAt) && (
            <div style={{ marginBottom: 16, padding: 12, background: token.colorFillAlter, borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}` }}>
              <Space direction="vertical" size={4}>
                <Text strong style={{ fontSize: 12 }}><ClockCircleOutlined /> Timeline</Text>
                {application.submittedAt && <Text type="secondary" style={{ fontSize: 12 }}>Submitted: {formatDate(application.submittedAt)}</Text>}
                {application.reviewedAt && <Text type="secondary" style={{ fontSize: 12 }}>Reviewed / last review: {formatDate(application.reviewedAt)}</Text>}
                {application.updatedAt && <Text type="secondary" style={{ fontSize: 12 }}>Last updated: {formatDate(application.updatedAt)}</Text>}
              </Space>
            </div>
          )}

          {/* Rejection summary (field-level) */}
          {rejectedFields.length > 0 && (
            <Collapse
              style={{ marginBottom: 16 }}
              items={[{
                key: 'rejections',
                label: <Space><CloseCircleOutlined style={{ color: token.colorError }} /><Text strong>Rejection summary ({rejectedFields.length} field{rejectedFields.length !== 1 ? 's' : ''})</Text></Space>,
                children: (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {rejectedFields.map((fk) => {
                      const d = fieldReviewDecisions[fk]
                      const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Rejected'
                      return <li key={fk}><Text>{fk}: {reason}</Text></li>
                    })}
                  </ul>
                ),
              }]}
            />
          )}

          {/* Application history (collapsible) */}
          {applicationHistory.length > 0 && (
            <Collapse
              style={{ marginBottom: 16 }}
              items={[{
                key: 'history',
                label: <Space><HistoryOutlined /><Text strong>Application history</Text></Space>,
                children: (
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {applicationHistory.map((ev, i) => (
                      <div key={i}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(ev.at)}</Text>
                        {' — '}
                        <Text>{ev.label || ev.event}</Text>
                      </div>
                    ))}
                  </Space>
                ),
              }]}
            />
          )}

          {/* AI Validation Summary */}
          {aiValidation?.completed && (
            <div style={{ 
              background: token.colorFillAlter, 
              border: `1px solid ${token.colorBorderSecondary}`, 
              borderRadius: token.borderRadius, 
              padding: 12, 
              marginBottom: 16 
            }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <RobotOutlined style={{ color: token.colorPrimary }} />
                  <Text strong style={{ fontSize: 13 }}>AI Validation Status</Text>
                </Space>
                <Badge
                  status={
                    aiValidation.results?.overallStatus === 'pass' ? 'success' :
                    aiValidation.results?.overallStatus === 'warning' ? 'warning' : 'error'
                  }
                  text={
                    aiValidation.results?.overallStatus === 'pass' ? 'Pass' :
                    aiValidation.results?.overallStatus === 'warning' ? 'Warning' : 'Fail'
                  }
                />
                {aiValidation.results?.overallStatus !== 'pass' && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Review AI validation tab for details
                  </Text>
                )}
              </Space>
            </div>
          )}

          {/* Permit Actions for Approved Applications */}
          {application?.status === 'approved' && (
            <div style={{
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              padding: 12,
              marginBottom: 16
            }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Permit issuance and payment are handled in a separate workflow.
              </Text>
            </div>
          )}

          {!canReview ? (
            <Alert
              message={`Application status: ${application?.status?.replace(/_/g, ' ')}`}
              description={
                isFinalDecision
                  ? "This application cannot be reviewed as it has already reached a final decision."
                  : isDraft
                    ? "This application has not been submitted yet. The business owner needs to complete and submit the application before it can be reviewed."
                    : "This application is not available for review at this time."
              }
              type={isFinalDecision ? "success" : "warning"}
              showIcon
            />
          ) : (
            <Form form={form} layout="vertical" onFinish={handleConfirmReview}>
              <Form.Item
                label={<Text strong style={{ fontSize: 13 }}>Decision</Text>}
                name="decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Radio.Group onChange={handleDecisionChange} value={decision} style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {[
                      { value: 'approve', icon: <CheckCircleOutlined />, color: token.colorSuccess, bg: token.colorSuccessBg, label: 'Approve' },
                      { value: 'reject', icon: <CloseCircleOutlined />, color: token.colorError, bg: token.colorErrorBg, label: 'Reject' },
                      { value: 'request_changes', icon: <EditOutlined />, color: token.colorWarning, bg: token.colorWarningBg, label: 'Request Changes' },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => { setDecision(opt.value); form.setFieldsValue({ decision: opt.value }) }}
                        style={{
                          border: decision === opt.value ? `2px solid ${opt.color}` : `1px solid ${token.colorBorderSecondary}`,
                          background: decision === opt.value ? opt.bg : token.colorFillAlter,
                          borderRadius: token.borderRadius,
                          padding: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Radio value={opt.value}>
                          <Space>
                            {React.cloneElement(opt.icon, { style: { color: opt.color } })}
                            <Text strong style={{ fontSize: 13 }}>{opt.label}</Text>
                          </Space>
                        </Radio>
                      </div>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={<Text strong style={{ fontSize: 13 }}>Comments</Text>} name="comments" rules={[{ required: true, message: 'Comments are required' }]}>
                <TextArea rows={3} placeholder="Enter your review comments..." style={{ fontSize: 13 }} />
              </Form.Item>

              {decision === 'reject' && (
                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Rejection Reason</Text>} name="rejectionReason" rules={[{ required: true, message: 'Rejection reason is required' }]}>
                  <TextArea rows={2} placeholder="Please specify the reason for rejection..." style={{ fontSize: 13 }} />
                </Form.Item>
              )}

              {decision === 'request_changes' && (
                <>
                  <Alert
                    message="Request Changes"
                    description="The applicant will be notified to make corrections and resubmit the application."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Form.Item label={<Text strong style={{ fontSize: 13 }}>Required Changes</Text>} name="requestChangesMessage" rules={[{ required: true, message: 'Please specify what changes are needed' }]}>
                    <TextArea rows={2} placeholder="Specify what changes are needed..." style={{ fontSize: 13 }} />
                  </Form.Item>
                </>
              )}

              {canReview && allFieldKeys.length > 0 && !allFieldsReviewed && (
                <Alert
                  message="Complete field review first"
                  description={`Review all ${allFieldKeys.length} fields in the form sections (${decidedCount} of ${allFieldKeys.length} done). Submit will be enabled when every field is accepted or rejected.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {canReview && rejectedFields.length > 0 && (
                <Alert
                  message="Some fields are rejected"
                  description="Consider selecting &quot;Request changes&quot; so the applicant can address the rejected fields."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={reviewing}
                  disabled={canReview && allFieldKeys.length > 0 && !allFieldsReviewed}
                  block
                  icon={decision === 'approve' ? <CheckCircleOutlined /> : decision === 'reject' ? <CloseCircleOutlined /> : <EditOutlined />}
                  style={{
                    background: decision === 'approve' ? token.colorSuccess : decision === 'reject' ? token.colorError : decision === 'request_changes' ? token.colorWarning : token.colorPrimary,
                    borderColor: decision === 'approve' ? token.colorSuccess : decision === 'reject' ? token.colorError : decision === 'request_changes' ? token.colorWarning : token.colorPrimary,
                  }}
                >
                  Submit Review
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
      )
    }

  const ownerTab = {
    key: 'owner',
    label: 'Owner',
    children: (
      <div style={{ padding: 16, overflow: 'auto' }}>
        <OwnerInfoReadOnlyView
          application={application}
          ownerIdentity={ownerIdentity}
          businessReg={businessReg}
          ownerName={ownerName}
        />
      </div>
    )
  }

  const tabItems = [
    reviewTab,
    ownerTab,
    ...sectionTabs
  ]

  const navItems = tabItems.map((t) => ({ key: t.key, label: typeof t.label === 'string' ? t.label : t.key }))
  const mainNavItems = navItems.slice(0, 2)
  const formNavItems = navItems.slice(2)

  const getSectionStatus = (sectionIdx) => {
    const sectionKeys = sectionIdx === lobSectionIndex
      ? allFieldKeys.filter((k) => k === LOB_FIELD_DESCRIPTION || k.startsWith('lob_activity_'))
      : allFieldKeys.filter((k) => String(k).startsWith(`${sectionIdx}.`))
    if (sectionKeys.length === 0) return null
    const hasRejected = sectionKeys.some((k) => fieldReviewDecisions[k]?.status === 'rejected')
    const allDecided = sectionKeys.every((k) => fieldReviewDecisions[k]?.status)
    if (hasRejected) return 'rejected'
    if (allDecided) return 'ok'
    return 'pending'
  }

  const activeContent = tabItems.find((t) => t.key === activeTab)?.children

  return (
    <div className="application-detail-panel-root" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
      <style>{`
        /* Spin wraps content in .ant-spin-nested-loading and .ant-spin-container; make them pass through flex/height */
        .application-detail-panel-root.ant-spin-nested-loading {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        .application-detail-panel-root .ant-spin-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
          overflow: hidden !important;
        }
      `}</style>
      <Spin
        spinning={loading || startingReview}
        wrapperClassName="application-detail-panel-root"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%' }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 16,
              }}
            >
              <ShopOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Title level={5} style={{ margin: 0, lineHeight: 1.3 }} ellipsis={{ rows: 1 }}>
                {businessReg.registeredBusinessName || application?.businessName || 'Unnamed Business'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {application?.applicationReferenceNumber || 'No Reference'}
              </Text>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {getStatusTag(application?.status)}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {isFinalDecision && (
            <Alert
              message={`Application has been ${application.status === 'approved' ? 'approved' : 'rejected'}`}
              type={application.status === 'approved' ? 'success' : 'error'}
              showIcon
              style={{ margin: 16, marginBottom: 0 }}
            />
          )}

        {/* Content: vertical nav + panel (Settings Security-style buttons) */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', alignItems: 'stretch' }}>
          <div
            style={{
              width: 220,
              flexShrink: 0,
              alignSelf: 'stretch',
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              overflowY: 'auto',
              background: token.colorBgContainer,
            }}
          >
            {mainNavItems.map((item) => {
              const isSelected = activeTab === item.key
              return (
                <Button
                  key={item.key}
                  type={isSelected ? 'primary' : 'default'}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: 'normal',
                    height: 'auto',
                    minHeight: 40,
                    padding: '8px 12px',
                    lineHeight: 1.4,
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
            {formNavItems.length > 0 && (
              <>
                <div
                  style={{
                    marginTop: 12,
                    marginBottom: 4,
                    padding: '4px 12px 0',
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Form sections
                  </Text>
                </div>
                {formNavItems.map((item) => {
                  const isSelected = activeTab === item.key
                  const sectionIdx = parseInt(String(item.key).replace('section-', ''), 10)
                  const status = getSectionStatus(sectionIdx)
                  const statusIcon = status === 'ok' ? <CheckCircleOutlined style={{ color: token.colorSuccess, marginLeft: 4 }} /> : status === 'rejected' ? <CloseCircleOutlined style={{ color: token.colorError, marginLeft: 4 }} /> : status === 'pending' ? <ClockCircleOutlined style={{ color: token.colorWarning, marginLeft: 4 }} /> : null
                  return (
                    <Button
                      key={item.key}
                      type={isSelected ? 'primary' : 'default'}
                      onClick={() => setActiveTab(item.key)}
                      style={{
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        fontWeight: isSelected ? 600 : 400,
                        whiteSpace: 'normal',
                        height: 'auto',
                        minHeight: 40,
                        padding: '8px 12px',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{item.label}{statusIcon}</span>
                    </Button>
                  )
                })}
              </>
            )}
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              background: token.colorBgContainer,
            }}
          >
            {activeContent}
          </div>
        </div>
        </div>
        </div>
      </Spin>
      <Modal
        title={documentModal.label}
        open={documentModal.open}
        onCancel={() => setDocumentModal({ open: false, url: null, label: '', type: 'other' })}
        width={documentModal.type === 'image' ? 560 : 720}
        footer={[
          <Button key="close" onClick={() => setDocumentModal({ open: false, url: null, label: '', type: 'other' })}>
            Close
          </Button>,
          <Button
            key="openTab"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => documentModal.url && window.open(documentModal.url, '_blank')}
          >
            Open in new tab
          </Button>,
          ...(documentModal.type === 'pdf' && documentModal.url
            ? [
                <Button
                  key="download"
                  icon={<DownloadOutlined />}
                  href={documentModal.url}
                  download
                >
                  Download
                </Button>
              ]
            : [])
        ]}
      >
        {documentModal.open && documentModal.url && (
          <div style={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'auto', flexDirection: 'column', width: '100%' }}>
            {documentModal.type === 'image' && (
              <img
                src={documentModal.url}
                alt={documentModal.label}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            )}
            {documentModal.type === 'pdf' && (
              <iframe
                title={documentModal.label}
                src={documentModal.url}
                style={{ width: '100%', height: '70vh', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
              />
            )}
            {documentModal.type === 'other' && (
              <>
                <iframe
                  title={documentModal.label}
                  src={documentModal.url}
                  style={{
                    width: '100%',
                    height: '70vh',
                    minHeight: 320,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                  }}
                />
                <Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                  If the document does not appear above, use &quot;Open in new tab&quot; to view it.
                </Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
