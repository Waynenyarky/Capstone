import { useState, useEffect, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Typography, Tag, Button, Space, theme, Empty, Radio, Input, Alert, Image, Modal, App, Select, Popover, Progress, Collapse, message, Card, Tooltip, Table } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { post } from '@/lib/http'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
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
  COMMENT_OPTIONS,
  COMMENT_OTHER_CODE,
  REQUEST_OPTIONS,
  REQUEST_OTHER_CODE,
} from '../constants/rejectionReasons'
import OwnerInfoReadOnlyView from './OwnerInfoReadOnlyView'
import OfficerApprovedView from './OfficerApprovedView'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness'
import { initiateClearance } from '@/features/business-owner/services/clearanceService'
import { generatePaymentsForApprovedBusiness, hasPaymentsGenerated } from '@/features/business-owner/services/paymentGenerationService'
import { getPaymentGenerationStatus } from '@/features/business-owner/services/businessProfileService'

const { Text, Title } = Typography
const { TextArea } = Input

/** Revoke Decision Section for Decision card - shows countdown and revoke button */
function RevokeDecisionSection({ application, onRevoke }) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [revoking, setRevoking] = useState(false)

  const status = application?.status

  useEffect(() => {
    // Calculate time left based on when the decision was made
    const calculateTimeLeft = () => {
      const decisionAt = application?.approvedAt || 
                         application?.rejectedAt ||
                         application?.lastStatusChange || 
                         application?.updatedAt || 
                         application?.reviewedAt
      
      if (!decisionAt) {
        return 24 * 60 * 60 // Default to full 24 hours
      }
      
      const decisionTime = new Date(decisionAt).getTime()
      const currentTime = new Date().getTime()
      const elapsedSeconds = Math.floor((currentTime - decisionTime) / 1000)
      const totalTime = 24 * 60 * 60 // 24 hours in seconds
      const remaining = totalTime - elapsedSeconds
      
      return Math.max(0, remaining)
    }
    
    setTimeLeft(calculateTimeLeft())
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [application?.approvedAt, application?.rejectedAt, application?.updatedAt, application?.lastStatusChange, application?.reviewedAt])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await onRevoke()
    } catch (err) {
      console.error('Revoke decision error:', err)
    } finally {
      setRevoking(false)
    }
  }

  const getStatusLabel = () => {
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    if (status === 'needs_revision') return 'Changes Requested'
    return status
  }

  // Map rejection reason code to human-readable label
  const getReasonLabel = (reasonCode) => {
    if (!reasonCode) return null
    const option = REJECTION_REASON_OPTIONS.find(r => r.value === reasonCode)
    return option?.label || reasonCode
  }

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
        <div><Text strong>{status === 'needs_revision' 
          ? 'This application requires changes from the applicant.'
          : `This application has been ${getStatusLabel().toLowerCase()}.`}</Text></div>
      </div>
      {application?.rejectionReason && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Rejection reason</Text>
          <div><Text strong>{getReasonLabel(application.rejectionReason)}</Text></div>
        </div>
      )}
      {application?.reviewComments && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>
          <div><Text strong>{application.reviewComments}</Text></div>
        </div>
      )}
      {application?.reviewedAt && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Submitted on</Text>
          <div><Text strong>{new Date(application.reviewedAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></div>
        </div>
      )}
      {status === 'rejected' && application?.hasActiveAppeal && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
          message={
            <div>
              <Text strong>Appeal Pending</Text>
              <div><Text type="secondary" style={{ fontSize: 12 }}>The business owner has filed an appeal for this rejection. Review it in the Appeals page.</Text></div>
            </div>
          }
        />
      )}
      {status === 'rejected' && application?.appealExhausted && !application?.hasActiveAppeal && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Appeal status</Text>
          <div><Text strong>Appeal exhausted - Final decision</Text></div>
        </div>
      )}
      {timeLeft > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text>You can revoke this decision within <Text strong>{formatTime(timeLeft)}</Text></Text>
              <Button 
                danger 
                size="small" 
                onClick={handleRevoke}
                loading={revoking}
                icon={<HistoryOutlined />}
              >
                Revoke Decision
              </Button>
            </div>
          }
        />
      )}
      {timeLeft === 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
          The 24-hour window to revoke this decision has expired.
        </Text>
      )}
    </>
  )
}

/** Get a single displayable file URL from form value (string CID/URL or fileList item with cid/url) */
function getFileUrlFromFormValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first && typeof first === 'object') {
      // Try multiple possible property names for CID/URL
      const cid = first.cid || first.ipfsCid || first.response?.cid || first.response?.ipfsCid
      const url = first.url || first.response?.url
      if (url && typeof url === 'string') return url
      if (cid && typeof cid === 'string') return cid
      // Debug: log the structure if we can't find CID/URL
      console.log('Debug - file object structure:', first)
    }
  }
  return ''
}

/** Appeal Card - shows appeal details and allows officer to review/resolve */
function AppealCard({ application, onAppealResolved }) {
  const { token } = theme.useToken()
  const [appeal, setAppeal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [appealDecision, setAppealDecision] = useState(null)
  const [noAppeal, setNoAppeal] = useState(false)

  const businessId = application?.businessId || application?.applicationId
  const isRejected = application?.status === 'rejected' || application?.status === 'appeal_pending'

  useEffect(() => {
    if (!businessId || !isRejected) return
    
    const fetchAppeal = async () => {
      setLoading(true)
      try {
        const { get } = await import('@/lib/http')
        const res = await get(`/api/business/appeals/by-business/${businessId}`)
        const appeals = res?.data || []
        // Get the latest active appeal
        const activeAppeal = appeals.find(a => a.status === 'submitted' || a.status === 'under_review')
        if (activeAppeal) {
          setAppeal(activeAppeal)
          setNoAppeal(false)
        } else {
          setAppeal(null)
          setNoAppeal(true)
        }
      } catch (err) {
        console.error('Failed to fetch appeal:', err)
        setNoAppeal(true)
      } finally {
        setLoading(false)
      }
    }
    fetchAppeal()
  }, [businessId, isRejected])

  const handleResolveAppeal = async () => {
    if (!appeal || !appealDecision) return
    
    setResolving(true)
    try {
      const { put } = await import('@/lib/http')
      await put(`/api/business/appeals/${appeal._id}`, {
        status: appealDecision,
        resolution: resolution.trim() || undefined
      })
      message.success(`Appeal ${appealDecision === 'approved' ? 'approved' : 'rejected'} successfully`)
      setAppeal(null)
      setAppealDecision(null)
      setResolution('')
      onAppealResolved?.()
    } catch (err) {
      message.error(err?.message || 'Failed to resolve appeal')
    } finally {
      setResolving(false)
    }
  }

  const getAppealTypeLabel = (type) => {
    const labels = {
      'rejection_appeal': 'Appeal Rejection Decision',
      'wrong_assessment': 'Wrong Assessment',
      'wrong_fees': 'Wrong Fees',
      'wrong_violations': 'Wrong Violations',
      'other': 'Other'
    }
    return labels[type] || type
  }

  // Don't show for non-rejected applications
  if (!isRejected) {
    return null
  }

  // Show exhausted state
  if (application?.appealExhausted && !appeal) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <div><Text strong style={{ color: token.colorError }}>Appeal Rejected</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
            <div><Text strong>Appeal exhausted - Final decision stands</Text></div>
          </div>
        </Space>
      </Card>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <LottieSpinner size="small" />
      </Card>
    )
  }

  // No appeal filed yet
  if (noAppeal && !appeal) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary">No appeal has been filed for this application.</Text>
      </Card>
    )
  }

  // Show active appeal with review options
  if (appeal) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="This application has an active appeal that requires your review."
          />
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Appeal Type</Text>
            <div><Text strong>{getAppealTypeLabel(appeal.appealType)}</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
            <div><Text strong>{appeal.description}</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Filed On</Text>
            <div><Text strong>{appeal.createdAt ? new Date(appeal.createdAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text></div>
          </div>
          
          <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12, marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Appeal Decision</Text>
            <Radio.Group 
              value={appealDecision} 
              onChange={(e) => setAppealDecision(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              <Radio.Button value="approved">
                <CheckCircleOutlined /> Approve Appeal
              </Radio.Button>
              <Radio.Button value="rejected">
                <CloseCircleOutlined /> Reject Appeal
              </Radio.Button>
            </Radio.Group>
            
            {appealDecision && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Resolution Notes {appealDecision === 'rejected' ? '(required)' : '(optional)'}
                  </Text>
                  <Input.TextArea
                    rows={3}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder={appealDecision === 'approved' 
                      ? 'Explain why the appeal is being approved...'
                      : 'Explain why the appeal is being rejected...'}
                  />
                </div>
                <Alert
                  type={appealDecision === 'approved' ? 'info' : 'warning'}
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={appealDecision === 'approved' 
                    ? 'Approving this appeal will reset the application to "Under Review" for re-evaluation.'
                    : 'Rejecting this appeal will mark the rejection as final. The business owner cannot appeal again.'}
                />
                <Button
                  type="primary"
                  danger={appealDecision === 'rejected'}
                  onClick={handleResolveAppeal}
                  loading={resolving}
                  disabled={appealDecision === 'rejected' && !resolution.trim()}
                >
                  {appealDecision === 'approved' ? 'Approve Appeal' : 'Reject Appeal'}
                </Button>
              </>
            )}
          </div>
        </Space>
      </Card>
    )
  }

  return null
}

/** Inline Accept/Reject UI for one field */
function FieldDecisionControl({ fieldKey, decision, onAccept, onReject, token, disabled = false }) {
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

  if (disabled) {
    if (!decision) {
      return <Text type="secondary" style={{ fontSize: 12 }}>No field decision submitted</Text>
    }

    const isAccepted = decision.status === 'accepted'
    const reasonText = decision.status === 'rejected'
      ? (decision.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === decision.reasonCode)?.label || decision.reasonCode || 'Rejected')
      : ''

    return isAccepted ? (
      <Tag color="success" icon={<CheckCircleOutlined />}>Accepted</Tag>
    ) : (
      <Tag color="error" icon={<CloseCircleOutlined />}>Rejected{reasonText ? `: ${reasonText}` : ''}</Tag>
    )
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
  reviewLocked = false,
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

  // Build table data, expanding repeatable groups into multiple rows
  const tableData = []
  items.forEach((item, idx) => {
    const key = item.key || item.label
    const value = formData?.[key]
    const label = item.label || key || `Field ${idx + 1}`

    // Skip AI LOB recommendation
    if (item.type === 'ai_lob_recommendation' || key === 'aiLobRecommendation') {
      return
    }

    // Handle repeatable groups - expand each row
    if (item.type === 'repeatable_group') {
      if (!Array.isArray(value) || value.length === 0) {
        tableData.push({
          key: `${idx}`,
          field: label,
          value: 'N/A',
          fieldKey: getFieldKey(sectionIdx, item),
          decision: fieldReviewDecisions[getFieldKey(sectionIdx, item)],
          showDecision: false,
          item
        })
        return
      }
      value.forEach((row, rowIdx) => {
        const rowFieldKey = getFieldKey(sectionIdx, item, rowIdx)
        const rowDecision = fieldReviewDecisions[rowFieldKey]
        const rowValue = (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {(item.groupFields || []).map((gf) => {
              const gk = gf.key || gf.label
              const gv = row?.[gk]
              const gLabel = gf.label || gk
              const gDisplay = gf.type === 'date' ? formatDate(gv) : (gv != null && gv !== '' ? String(gv) : '—')
              return <Text key={gk} style={{ fontSize: 13 }}><Text type="secondary">{gLabel}:</Text> {gDisplay}</Text>
            })}
          </Space>
        )
        tableData.push({
          key: `${idx}-${rowIdx}`,
          field: rowIdx === 0 ? label : '',
          value: rowValue,
          fieldKey: rowFieldKey,
          decision: rowDecision,
          showDecision: onFieldDecision || reviewLocked,
          item
        })
      })
      return
    }

    // Handle other field types
    let rendered = null
    if (item.type === 'file') {
      const urlFromForm = getFileUrlFromFormValue(value)
      const url = urlFromForm || documents[item.documentKey] || documents[key] || documents[item.label] || ''
      rendered = <DocumentViewer url={url} label={label} onViewDocument={onViewDocument} />
    } else if (item.type === 'date') {
      rendered = formatDate(value)
    } else if (item.type === 'checkbox') {
      rendered = formatBoolean(value)
    } else if (item.type === 'number') {
      rendered = formatNumber(value)
    } else if (item.type === 'currency') {
      rendered = formatCurrency(value)
    } else if (item.type === 'select') {
      const opts = item.dropdownOptions || []
      const option = opts.find((o) => (typeof o === 'object' ? o.value === value : o === value))
      const display = typeof option === 'object' ? option?.label : option
      rendered = display != null ? String(display) : (value != null && value !== '' ? String(value) : 'N/A')
    } else if (item.type === 'address' || item.type === 'address_alaminos') {
      const prefix = key
      const parts = [
        formData?.[`${prefix}_streetAddress`] || formData?.[`${prefix}_street`],
        formData?.[`${prefix}_barangay`] || formData?.[`${prefix}_barangayName`],
        formData?.[`${prefix}_city`] || formData?.[`${prefix}_cityName`],
        formData?.[`${prefix}_province`] || formData?.[`${prefix}_provinceName`],
        formData?.[`${prefix}_postalCode`] || formData?.[`${prefix}_zipCode`]
      ].filter(Boolean)
      rendered = parts.length ? parts.join(', ') : 'N/A'
    } else if (item.type === 'download') {
      return
    } else {
      rendered = value != null && value !== '' ? String(value) : 'N/A'
    }

    const fieldKey = getFieldKey(sectionIdx, item)
    const decision = fieldReviewDecisions[fieldKey]
    tableData.push({
      key: `${idx}`,
      field: label,
      value: rendered,
      fieldKey,
      decision,
      showDecision: onFieldDecision || reviewLocked,
      item
    })
  })

  return (
    <Table
      dataSource={tableData}
      columns={[
        {
          title: 'Field',
          dataIndex: 'field',
          key: 'field',
          width: 250,
        },
        {
          title: 'Value',
          dataIndex: 'value',
          key: 'value',
        },
        {
          title: 'Action',
          key: 'action',
          width: 180,
          render: (_, record) => record.showDecision ? (
            <FieldDecisionControl 
              fieldKey={record.fieldKey} 
              decision={record.decision} 
              onAccept={handleAccept} 
              onReject={handleReject} 
              token={token} 
              disabled={reviewLocked} 
            />
          ) : null
        }
      ]}
      size="small"
      pagination={false}
      bordered
    />
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
  reviewLocked = false,
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
      <Table
        dataSource={[{
          key: 'description',
          field: 'Business description',
          value: (
            <TextArea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              rows={2}
              style={{ width: '100%' }}
              disabled={reviewLocked}
            />
          ),
          action: (onFieldDecision || reviewLocked) ? (
            <FieldDecisionControl
              fieldKey={LOB_FIELD_DESCRIPTION}
              decision={fieldReviewDecisions[LOB_FIELD_DESCRIPTION]}
              onAccept={handleAccept}
              onReject={handleReject}
              token={token}
              disabled={reviewLocked}
            />
          ) : null
        }]}
        columns={[
          { title: 'Field', dataIndex: 'field', key: 'field', width: 250 },
          { title: 'Value', dataIndex: 'value', key: 'value' },
          { title: 'Action', dataIndex: 'action', key: 'action', width: 180 }
        ]}
        size="small"
        pagination={false}
        bordered
        showHeader={false}
      />
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12 }}>Lines of business</Text>
          {!reviewLocked && <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow}>Add row</Button>}
        </div>
        {localActivities.length === 0 && !primaryLineOfBusiness && (
          <Text type="secondary">No activities. Add a row or they will be filled from primary line of business.</Text>
        )}
        {localActivities.length > 0 && (
          <Table
            dataSource={localActivities.map((row, i) => ({
              key: i,
              field: i === 0 ? 'Line of business' : '',
              value: (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Select
                    placeholder="Tax code"
                    options={taxCodeOptions}
                    value={row.taxCode || undefined}
                    onChange={(v) => {
                      const lob = (LINE_OF_BUSINESS || []).find((l) => l.taxCode === v)
                      updateRow(i, 'taxCode', v)
                      updateRow(i, 'lineOfBusiness', lob?.lineOfBusiness ?? '')
                    }}
                    style={{ width: '100%', maxWidth: 300 }}
                    allowClear
                    disabled={reviewLocked}
                  />
                  <Input
                    placeholder="Line of business"
                    value={row.lineOfBusiness}
                    onChange={(e) => updateRow(i, 'lineOfBusiness', e.target.value)}
                    style={{ width: '100%', maxWidth: 300 }}
                    disabled={reviewLocked}
                  />
                  <Select
                    placeholder="Detailed line"
                    options={getDetailedForTaxCode(row.taxCode)}
                    value={row.detailedLineOfBusiness || undefined}
                    onChange={(v) => updateRow(i, 'detailedLineOfBusiness', v)}
                    style={{ width: '100%', maxWidth: 300 }}
                    allowClear
                    disabled={reviewLocked}
                  />
                </Space>
              ),
              action: (
                <Space>
                  {(onFieldDecision || reviewLocked) && (
                    <FieldDecisionControl
                      fieldKey={getLobActivityFieldKey(i)}
                      decision={fieldReviewDecisions[getLobActivityFieldKey(i)]}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      token={token}
                      disabled={reviewLocked}
                    />
                  )}
                  {!reviewLocked && <Button type="text" danger size="small" icon={<CloseCircleOutlined />} onClick={() => removeRow(i)}>Remove</Button>}
                </Space>
              )
            }))}
            columns={[
              { title: 'Field', dataIndex: 'field', key: 'field', width: 250 },
              { title: 'Value', dataIndex: 'value', key: 'value' },
              { title: 'Action', dataIndex: 'action', key: 'action', width: 220 }
            ]}
            size="small"
            pagination={false}
            bordered
            showHeader={false}
          />
        )}
      </div>
      {!reviewLocked && hasChanges && onSaveLob && (
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
  onReviewStarted,
  onSelectApplication,
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
  const [paymentGenStatus, setPaymentGenStatus] = useState(null)
  const [retryingPayments, setRetryingPayments] = useState(false)
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const permitService = new PermitApplicationService()

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication)
      setActiveTab('review')
      loadApplicationDetails()
      setDecision(null)
      if (initialApplication?.status === 'approved' && initialApplication?.businessId) {
        loadPaymentGenerationStatus(initialApplication.businessId)
      }
      form.resetFields()
      // Don't auto-start review - user must explicitly claim the application first
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

  const loadPaymentGenerationStatus = useCallback(async () => {
    if (!application?.businessId) return

    try {
      console.log('🔍 [DEBUG] Loading payment generation status for businessId:', application.businessId)
      
      const status = await getPaymentGenerationStatus(application.businessId)
      const hasGenerationPayload =
        status && typeof status === 'object' && (
          'paymentsGenerated' in status
          || 'paymentsGeneratedAt' in status
          || 'paymentGenerationErrors' in status
          || 'paymentGenerationMetadata' in status
        )

      if (!hasGenerationPayload && status?.enabled === false) {
        setPaymentGenStatus(null)
        return
      }

      if (status && typeof status === 'object') {
        setPaymentGenStatus({
          ...status,
          paymentsGenerated: Boolean(status.paymentsGenerated),
          paymentGenerationErrors: Array.isArray(status.paymentGenerationErrors) ? status.paymentGenerationErrors : [],
          paymentGenerationMetadata: status.paymentGenerationMetadata || null,
        })
      } else {
        setPaymentGenStatus(null)
      }
    } catch (error) {
      console.error('Failed to load payment generation status:', error)
      setPaymentGenStatus(null)
    }
  }, [application?.businessId])

  const handleRetryPaymentGeneration = async () => {
    if (!application?.businessId) return
    setRetryingPayments(true)
    try {
      const result = await generatePaymentsForApprovedBusiness(application.businessId, application)
      if (result.success) {
        message.success(`Successfully generated ${result.payments.length} payment(s)`)
        await loadPaymentGenerationStatus(application.businessId)
      } else {
        message.error(`Payment generation failed: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      message.error('Failed to retry payment generation')
    } finally {
      setRetryingPayments(false)
    }
  }

  const handleStartReview = async () => {
    if (!initialApplication?.applicationId) return
    if (!['submitted', 'resubmit'].includes(initialApplication?.status)) return

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
      rejectionReason: undefined
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

    if (decision === 'reject') {
      if (!values.rejectionReasonCode) {
        message.error('Rejection reason is required when rejecting an application')
        return
      }
      if (values.rejectionReasonCode === 'other' && !values.rejectionReasonOther?.trim()) {
        message.error('Please specify the reason when selecting "Other"')
        return
      }
    }

    if (decision === 'request_changes') {
      if (!values.requestsCode) {
        message.error('Requests are required when requesting changes')
        return
      }
      if (values.requestsCode === REQUEST_OTHER_CODE && !values.requestsOther?.trim()) {
        message.error('Please specify what needs to be corrected')
        return
      }
    }

    setReviewing(true)
    try {
      let reviewComments = ''
      
      if (decision === 'approve') {
        reviewComments = values.commentsCode === COMMENT_OTHER_CODE 
          ? values.commentsOther?.trim() || ''
          : COMMENT_OPTIONS.find(opt => opt.value === values.commentsCode)?.label || ''
      } else if (decision === 'request_changes') {
        reviewComments = values.requestsCode === REQUEST_OTHER_CODE 
          ? values.requestsOther?.trim() || ''
          : REQUEST_OPTIONS.find(opt => opt.value === values.requestsCode)?.label || ''
      }

      const result = await onReview({
        applicationId: application.applicationId,
        decision,
        comments: reviewComments,
        rejectionReason: values.rejectionReasonCode,
        rejectionReasonOther: values.rejectionReasonOther,
        businessId: application.businessId
      })

      // If approved, initiate clearance process and generate payments
      if (decision === 'approve' && application?.businessId) {
        try {
          // Check if clearance already exists before initiating
          const { getClearanceStatus } = await import('@/features/business-owner/services/clearanceService')
          const clearanceStatus = await getClearanceStatus(application.businessId).catch(() => null)
          if (!clearanceStatus || !clearanceStatus.initiated) {
            await initiateClearance(application.businessId, application.applicationId)
          }
        } catch (clearanceError) {
          console.error('Failed to initiate clearance:', clearanceError)
          // Only show warning if it's not a "already initiated" error
          if (!clearanceError?.message?.includes('already initiated')) {
            message.warning('Application approved but clearance initiation failed. Please initiate manually.')
          }
        }

        // Generate payment records for the approved business
        try {
          const alreadyGenerated = await hasPaymentsGenerated(application.businessId)
          if (!alreadyGenerated) {
            const paymentResult = await generatePaymentsForApprovedBusiness(application.businessId, application)
            if (paymentResult.success) {
              message.success(`Application approved — ${paymentResult.payments.length} payment record(s) generated for the business owner.`)
            } else {
              message.warning(`Application approved but payment generation failed: ${paymentResult.errors.join(', ')}`)
            }
          } else {
            message.success('Application approved successfully.')
          }
        } catch (paymentError) {
          console.error('Failed to generate payments:', paymentError)
          message.success('Application approved. Payments could not be auto-generated — please create them manually.')
        }
      }

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
      onOk: () => handleReview(values),
      style: { fontFamily: token.fontFamily }
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
      'resubmit': { color: 'gold', text: 'Resubmitted' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Waiting for Applicant' }
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

  const reviewableStatuses = ['submitted', 'resubmit', 'under_review', 'pending_review', 'appeal_pending']
  const canReview = reviewableStatuses.includes(application?.status)
  const isFinalDecision = application?.status === 'approved' || application?.status === 'rejected'
  const isWaitingForApplicant = application?.status === 'needs_revision'
  const isActiveReviewState = application?.status === 'under_review'
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
            <LottieSpinner tip="Loading..." />
          ) : isLobSection ? (
            <LobReviewBlock
              formData={formData}
              fieldReviewDecisions={fieldReviewDecisions}
              onFieldDecision={isActiveReviewState ? handleFieldDecision : undefined}
              onSaveLob={isActiveReviewState ? handleSaveLob : undefined}
              token={token}
              saving={savingLob}
              primaryLineOfBusiness={businessReg.primaryLineOfBusiness}
              reviewLocked={!isActiveReviewState}
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
              onFieldDecision={isActiveReviewState ? handleFieldDecision : undefined}
              reviewLocked={!isActiveReviewState}
            />
          )}
        </div>
      ),
    }
  })

  const paymentStatusAlert = application?.status === 'approved' && paymentGenStatus && (
    <Alert
      type={paymentGenStatus.paymentsGenerated ? 'success' : 'warning'}
      showIcon
      message={paymentGenStatus.paymentsGenerated ? 'Payments Generated' : 'Payment Generation Pending'}
      description={
        <div>
          {paymentGenStatus.paymentsGenerated ? (
            <div>
              <Text>Generated {paymentGenStatus.paymentGenerationMetadata?.paymentCount || 0} payment(s) on {formatDate(paymentGenStatus.paymentsGeneratedAt || paymentGenStatus.lastPaymentGenerationAttempt)}</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Total: ₱{(paymentGenStatus.paymentGenerationMetadata?.totalAmount || 0).toLocaleString()}</Text>
              </div>
            </div>
          ) : (
            <div>
              <Text>Payment generation failed or incomplete</Text>
              {paymentGenStatus.paymentGenerationErrors?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger" style={{ fontSize: 12 }}>{paymentGenStatus.paymentGenerationErrors.join(', ')}</Text>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleRetryPaymentGeneration}
                  loading={retryingPayments}
                >
                  Retry Payment Generation
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      style={{ marginBottom: 16 }}
    />
  )

  const reviewTab = {
    key: 'review',
    label: (
      <Space>
        <FileTextOutlined />
        <span>Review</span>
      </Space>
    ),
    children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {paymentStatusAlert}
          {formDefLoading && (
            <div style={{ marginBottom: 16 }}>
              <LottieSpinner size="small" tip="Loading form sections..." />
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

          {/* Application Details Card */}
          <Card title="Application Details" size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Applicant</Text>
                <div><Text strong>{ownerName}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <div><Text strong style={{ 
                  color: application?.status === 'approved' ? token.colorSuccess 
                         : application?.status === 'rejected' ? token.colorError
                         : application?.status === 'needs_revision' ? token.colorWarning
                         : token.colorInfo 
                }}>
                  {application?.status === 'submitted' ? 'Waiting for Assignment'
                   : application?.status === 'under_review' ? 'Under Review'
                   : application?.status === 'needs_revision' ? 'Revision Required'
                   : application?.status === 'approved' ? 'Approved'
                   : application?.status === 'rejected' ? 'Rejected'
                   : application?.status || 'Unknown'}
                </Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
                <div><Text strong>{formatDate(application?.submittedAt)}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
                <div><Text strong>{application?.reviewedAt ? formatDate(application.reviewedAt) : 'Not yet reviewed'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
                <div><Text strong>{application?.businessRegistration?.businessType === 'temporary' ? 'Temporary' : 'Regular'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
                <div><Text strong>{application?.applicationReferenceNumber || 'Pending'}</Text></div>
              </div>
              {application?.reviewedBy && (
                  <div style={{ gridColumn: '1 / -1', paddingTop: 16, borderTop: `1px solid ${token.colorBorder}` }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Reviewing Officer</Text>
                    <div><Text strong>{typeof application.reviewedBy === 'string' ? 'LGU Officer' : (application.reviewedBy.name || application.reviewedBy.fullName || 'LGU Officer')}</Text></div>
                  </div>
                )}
            </div>
          </Card>

          {/* Appeal Card - shows for rejected applications with appeals */}
          <AppealCard 
            application={application} 
            onAppealResolved={loadApplicationDetails}
          />

          <Card title={canReview ? "Review Status" : "Decision"} size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {canReview && allFieldKeys.length > 0 ? (
                <>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Progress | {decidedCount} of {allFieldKeys.length} fields reviewed
                    {rejectedFields.length > 0 ? ` · ${rejectedFields.length} rejected` : ''}
                    {!allFieldsReviewed ? ` · ${allFieldKeys.length - decidedCount} remaining` : ''}
                    </Text>
                  <Progress
                    percent={Math.round((decidedCount / allFieldKeys.length) * 100)}
                    status={rejectedFields.length > 0 ? 'exception' : allFieldsReviewed ? 'success' : 'active'}
                    size="small"
                  />
                  {rejectedFields.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: token.colorErrorBg, borderRadius: token.borderRadius }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        <CloseCircleOutlined style={{ color: token.colorError, marginRight: 4 }} />
                        Rejected fields:
                      </Text>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                        {rejectedFields.map((fk) => {
                          const d = fieldReviewDecisions[fk]
                          const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Rejected'
                          
                          // Get field label from form definition
                          let fieldLabel = fk
                          const parts = String(fk).split('.')
                          if (parts.length >= 2) {
                            const sectionIdx = parseInt(parts[0])
                            const itemKey = parts.slice(1).join('.')
                            const section = sections?.[sectionIdx]
                            const item = section?.items?.find(it => (it.key || it.label) === itemKey || itemKey.startsWith(it.key || it.label))
                            if (item) {
                              fieldLabel = item.label || item.key || fk
                            }
                          }
                          
                          return <li key={fk}><Text style={{ fontSize: 12 }}>{fieldLabel}: {reason}</Text></li>
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ) : isWaitingForApplicant ? (
                <RevokeDecisionSection 
                  application={application}
                  onRevoke={async () => {
                    const idToUse = application.businessId || application.applicationId || application._id
                    await post(`/api/lgu-officer/permit-applications/${idToUse}/reset-status`, { newStatus: 'under_review' })
                    message.success('Decision revoked - application reset to under review')
                    await loadApplicationDetails()
                  }}
                />
              ) : (isFinalDecision ? (
                <RevokeDecisionSection 
                  application={application}
                  onRevoke={async () => {
                    const idToUse = application.businessId || application.applicationId || application._id
                    await post(`/api/lgu-officer/permit-applications/${idToUse}/reset-status`, { newStatus: 'under_review' })
                    message.success('Decision revoked - application reset to under review')
                    await loadApplicationDetails()
                  }}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isDraft
                    ? 'The application must be submitted before review can begin.'
                    : 'Review availability depends on the application status.'}
                </Text>
              ))}

              {/* Review Decision Form */}
              {canReview ? (
                <Form form={form} layout="vertical" onFinish={handleConfirmReview}>
                <Form.Item
                  label={<Text type="secondary" style={{ fontSize: 12 }}>Decision</Text>}
                  name="decision"
                  rules={[{ required: true, message: 'Please select a decision' }]}
                >
                  <Radio.Group onChange={handleDecisionChange} value={decision} style={{ width: '100%' }}>
                    <Radio.Button 
                      value="approve" 
                      disabled={rejectedFields.length > 0}
                    >
                      Approve
                    </Radio.Button>
                    <Radio.Button value="reject">Reject</Radio.Button>
                    <Radio.Button 
                      value="request_changes"
                      disabled={rejectedFields.length === 0}
                    >
                      Request Changes
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                {decision === 'approve' && (
                  <>
                    <Form.Item 
                      label={<Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>} 
                      name="commentsCode" 
                    >
                      <Select
                        placeholder="Select comment (optional)"
                        options={COMMENT_OPTIONS}
                        style={{ fontSize: 13, fontFamily: token.fontFamily }}
                      />
                    </Form.Item>
                    
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.commentsCode !== curr.commentsCode}>
                      {({ getFieldValue }) => 
                        getFieldValue('commentsCode') === COMMENT_OTHER_CODE ? (
                          <Form.Item 
                            label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Comments</Text>}
                            name="commentsOther"
                          >
                            <TextArea 
                              rows={3} 
                              placeholder="Add detailed comments..."
                              style={{ fontSize: 13 }} 
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </>
                )}

                {decision === 'reject' && (
                  <>
                    <Form.Item 
                      label={<Text type="secondary" style={{ fontSize: 12 }}>Rejection Reason</Text>} 
                      name="rejectionReasonCode" 
                      rules={[{ required: true, message: 'Please select a rejection reason' }]}
                    >
                      <Select
                        placeholder="Select rejection reason"
                        options={REJECTION_REASON_OPTIONS}
                        style={{ fontSize: 13, fontFamily: token.fontFamily }}
                      />
                    </Form.Item>
                    
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.rejectionReasonCode !== curr.rejectionReasonCode}>
                      {({ getFieldValue }) => 
                        getFieldValue('rejectionReasonCode') === 'other' ? (
                          <Form.Item 
                            label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Reason</Text>}
                            name="rejectionReasonOther"
                            rules={[{ required: true, message: 'Please specify the reason' }]}
                          >
                            <TextArea 
                              rows={2} 
                              placeholder="Please specify the reason for rejection..." 
                              style={{ fontSize: 13 }} 
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </>
                )}

                {decision === 'request_changes' && (
                  <>
                    <Form.Item 
                      label={<Text type="secondary" style={{ fontSize: 12 }}>Requests</Text>} 
                      name="requestsCode" 
                      rules={[{ required: true, message: 'Please specify what changes are needed' }]}
                    >
                      <Select
                        placeholder="Select request type"
                        options={REQUEST_OPTIONS}
                        style={{ fontSize: 13, fontFamily: token.fontFamily }}
                      />
                    </Form.Item>
                    
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.requestsCode !== curr.requestsCode}>
                      {({ getFieldValue }) => 
                        getFieldValue('requestsCode') === REQUEST_OTHER_CODE ? (
                          <Form.Item 
                            label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Requests</Text>}
                            name="requestsOther"
                            rules={[{ required: true, message: 'Please specify what needs to be corrected' }]}
                          >
                            <TextArea 
                              rows={3} 
                              placeholder="Summarize the corrections or guidance for the applicant..."
                              style={{ fontSize: 13 }} 
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </>
                )}

                

                <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                  <Tooltip 
                    title={canReview && allFieldKeys.length > 0 && !allFieldsReviewed 
                      ? `Please review all fields before submitting (${decidedCount} of ${allFieldKeys.length} completed)` 
                      : null}
                  >
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={reviewing}
                      disabled={canReview && allFieldKeys.length > 0 && !allFieldsReviewed}
                      block
                    >
                      Submit Review
                    </Button>
                  </Tooltip>
                </Form.Item>
              </Form>
              ) : null}
            </Space>
          </Card>

          {/* Issues to Fix Card - shows rejected fields when review is locked */}
          {(isWaitingForApplicant || isFinalDecision) && rejectedFields.length > 0 && (
            <Card title="Issues Identified" size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {rejectedFields.map((fk) => {
                  const d = fieldReviewDecisions[fk]
                  const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Needs correction'
                  
                  // Get field label from form definition
                  let fieldLabel = fk
                  const parts = String(fk).split('.')
                  if (parts.length >= 2) {
                    const sectionIdx = parseInt(parts[0])
                    const itemKey = parts.slice(1).join('.')
                    const section = sections?.[sectionIdx]
                    const item = section?.items?.find(it => (it.key || it.label) === itemKey || itemKey.startsWith(it.key || it.label))
                    if (item) {
                      fieldLabel = item.label || item.key || fk
                    }
                  }
                  
                  return (
                    <div key={fk}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{fieldLabel}</Text>
                      <div><Text strong style={{ color: token.colorError }}>{reason}</Text></div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Application History / Audit Trail */}
          {applicationHistory.length > 0 && (
            <Collapse
              style={{ marginBottom: 16 }}
              items={[{
                key: 'history',
                label: <Space><HistoryOutlined /><Text strong>Application History & Audit Trail</Text></Space>,
                children: (
                  <Table
                    dataSource={applicationHistory.map((ev, index) => ({
                      key: index,
                      date: formatDate(ev.at),
                      user: ev.user || ev.officer || ev.actor || 'System',
                      action: ev.label || ev.event || ev.action || 'Unknown',
                      details: ev.details || ev.description || '',
                      files: ev.files || ev.documents || []
                    }))}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'date',
                        key: 'date',
                        width: 150,
                      },
                      {
                        title: 'User',
                        dataIndex: 'user',
                        key: 'user',
                        width: 120,
                      },
                      {
                        title: 'Action',
                        dataIndex: 'action',
                        key: 'action',
                        width: 200,
                      },
                      {
                        title: 'Details',
                        dataIndex: 'details',
                        key: 'details',
                        render: (details) => details ? <Text type="secondary">{details}</Text> : '-'
                      },
                      {
                        title: 'Files',
                        dataIndex: 'files',
                        key: 'files',
                        width: 100,
                        render: (files) => {
                          if (!files || files.length === 0) return '-'
                          return (
                            <Space direction="vertical" size="small">
                              {files.map((file, idx) => (
                                <div key={idx}>
                                  <Text code style={{ fontSize: 11 }}>{file.name || file.fileName || 'Document'}</Text>
                                  {file.cid && (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 10 }}>CID: {file.cid}</Text>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </Space>
                          )
                        }
                      }
                    ]}
                    size="small"
                    pagination={false}
                    scroll={{ x: 800 }}
                  />
                ),
              }]}
            />
          )}
        </div>
      )
    }

  const ownerTab = {
    key: 'owner',
    label: (
      <Space>
        <UserOutlined />
        <span>Owner</span>
      </Space>
    ),
    children: (
      <div style={{ padding: 16, overflow: 'auto' }}>
        <OwnerInfoReadOnlyView
          application={application}
          ownerIdentity={ownerIdentity}
          businessReg={businessReg}
          ownerName={ownerName}
          onSelectApplication={onSelectApplication}
        />
      </div>
    )
  }

  const tabItems = [
    reviewTab,
    ownerTab,
    ...sectionTabs
  ]

  const navItems = tabItems.map((t) => ({ key: t.key, label: t.label }))
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
    <>
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
      {(loading || startingReview) ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <LottieSpinner size="large" />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', height: '100%' }}>
        {/* Closed business warning */}
        {application?.businessStatus === 'closed' && (
          <Alert
            type="warning"
            showIcon
            banner
            message="This business has been closed (cessation confirmed)."
            style={{ flexShrink: 0 }}
          />
        )}
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
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {(isFinalDecision || isWaitingForApplicant) ? (
          /* Post-decision view: polished approved/rejected/needs_revision layout */
          <OfficerApprovedView
            application={application}
            ownerIdentity={ownerIdentity}
            businessReg={businessReg}
            ownerName={ownerName}
            paymentStatusAlert={paymentStatusAlert}
            revokeSection={
              <RevokeDecisionSection
                application={application}
                onRevoke={async () => {
                  const idToUse = application.businessId || application.applicationId || application._id
                  await post(`/api/lgu-officer/permit-applications/${idToUse}/reset-status`, { newStatus: 'under_review' })
                  message.success('Decision revoked - application reset to under review')
                  await loadApplicationDetails()
                }}
              />
            }
            appealCard={
              <AppealCard
                application={application}
                onAppealResolved={loadApplicationDetails}
              />
            }
            rejectedFieldsCard={
              rejectedFields.length > 0 ? (
                <Card title="Issues Identified" size="small" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {rejectedFields.map((fk) => {
                      const d = fieldReviewDecisions[fk]
                      const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Needs correction'
                      let fieldLabel = fk
                      const parts = String(fk).split('.')
                      if (parts.length >= 2) {
                        const sIdx = parseInt(parts[0])
                        const itemKey = parts.slice(1).join('.')
                        const section = sections?.[sIdx]
                        const item = section?.items?.find(it => (it.key || it.label) === itemKey || itemKey.startsWith(it.key || it.label))
                        if (item) fieldLabel = item.label || item.key || fk
                      }
                      return (
                        <div key={fk}>
                          <Text type="secondary" style={{ fontSize: 12 }}>{fieldLabel}</Text>
                          <div><Text strong style={{ color: token.colorError }}>{reason}</Text></div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ) : null
            }
            historyCollapse={
              applicationHistory.length > 0 ? (
                <Collapse
                  items={[{
                    key: 'history',
                    label: <Space><HistoryOutlined /><Text strong>Application History & Audit Trail</Text></Space>,
                    children: (
                      <Table
                        dataSource={applicationHistory.map((ev, index) => ({
                          key: index,
                          date: formatDate(ev.at),
                          user: ev.user || ev.officer || ev.actor || 'System',
                          action: ev.label || ev.event || ev.action || 'Unknown',
                          details: ev.details || ev.description || '',
                          files: ev.files || ev.documents || []
                        }))}
                        columns={[
                          { title: 'Date', dataIndex: 'date', key: 'date', width: 150 },
                          { title: 'User', dataIndex: 'user', key: 'user', width: 120 },
                          { title: 'Action', dataIndex: 'action', key: 'action', width: 200 },
                          { title: 'Details', dataIndex: 'details', key: 'details', render: (details) => details ? <Text type="secondary">{details}</Text> : '-' },
                        ]}
                        size="small"
                        pagination={false}
                        scroll={{ x: 700 }}
                      />
                    ),
                  }]}
                />
              ) : null
            }
          />
        ) : (
        /* Reviewable / draft / other states: original vertical nav + panel layout */
        <>
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
                  
                  let statusIcon = null
                  if (status === 'ok') {
                    statusIcon = <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8, flexShrink: 0 }} />
                  } else if (status === 'rejected') {
                    statusIcon = <CloseCircleOutlined style={{ color: token.colorError, marginRight: 8, flexShrink: 0 }} />
                  } else if (status === 'pending') {
                    statusIcon = <ClockCircleOutlined style={{ color: token.colorWarning, marginRight: 8, flexShrink: 0 }} />
                  }
                  
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
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {statusIcon}
                        {item.label}
                      </span>
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
        </>
        )}
        </div>
        </div>
      )}
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
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Image
                  src={documentModal.url}
                  alt={documentModal.label}
                  style={{
                    width: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                  preview={{
                    mask: (
                      <Space direction="vertical" size={4}>
                        <EyeOutlined style={{ fontSize: 16 }} />
                        <Text style={{ fontSize: 12, color: '#fff' }}>Zoom</Text>
                      </Space>
                    ),
                  }}
                />
              </div>
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
    </>
  )
}
