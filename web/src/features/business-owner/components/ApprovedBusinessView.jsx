import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Typography, Card, Tag, Space, Button, theme, Table, Empty, Modal,
  Input, Drawer, Select, Descriptions, Alert, Checkbox, App, Spin, Upload,
  Statistic, Row, Col, Segmented, Popconfirm, Calendar, Badge, Steps, Collapse,
} from 'antd'
import {
  SafetyCertificateOutlined, DollarOutlined, CheckCircleOutlined,
  WarningOutlined, ClockCircleOutlined, DownloadOutlined, ReloadOutlined,
  FileTextOutlined, StopOutlined, EditOutlined,
  AppstoreOutlined, UploadOutlined, AuditOutlined, FileDoneOutlined,
  EyeOutlined, SendOutlined, SolutionOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPayments, processPayment, generateReceiptForPayment } from '../services/paymentsService'
import { getInspections, getInspection as getInspectionDetail, acknowledgeInspection } from '../services/inspectionsService'
import { getViolations, acknowledgeViolation, getViolationSummary } from '../services/violationsService'
import { submitRetirement } from '../services/retirementService'
import { submitEditRequest, getEditRequests } from '../services/editRequestsService'
import { submitAppeal, getAppeals } from '../services/appealsService'
import { getPostRequirements, submitCompliance, requestExtension } from '../services/postRequirementsService'
import DynamicFormRenderer from './DynamicFormRenderer'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import { Form } from '@/shared/components/AppForm'
import PaymentGatewayModal from './payments/PaymentGatewayModal'
import PermitDownloadCard from './permits/PermitDownloadCard'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('MMM D, YYYY')
}

function buildRetirementRequestedDescription(retirementRequestedAt, retirementReason) {
  const reasonText = String(retirementReason || '').trim()
  return (
    <>
      <div>Submitted {formatDate(retirementRequestedAt)}. Waiting for inspector verification.</div>
      {reasonText ? (
        <div style={{ marginTop: 4 }}>
          <Text strong>Reason:</Text> {reasonText}
        </div>
      ) : null}
    </>
  )
}

function normalizeFormDataForRenderer(formData, definition) {
  if (!formData || typeof formData !== 'object') return {}

  const normalized = { ...formData }
  const sections = definition?.sections || []

  sections.forEach((section) => {
    ;(section.items || []).forEach((item) => {
      const key = item.key || item.label
      if (!key) return

      if (item.type === 'date') {
        const value = normalized[key]
        if (value != null && value !== '' && !dayjs.isDayjs(value)) {
          try {
            const parsed = dayjs(value)
            // Only set if it's a valid dayjs object
            if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
              normalized[key] = parsed
            } else {
              // Keep original value if it's not a valid date
              normalized[key] = value
            }
          } catch (error) {
            // Keep original value if dayjs parsing fails
            normalized[key] = value
          }
        }
      }

      if (item.type === 'repeatable_group' && Array.isArray(normalized[key]) && item.groupFields?.length) {
        const groupDateKeys = (item.groupFields || [])
          .filter((field) => field.type === 'date')
          .map((field) => field.key || field.label)
          .filter(Boolean)

        if (!groupDateKeys.length) return

        normalized[key] = normalized[key].map((row) => {
          if (!row || typeof row !== 'object') return row
          const next = { ...row }
          groupDateKeys.forEach((groupKey) => {
            const value = next[groupKey]
            if (value != null && value !== '' && !dayjs.isDayjs(value)) {
              try {
                const parsed = dayjs(value)
                // Only set if it's a valid dayjs object
                if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
                  next[groupKey] = parsed
                } else {
                  // Keep original value if it's not a valid date
                  next[groupKey] = value
                }
              } catch (error) {
                // Keep original value if dayjs parsing fails
                next[groupKey] = value
              }
            }
          })
          return next
        })
      }
    })
  })

  return normalized
}

function ApplicationFormTab({ business }) {
  const { token } = theme.useToken()
  const form = Form.useForm()[0]
  const [formDefinition, setFormDefinition] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadFormDefinition = async () => {
      // Try multiple possible ID fields
      const appId = business?.applicationId || business?._id || business?.businessId
      if (!appId) return
      
      setLoading(true)
      try {
        const formDefId = business?.formDefinitionId
        const formType = business?.formType || 'permit'

        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, business?.businessType || null, null)
        }

        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        }
      } catch (error) {
        console.error('Failed to load form definition:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFormDefinition()
  }, [business?.applicationId, business?._id, business?.businessId, business?.formDefinitionId, business?.formType, business?.businessType])

  const formData = business?.formData && typeof business.formData === 'object' ? business.formData : {}
  
  // Build documents object from lguDocuments and documentCids (same as AddBusinessForm)
  const documents = useMemo(() => {
    const lguDocs = business?.lguDocuments || business?.documentCids || {}
    const resolved = { ...lguDocs }
    // Resolve *IpfsCid keys to base keys (e.g. dtiSecCdaCertificateIpfsCid -> dtiSecCdaCertificate)
    Object.keys(lguDocs).forEach((k) => {
      if (k.endsWith('IpfsCid')) {
        const baseKey = k.replace(/IpfsCid$/, '')
        if (!resolved[baseKey] && lguDocs[k]) {
          resolved[baseKey] = lguDocs[k]
        }
      }
    })
    // Also include document CIDs from formData
    if (formData && typeof formData === 'object') {
      Object.keys(formData).forEach((k) => {
        const val = formData[k]
        // Check if it looks like a CID (string starting with Qm or bafy)
        if (typeof val === 'string' && (val.startsWith('Qm') || val.startsWith('bafy'))) {
          if (!resolved[k]) {
            resolved[k] = val
          }
        }
      })
    }
    return resolved
  }, [business?.lguDocuments, business?.documentCids, formData])
  
  const normalizedFormData = useMemo(
    () => normalizeFormDataForRenderer(formData, formDefinition),
    [formData, formDefinition]
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading application form...</Text>
        </div>
      </div>
    )
  }

  if (!formDefinition) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          description={<Text type="secondary">Application form not available</Text>}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '100%' }}>
        <Form form={form} layout="vertical" initialValues={normalizedFormData}>
          <DynamicFormRenderer
            definition={formDefinition}
            form={form}
            formValues={normalizedFormData}
            readOnly={true}
            documents={documents}
            businessId={business?.businessId || business?._id}
            formDataKey={business?.businessId ?? business?._id ?? 'approved'}
          />
        </Form>
    </div>
  )
}

function formatCurrency(value) {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

function OverviewTab({ business, onRetire, onRequestEdit }) {
  const { token } = theme.useToken()
  const retirementStatus = business?.retirementStatus || (business?.businessStatus === 'closed' ? 'confirmed' : '')
  const retirementPending = retirementStatus === 'requested'
  const retirementActive = ['requested', 'inspector_verified', 'pending_tax_payment'].includes(retirementStatus)
  const retirementReason = business?.retirementApplicationLetter || business?.retirementReason

  const retirementAlertConfig = {
    requested: {
      type: 'warning',
      title: 'Retirement Requested',
      description: buildRetirementRequestedDescription(business?.retirementRequestedAt, retirementReason),
    },
    inspector_verified: {
      type: 'info',
      title: 'Retirement Verified by Inspector',
      description: 'Your retirement request has been inspector-verified and is awaiting LGU officer confirmation.',
    },
    pending_tax_payment: {
      type: 'warning',
      title: 'Cessation Tax Assessed',
      description: 'A cessation tax has been assessed for your business. Please complete the payment in the Payments & Fees section below to proceed with closure.',
    },
    confirmed: {
      type: 'success',
      title: 'Retirement Confirmed',
      description: `Confirmed ${formatDate(business?.retirementConfirmedAt)}. Business status is now closed.`,
    },
    rejected: {
      type: 'error',
      title: 'Retirement Request Rejected',
      description: business?.retirementRejectionReason || 'Please review remarks and contact LGU support if needed.',
    },
  }
  const retirementAlert = retirementAlertConfig[retirementStatus] || null

  return (
    <div style={{ padding: '16px 0' }}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Business Name">{business?.businessName || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Reference">{business?.applicationReferenceNumber || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Business Type">{business?.primaryLineOfBusiness || business?.lineOfBusiness || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Registration Date">{formatDate(business?.submittedAt || business?.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Approval Date">{formatDate(business?.reviewedAt || business?.approvedAt)}</Descriptions.Item>
        <Descriptions.Item label="Address">
          {business?.businessAddress?.full ||
            [business?.businessAddress?.streetAddress, business?.businessAddress?.barangayName, business?.businessAddress?.cityName].filter(Boolean).join(', ') ||
            'N/A'}
        </Descriptions.Item>
      </Descriptions>

      {retirementAlert && (
        <Alert
          type={retirementAlert.type}
          showIcon
          message={retirementAlert.title}
          description={retirementAlert.description}
          style={{ marginTop: 16 }}
        />
      )}

      <Space style={{ marginTop: 20 }} wrap>
        {!retirementPending && (
          <Button icon={<StopOutlined />} danger onClick={onRetire}>
            Retire Business
          </Button>
        )}
        {!retirementActive && (
          <Button icon={<EditOutlined />} onClick={onRequestEdit}>
            Request Edit
          </Button>
        )}
      </Space>
    </div>
  )
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash (Pay at City Hall)' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online_banking', label: 'Online Banking' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
]

function PaymentsTab({ businessId, onPaymentComplete }) {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [lastPaymentResult, setLastPaymentResult] = useState(null)

  const fetchPayments = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const openPayModal = (record) => {
    setSelectedPayment(record)
    setGatewayModalOpen(true)
  }

  const handlePaymentSuccess = async (paymentResult) => {
    message.success('Payment processed successfully')
    setGatewayModalOpen(false)
    setLastPaymentResult(paymentResult)
    setSelectedPayment(null)
    fetchPayments()
    // Notify parent to refresh payment state
    if (onPaymentComplete) onPaymentComplete()
  }

  const displayPayments = useMemo(() => {
    const nonPending = []
    const pendingBySignature = new Map()

    for (const p of payments) {
      const isPending = p?.status === 'pending' && !p?.paidAt
      if (!isPending) {
        nonPending.push(p)
        continue
      }

      const sig = [
        p?.businessId || '',
        p?.paymentType || '',
        p?.relatedEntityType || '',
        p?.relatedEntityId || '',
        p?.description || '',
        Number(p?.amount || 0),
      ].join('|')

      const existing = pendingBySignature.get(sig)
      if (!existing) {
        pendingBySignature.set(sig, p)
      }
    }

    return [...nonPending, ...Array.from(pendingBySignature.values())]
  }, [payments])

  const pendingPayments = displayPayments.filter((p) => p.status === 'pending' && !p.paidAt)

  const handlePayTotalDue = () => {
    if (!pendingPayments.length) return
    const paymentIds = pendingPayments.map(p => p.paymentId || p._id).filter(Boolean)
    setSelectedPayment({ _id: 'bulk', amount: pendingTotal, description: `Total due (${pendingPayments.length} items)`, paymentIds })
    setGatewayModalOpen(true)
  }

  const pendingTotal = pendingPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Description', dataIndex: 'description', key: 'desc', render: (v, r) => v || r.paymentType || 'Payment' },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', width: 150,
      render: (v, r) => (
        <div>
          <div>{formatCurrency(v)}</div>
          {r.isOverdue && r.penaltyAmount > 0 && (
            <Text type="danger" style={{ fontSize: 11 }}>
              +{formatCurrency(r.penaltyAmount)} penalty
              {r.surchargeAmount > 0 && ` (surcharge: ${formatCurrency(r.surchargeAmount)})`}
              {r.interestAmount > 0 && ` (interest: ${formatCurrency(r.interestAmount)})`}
            </Text>
          )}
        </div>
      ),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'paid' ? 'success' : v === 'pending' ? 'processing' : v === 'cancelled' ? 'default' : 'warning'}>{v || 'N/A'}</Tag> },
  ]

  const handleDownloadReceipt = async (record) => {
    const id = record._id || record.paymentId
    try {
      const res = await generateReceiptForPayment(id)
      const receipt = res?.data || res
      const receiptNo = receipt?.receiptNumber || `RCP-${id}`
      const receiptContent = [
        '═══════════════════════════════════════',
        '           OFFICIAL RECEIPT            ',
        '═══════════════════════════════════════',
        '',
        `  Receipt No:   ${receiptNo}`,
        `  Date:         ${formatDate(receipt?.paidAt || record.paidAt || new Date().toISOString())}`,
        `  Description:  ${receipt?.description || record.description || record.paymentType || 'Payment'}`,
        `  Amount:       ${formatCurrency(receipt?.amount || record.amount)}`,
        `  Method:       ${receipt?.paymentMethod || record.paymentMethod || 'N/A'}`,
        `  Status:       Paid`,
        `  Business ID:  ${receipt?.businessId || businessId}`,
        '',
        '═══════════════════════════════════════',
        '  This serves as your official receipt.',
        '═══════════════════════════════════════',
      ].join('\n')
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receiptNo}.txt`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      message.success(`Receipt ${receiptNo} downloaded`)
    } catch (err) {
      console.error('Receipt download error:', err)
      message.error('Failed to generate receipt')
    }
  }

  // Get paid payments for combined receipt
  const paidPayments = displayPayments.filter(p => p.status === 'paid')
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const handleDownloadCombinedReceipt = () => {
    if (!paidPayments.length) return
    const receiptNo = `RCP-${businessId?.slice(-8) || 'UNKNOWN'}-${Date.now()}`
    const receiptContent = [
      '═══════════════════════════════════════════════════════════════',
      '                    OFFICIAL RECEIPT                           ',
      '              Business Permit Application Fees                 ',
      '═══════════════════════════════════════════════════════════════',
      '',
      `  Receipt No:     ${receiptNo}`,
      `  Date Issued:    ${formatDate(new Date().toISOString())}`,
      `  Business ID:    ${businessId}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '  PAYMENT DETAILS                                              ',
      '───────────────────────────────────────────────────────────────',
      '',
      ...paidPayments.map((p, i) => [
        `  ${i + 1}. ${p.description || p.paymentType || 'Payment'}`,
        `     Amount: ${formatCurrency(p.amount)}`,
        `     Paid:   ${formatDate(p.paidAt)}`,
        '',
      ]).flat(),
      '───────────────────────────────────────────────────────────────',
      `  TOTAL AMOUNT PAID:  ${formatCurrency(totalPaid)}`,
      '───────────────────────────────────────────────────────────────',
      '',
      '  This serves as your official receipt for business permit',
      '  application fees. Please keep this for your records.',
      '',
      '═══════════════════════════════════════════════════════════════',
    ].join('\n')

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receiptNo}.txt`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    message.success(`Receipt ${receiptNo} downloaded`)
  }

  return (
    <>
      <Table
        size="small"
        rowKey={r => r._id || r.paymentId}
        columns={columns}
        dataSource={displayPayments}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No payment records" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {paidPayments.length > 0 && (
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadCombinedReceipt}
          >
            Download Receipt ({formatCurrency(totalPaid)})
          </Button>
        )}
        {pendingTotal > 0 && (
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={handlePayTotalDue}
          >
            Pay Total Due ({formatCurrency(pendingTotal)})
          </Button>
        )}
      </div>

      <PaymentGatewayModal
        visible={gatewayModalOpen}
        onCancel={() => {
          setGatewayModalOpen(false)
          setSelectedPayment(null)
        }}
        onSuccess={handlePaymentSuccess}
        amount={selectedPayment?.amount || 0}
        description={selectedPayment?.description || 'Payment'}
        businessId={businessId}
        reference={selectedPayment?._id || selectedPayment?.paymentId}
        paymentIds={selectedPayment?.paymentIds || (selectedPayment?.paymentId ? [selectedPayment.paymentId] : selectedPayment?._id && selectedPayment._id !== 'bulk' ? [selectedPayment._id] : [])}
      />
    </>
  )
}

function ComplianceTab({ businessId }) {
  const { message: msg } = App.useApp()
  const [inspections, setInspections] = useState([])
  const [violations, setViolations] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [violationStatusFilter, setViolationStatusFilter] = useState('all')
  const [inspectionFilter, setInspectionFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [ackLoading, setAckLoading] = useState(null)
  const [inspectionAckLoading, setInspectionAckLoading] = useState(null)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    Promise.all([
      getInspections({ businessId }).catch(() => []),
      getViolations({ businessId }).catch(() => []),
      getViolationSummary().catch(() => null),
    ]).then(([ins, vio, sum]) => {
      setInspections(Array.isArray(ins) ? ins : ins?.inspections || ins?.data || [])
      setViolations(Array.isArray(vio) ? vio : vio?.violations || vio?.data || [])
      setSummary(sum)
    }).finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAcknowledge = async (violationId) => {
    setAckLoading(violationId)
    try {
      await acknowledgeViolation(violationId)
      msg.success('Violation acknowledged')
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to acknowledge')
    } finally {
      setAckLoading(null)
    }
  }

  const handleInspectionDetail = async (record) => {
    const id = record._id || record.inspectionId
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const data = await getInspectionDetail(id)
      setDetailData(data)
    } catch {
      setDetailData(record)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleInspectionAcknowledge = async (inspectionId) => {
    setInspectionAckLoading(inspectionId)
    try {
      await acknowledgeInspection(inspectionId)
      msg.success('Inspection acknowledged')
      if (detailData && (detailData._id === inspectionId || detailData.id === inspectionId)) {
        setDetailData((prev) => ({
          ...prev,
          ownerAcknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          ownerAcknowledgment: {
            ...(prev?.ownerAcknowledgment || {}),
            acknowledged: true,
            timestamp: new Date().toISOString(),
          },
        }))
      }
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to acknowledge inspection')
    } finally {
      setInspectionAckLoading(null)
    }
  }

  const now = dayjs()
  const filteredInspections = inspections.filter(i => {
    if (inspectionFilter === 'upcoming') return dayjs(i.scheduledDate).isAfter(now)
    if (inspectionFilter === 'past') return dayjs(i.scheduledDate).isBefore(now)
    return true
  })

  const filteredViolations = violations.filter(v => {
    if (violationStatusFilter === 'all') return true
    return v.status === violationStatusFilter
  })

  const latestCompletedInspection = [...inspections]
    .filter((i) => i.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.scheduledDate || 0) - new Date(a.completedAt || a.scheduledDate || 0))[0]

  const latestOutcomeLabel = latestCompletedInspection?.overallResult || latestCompletedInspection?.result
  const latestOutcomeType =
    latestOutcomeLabel === 'passed'
      ? 'success'
      : latestOutcomeLabel === 'failed'
        ? 'warning'
        : latestOutcomeLabel === 'needs_reinspection'
          ? 'warning'
          : 'info'

  const inspectionCols = [
    { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Type', dataIndex: 'inspectionType', key: 'type', width: 120 },
    { title: 'Result', dataIndex: 'result', key: 'result', width: 100, render: v => <Tag color={v === 'passed' ? 'success' : v === 'failed' ? 'error' : 'default'}>{v || 'Pending'}</Tag> },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v, r) => v || r.inspector?.name || 'N/A' },
    {
      title: '',
      key: 'action',
      width: 210,
      render: (_, r) => {
        const inspectionId = r._id || r.inspectionId || r.id
        const acknowledged = Boolean(r.ownerAcknowledged || r.ownerAcknowledgment?.acknowledged || r.acknowledgedAt)
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleInspectionDetail(r)} />
            {r.status === 'completed' && !acknowledged ? (
              <Button
                size="small"
                type="primary"
                loading={inspectionAckLoading === inspectionId}
                onClick={() => handleInspectionAcknowledge(inspectionId)}
              >
                Acknowledge
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const violationCols = [
    { title: 'Type', dataIndex: 'violationType', key: 'type' },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 100, render: v => <Tag color={v === 'critical' ? 'error' : v === 'major' ? 'warning' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Deadline', dataIndex: 'complianceDeadline', key: 'deadline', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'resolved' ? 'success' : v === 'open' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
    {
      title: '', key: 'action', width: 110,
      render: (_, r) => r.status === 'open' ? (
        <Button size="small" loading={ackLoading === (r._id || r.violationId)} onClick={() => handleAcknowledge(r._id || r.violationId)}>Acknowledge</Button>
      ) : null,
    },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {latestCompletedInspection ? (
        <Alert
          type={latestOutcomeType}
          showIcon
          message={`Latest inspection outcome: ${latestOutcomeLabel || 'completed'}`}
          description={`Inspection date: ${formatDate(latestCompletedInspection.completedAt || latestCompletedInspection.scheduledDate)}${latestCompletedInspection.ownerAcknowledged || latestCompletedInspection.ownerAcknowledgment?.acknowledged ? ' • Acknowledged' : ' • Action required: acknowledge result'}`}
        />
      ) : null}
      {summary && (
        <Row gutter={16}>
          <Col xs={8}><Statistic title="Open" value={summary.open ?? 0} valueStyle={{ color: '#cf1322' }} /></Col>
          <Col xs={8}><Statistic title="Resolved" value={summary.resolved ?? 0} valueStyle={{ color: '#3f8600' }} /></Col>
          <Col xs={8}><Statistic title="Appealed" value={summary.appealed ?? 0} valueStyle={{ color: '#faad14' }} /></Col>
        </Row>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Inspections</Title>
          <Segmented options={[{ label: 'All', value: 'all' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Past', value: 'past' }]} value={inspectionFilter} onChange={setInspectionFilter} size="small" />
        </div>
        <Table size="small" rowKey={r => r._id || r.inspectionId} columns={inspectionCols} dataSource={filteredInspections} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No inspections recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
      {inspections.length > 0 && (
        <Card size="small" title="Inspection Schedule">
          <Calendar
            fullscreen={false}
            cellRender={(date) => {
              const dateStr = date.format('YYYY-MM-DD')
              const dayInspections = inspections.filter(i => dayjs(i.scheduledDate).format('YYYY-MM-DD') === dateStr)
              if (!dayInspections.length) return null
              return (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {dayInspections.map((i, idx) => (
                    <li key={idx}>
                      <Badge
                        status={i.status === 'completed' ? (i.overallResult === 'passed' || i.result === 'passed' ? 'success' : 'error') : i.status === 'in_progress' ? 'processing' : 'warning'}
                        text={<span style={{ fontSize: 10 }}>{i.inspectionType || 'Inspection'}</span>}
                      />
                    </li>
                  ))}
                </ul>
              )
            }}
          />
        </Card>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Violations</Title>
          <Select size="small" value={violationStatusFilter} onChange={setViolationStatusFilter} style={{ width: 130 }} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'appealed', label: 'Appealed' }]} />
        </div>
        <Table size="small" rowKey={r => r._id || r.violationId} columns={violationCols} dataSource={filteredViolations} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No violations recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>

      <Drawer title="Inspection Detail" open={detailOpen} onClose={() => setDetailOpen(false)} width={480}>
        {detailLoading ? <Spin /> : detailData ? (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Date">{formatDate(detailData.scheduledDate)}</Descriptions.Item>
              <Descriptions.Item label="Type">{detailData.inspectionType || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Result">{detailData.result || detailData.overallResult || 'Pending'}</Descriptions.Item>
              <Descriptions.Item label="Inspector">{detailData.inspectorName || detailData.inspector?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Notes">{detailData.notes || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Acknowledgment">
                {detailData.ownerAcknowledged || detailData.ownerAcknowledgment?.acknowledged
                  ? `Acknowledged on ${formatDate(detailData.acknowledgedAt || detailData.ownerAcknowledgment?.timestamp)}`
                  : 'Not yet acknowledged'}
              </Descriptions.Item>
            </Descriptions>
            {detailData.status === 'completed' && !(detailData.ownerAcknowledged || detailData.ownerAcknowledgment?.acknowledged) ? (
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  loading={inspectionAckLoading === (detailData._id || detailData.inspectionId || detailData.id)}
                  onClick={() => handleInspectionAcknowledge(detailData._id || detailData.inspectionId || detailData.id)}
                >
                  Acknowledge Inspection Result
                </Button>
              </div>
            ) : null}
          </>
        ) : <Empty />}
      </Drawer>
    </div>
  )
}

function PermitsTab({ businessId, businessName, onPermitDownloaded }) {
  return <PermitDownloadCard businessId={businessId} businessName={businessName} onPermitDownloaded={onPermitDownloaded} />
}

function RetirementModal({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { message.warning('Please provide a reason'); return }
    if (!confirmed) { message.warning('Please confirm you understand'); return }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      await submitRetirement(businessId, { reason })
      message.success('Retirement request submitted')
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit retirement request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Retire Business"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Submit Retirement Request"
      okButtonProps={{ danger: true, loading: submitting, disabled: !reason.trim() || !confirmed }}
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        message="This action will initiate the retirement process for this business."
        description="Once submitted, this cannot be undone. An LGU Officer will review your request."
        style={{ marginBottom: 16 }}
      />
      <div style={{ marginBottom: 16 }}>
        <Text strong>Reason for retirement *</Text>
        <TextArea
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain why you are retiring this business..."
          maxLength={500}
          showCount
          style={{ marginTop: 8 }}
        />
      </div>
      <Checkbox checked={confirmed} onChange={e => setConfirmed(e.target.checked)}>
        I understand this action will initiate the retirement process
      </Checkbox>
    </Modal>
  )
}

function EditRequestDrawer({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [selectedFields, setSelectedFields] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const editableFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'registeredBusinessName', label: 'Registered Business Name' },
    { value: 'tradeName', label: 'Trade Name' },
    { value: 'address', label: 'Business Address' },
    { value: 'contact', label: 'Contact Information' },
    { value: 'phoneNumber', label: 'Phone Number' },
    { value: 'email', label: 'Email' },
    { value: 'businessActivities', label: 'Business Activities' },
    { value: 'capital', label: 'Capital' },
  ]

  const handleSubmit = async () => {
    if (!selectedFields.length) { message.warning('Select at least one field'); return }
    if (!reason.trim()) { message.warning('Please provide a reason'); return }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      const results = await Promise.all(
        selectedFields.map(f =>
          submitEditRequest({
            businessId,
            fieldName: f,
            currentValue: String(business?.[f] || ''),
            requestedValue: fieldValues[f] || '',
            reason,
          })
        )
      )
      message.success(`${results.length} edit request${results.length > 1 ? 's' : ''} submitted`)
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit edit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title="Request Edit"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedFields.length || !reason.trim()}>
          Submit Request
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong>Fields to edit</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select fields"
            options={editableFields}
            value={selectedFields}
            onChange={setSelectedFields}
          />
        </div>
        {selectedFields.map(field => (
          <div key={field}>
            <Text type="secondary" style={{ fontSize: 12 }}>{editableFields.find(f => f.value === field)?.label}: {String(business?.[field] || 'N/A')}</Text>
            <Input
              placeholder={`New ${editableFields.find(f => f.value === field)?.label}`}
              value={fieldValues[field] || ''}
              onChange={e => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
              style={{ marginTop: 4 }}
            />
          </div>
        ))}
        <div>
          <Text strong>Reason for edit *</Text>
          <TextArea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why these changes are needed..."
            style={{ marginTop: 8 }}
          />
        </div>
      </div>
    </Drawer>
  )
}

function AppealDrawer({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [appealType, setAppealType] = useState(null)
  const [subject, setSubject] = useState('')
  const [grounds, setGrounds] = useState('')
  const [fileList, setFileList] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!appealType || !subject.trim() || !grounds.trim()) {
      message.warning('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      const evidence = fileList
        .map(f => f.response?.url || f.url || f.name)
        .filter(Boolean)
      await submitAppeal({ businessId, appealType, subject, grounds, evidence })
      message.success('Appeal submitted')
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit appeal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title="File Appeal"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button type="primary" onClick={handleSubmit} loading={submitting}>
          Submit Appeal
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong>Appeal Type *</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select appeal type"
            value={appealType}
            onChange={setAppealType}
            options={[
              { value: 'rejection', label: 'Rejection Appeal' },
              { value: 'violation', label: 'Violation Appeal' },
            ]}
          />
        </div>
        <div>
          <Text strong>Subject *</Text>
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief subject for your appeal"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Grounds for Appeal *</Text>
          <TextArea
            rows={5}
            value={grounds}
            onChange={e => setGrounds(e.target.value)}
            placeholder="Provide detailed grounds for your appeal..."
            style={{ marginTop: 8 }}
            maxLength={2000}
            showCount
          />
        </div>
        <div>
          <Text strong>Supporting Evidence</Text>
          <Upload
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            maxCount={5}
            style={{ marginTop: 8 }}
          >
            <Button icon={<UploadOutlined />} style={{ marginTop: 8 }}>Upload files (max 5)</Button>
          </Upload>
        </div>
      </div>
    </Drawer>
  )
}

function AppealsTab({ businessId }) {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    getAppeals()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.appeals || []
        setAppeals(all.filter(a => a.businessId === businessId || !businessId))
      })
      .catch(() => setAppeals([]))
      .finally(() => setLoading(false))
  }, [businessId])

  const columns = [
    { title: 'Type', dataIndex: 'appealType', key: 'type', width: 140 },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: v => <Tag color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : v === 'under_review' ? 'processing' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 120 },
    {
      title: 'Resolution', dataIndex: 'resolution', key: 'resolution', width: 200,
      render: (v, r) => r.status === 'rejected' || r.status === 'approved' ? (v || 'N/A') : '—',
    },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.appealId}
      columns={columns}
      dataSource={appeals}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No appeals filed" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
}

function EditRequestsTab({ businessId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    getEditRequests()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.requests || []
        setRequests(all.filter(r => r.businessId === businessId || !businessId))
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [businessId])

  // Group flat field rows into requests by requestId or createdAt batch
  const grouped = useMemo(() => {
    const map = new Map()
    requests.forEach(r => {
      const key = r.requestId || r._id
      if (!map.has(key)) {
        map.set(key, { ...r, fields: [] })
      }
      const group = map.get(key)
      if (r.fieldName) {
        group.fields.push({ fieldName: r.fieldName, currentValue: r.currentValue, requestedValue: r.requestedValue })
      }
    })
    return Array.from(map.values())
  }, [requests])

  const columns = [
    { title: 'Request', key: 'summary', render: (_, r) => r.fields.length > 0 ? `${r.fields.length} field change${r.fields.length > 1 ? 's' : ''}` : r.fieldName || 'Edit request' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 150 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true, render: v => v || '-' },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.requestId}
      columns={columns}
      dataSource={grouped}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No edit requests" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      expandable={{
        expandedRowRender: (record) => record.fields.length > 0 ? (
          <Table
            size="small"
            dataSource={record.fields}
            rowKey={(f, i) => `${record._id}-${i}`}
            pagination={false}
            columns={[
              { title: 'Field', dataIndex: 'fieldName', key: 'field', width: 180 },
              { title: 'Current Value', dataIndex: 'currentValue', key: 'current', ellipsis: true },
              { title: 'Requested Value', dataIndex: 'requestedValue', key: 'requested', ellipsis: true },
            ]}
          />
        ) : null,
        rowExpandable: (r) => r.fields?.length > 0,
      }}
    />
  )
}

function PostRequirementsTab({ businessId }) {
  const { message: msg } = App.useApp()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [complianceModal, setComplianceModal] = useState(null)
  const [complianceFiles, setComplianceFiles] = useState([])
  const [extensionModal, setExtensionModal] = useState(null)
  const [extensionDate, setExtensionDate] = useState(null)
  const [extensionReason, setExtensionReason] = useState('')

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPostRequirements({ businessId })
      .then(data => setRequirements(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setRequirements([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmitCompliance = async () => {
    if (!complianceModal) return
    if (complianceFiles.length === 0) { msg.warning('Please attach at least one document'); return }
    setActionLoading(complianceModal)
    try {
      const docs = complianceFiles.map(f => f.response?.url || f.response?.cid || f.name || f.uid)
      await submitCompliance(complianceModal, { submittedDocuments: docs })
      msg.success('Compliance submitted')
      setComplianceModal(null)
      setComplianceFiles([])
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to submit compliance')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestExtension = async () => {
    if (!extensionModal) return
    if (!extensionDate) { msg.warning('Please select a new due date'); return }
    if (!extensionReason.trim()) { msg.warning('Please provide a reason'); return }
    setActionLoading(extensionModal)
    try {
      await requestExtension(extensionModal, { newDueDate: extensionDate.toISOString(), reason: extensionReason.trim() })
      msg.success('Extension requested')
      setExtensionModal(null)
      setExtensionDate(null)
      setExtensionReason('')
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to request extension')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { title: 'Requirement', dataIndex: 'requirementType', key: 'type', render: (v, r) => v || r.description || 'N/A' },
    {
      title: 'Due Date', dataIndex: 'dueDate', key: 'due', width: 130,
      render: v => {
        const isOverdue = v && dayjs(v).isBefore(dayjs())
        return <Text type={isOverdue ? 'danger' : undefined}>{formatDate(v)} {isOverdue && '(Overdue)'}</Text>
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: v => <Tag color={v === 'verified' ? 'success' : v === 'overdue' ? 'error' : v === 'submitted' ? 'processing' : 'default'}>{v || 'N/A'}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, r) => {
        const id = r._id || r.requirementId
        if (r.status === 'verified') return null
        return (
          <Space size="small">
            {r.status === 'pending' || r.status === 'overdue' || r.status === 'non_compliant' ? (
              <Button size="small" type="primary" loading={actionLoading === id} onClick={() => { setComplianceModal(id); setComplianceFiles([]) }}>Submit</Button>
            ) : null}
            {r.status !== 'verified' && (
              <Button size="small" loading={actionLoading === id} onClick={() => { setExtensionModal(id); setExtensionDate(null); setExtensionReason('') }}>Extend</Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Table
        size="small"
        rowKey={r => r._id || r.requirementId}
        columns={columns}
        dataSource={requirements}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No post-requirements" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
      <Modal title="Submit Compliance Documents" open={!!complianceModal} onCancel={() => setComplianceModal(null)} onOk={handleSubmitCompliance} confirmLoading={!!actionLoading} okText="Submit">
        <Upload.Dragger
          multiple
          fileList={complianceFiles}
          onChange={({ fileList }) => setComplianceFiles(fileList)}
          beforeUpload={() => false}
        >
          <p style={{ padding: '8px 0' }}><UploadOutlined style={{ fontSize: 24 }} /></p>
          <p>Click or drag files to attach compliance documents</p>
        </Upload.Dragger>
      </Modal>
      <Modal title="Request Extension" open={!!extensionModal} onCancel={() => setExtensionModal(null)} onOk={handleRequestExtension} confirmLoading={!!actionLoading} okText="Request">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>New Due Date</Text>
            <Input type="date" value={extensionDate ? dayjs(extensionDate).format('YYYY-MM-DD') : ''} onChange={e => setExtensionDate(e.target.value ? dayjs(e.target.value) : null)} style={{ width: '100%' }} />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Reason for Extension</Text>
            <Input.TextArea rows={3} value={extensionReason} onChange={e => setExtensionReason(e.target.value)} placeholder="Explain why you need more time..." />
          </div>
        </Space>
      </Modal>
    </>
  )
}

function usePermitProgress(business, businessId, permitDownloaded = false) {
  const [payments, setPayments] = useState([])
  const [postReqs, setPostReqs] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [postReqsLoading, setPostReqsLoading] = useState(true)

  const refetchPayments = useCallback(() => {
    if (!businessId) return
    setPaymentsLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false))
  }, [businessId])

  useEffect(() => {
    refetchPayments()
  }, [refetchPayments])

  useEffect(() => {
    if (!businessId) return
    setPostReqsLoading(true)
    getPostRequirements({ businessId })
      .then(data => setPostReqs(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setPostReqs([]))
      .finally(() => setPostReqsLoading(false))
  }, [businessId])

  const pendingPayments = payments.filter(p => p.status === 'pending' && !p.paidAt)
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const allPaid = payments.length > 0 && pendingPayments.length === 0
  const hasPayments = payments.length > 0

  const hasActivePermit = !!(business?.permitNumber && business?.permitStatus === 'active')

  const pendingPostReqs = postReqs.filter(r => r.status === 'pending' || r.status === 'overdue' || r.status === 'non_compliant')
  const allPostReqsVerified = postReqs.length > 0 && pendingPostReqs.length === 0
  const hasPostReqs = postReqs.length > 0

  // Compute current step (0-indexed) - New flow: Approved -> Payment -> Download -> Inspection -> Post-Requirements
  let currentStep = 0 // Start with Approved Application
  let stepStatuses = ['finish', 'wait', 'wait', 'wait', 'wait']

  // Step 1: Payment Status
  if (hasPayments && allPaid) {
    stepStatuses[1] = 'finish'
    currentStep = 2
  } else if (hasPayments && pendingPayments.length > 0) {
    stepStatuses[1] = 'process'
    currentStep = 1
  } else if (!hasPayments) {
    stepStatuses[1] = 'process'
    currentStep = 1
  }

  // Step 2: Download Permit (available after payment)
  if (permitDownloaded) {
    stepStatuses[2] = 'finish'
    if (currentStep < 3) currentStep = 3
  } else if (stepStatuses[1] === 'finish') {
    stepStatuses[2] = 'process'
    if (currentStep < 2) currentStep = 2
  }

  // Step 3: Inspection Status (awaiting after permit download)
  if (permitDownloaded) {
    stepStatuses[3] = 'process' // Awaiting inspection after permit download
    if (currentStep < 3) currentStep = 3
  }

  // Step 4: Post-Requirements
  if (hasPostReqs && allPostReqsVerified) {
    stepStatuses[4] = 'finish'
    if (currentStep < 5) currentStep = 5
  } else if (hasPostReqs && pendingPostReqs.length > 0) {
    stepStatuses[4] = 'process'
    if (currentStep < 4) currentStep = 4
  } else if (!hasPostReqs && permitDownloaded) {
    stepStatuses[4] = 'wait'
  }

  // Determine the primary next action
  let nextAction = null
  if (pendingPayments.length > 0) {
    nextAction = { type: 'payment', total: pendingTotal, count: pendingPayments.length }
  } else if (hasPayments && allPaid && !permitDownloaded) {
    nextAction = { type: 'permit_pending' }
  } else if (permitDownloaded) {
    nextAction = { type: 'inspection_pending' }
  } else if (hasPostReqs && pendingPostReqs.length > 0) {
    const overdue = pendingPostReqs.filter(r => r.status === 'overdue' || (r.dueDate && dayjs(r.dueDate).isBefore(dayjs())))
    nextAction = { type: 'post_requirements', pending: pendingPostReqs.length, overdue: overdue.length }
  } else if (!hasPayments) {
    nextAction = { type: 'awaiting_assessment' }
  }

  return {
    payments, postReqs, pendingPayments, pendingTotal, allPaid, hasPayments,
    hasActivePermit, pendingPostReqs, allPostReqsVerified, hasPostReqs,
    currentStep, stepStatuses, nextAction, refetchPayments,
    loading: paymentsLoading || postReqsLoading,
  }
}

function ProgressStepper({ stepStatuses, currentStep, token, business }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const items = [
    { 
      title: 'Approved Application', 
      description: business?.reviewedAt ? `Approved on ${formatDate(business.reviewedAt)}` : 'Application approved',
      icon: <CheckCircleOutlined /> 
    },
    { 
      title: 'Payment Status', 
      description: stepStatuses[1] === 'finish' ? `Paid on ${formatDate(business?.paidAt)}` : stepStatuses[1] === 'process' ? 'Payment pending' : 'Payment pending',
      icon: <DollarOutlined /> 
    },
    { 
      title: 'Download Permit', 
      description: stepStatuses[2] === 'finish' ? 'Permit downloaded' : stepStatuses[2] === 'process' ? 'Ready for download' : 'Awaiting payment completion',
      icon: <DownloadOutlined /> 
    },
    { 
      title: 'Inspection Status', 
      description: stepStatuses[3] === 'finish' ? 'Inspection completed' : stepStatuses[3] === 'process' ? 'Inspection pending' : 'No inspection scheduled',
      icon: <SearchOutlined /> 
    },
    { 
      title: 'Post-Requirements', 
      description: stepStatuses[4] === 'finish' ? 'All requirements completed' : stepStatuses[4] === 'process' ? 'With deadline' : 'No requirements yet',
      icon: <FileDoneOutlined /> 
    },
  ]

  return (
    <Steps
      direction="vertical"
      current={currentStep}
      size="small"
      items={items.map((item, i) => ({
        ...item,
        status: stepStatuses[i],
      }))}
      style={{ marginBottom: 0, padding: 16 }}
    />
  )
}

function ActiveActionCard({ nextAction, token }) {
  if (!nextAction) return null

  const configs = {
    payment: {
      type: 'warning',
      icon: <DollarOutlined style={{ fontSize: 20 }} />,
      title: `You have ${nextAction.count} pending payment${nextAction.count > 1 ? 's' : ''} totalling ${formatCurrency(nextAction.total)}`,
      description: 'Settle all outstanding fees to proceed with your permit issuance.',
    },
    permit_pending: {
      type: 'success',
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Payment complete — permit ready for download',
      description: 'Your permit is now available. Go to the Permit section to download it.',
    },
    inspection_pending: {
      type: 'info',
      icon: <ClockCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Permit downloaded — awaiting inspection',
      description: 'An inspector will be assigned to verify your business. You will be notified when scheduled.',
    },
    post_requirements: {
      type: nextAction.overdue > 0 ? 'error' : 'warning',
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      title: `${nextAction.pending} post-requirement${nextAction.pending > 1 ? 's' : ''} to fulfill${nextAction.overdue > 0 ? ` (${nextAction.overdue} overdue)` : ''}`,
      description: 'Submit compliance documents before the due date to avoid permit suspension.',
    },
    good_standing: {
      type: 'success',
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Your business is in good standing',
      description: 'All requirements are fulfilled. Your permit is active.',
    },
    awaiting_assessment: {
      type: 'info',
      icon: <InfoCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Awaiting fee assessment',
      description: 'The CBPLO is preparing your Tax Order of Payment. You will be notified when fees are ready.',
    },
  }

  const config = configs[nextAction.type]
  if (!config) return null

  return (
    <Alert
      type={config.type}
      showIcon
      icon={config.icon}
      message={config.title}
      description={config.description}
      style={{ borderRadius: token.borderRadiusLG }}
    />
  )
}

export default function ApprovedBusinessView({ business, onRefresh }) {
  const { token } = theme.useToken()
  const [retireOpen, setRetireOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)
  const [permitDownloaded, setPermitDownloaded] = useState(false)
  const [pendingEditRequests, setPendingEditRequests] = useState([])
  const [recentEditResults, setRecentEditResults] = useState([])
  const [dismissedEditResults, setDismissedEditResults] = useState([])

  const businessId = business?.businessId || business?._id

  // Fetch edit requests (pending and recently processed)
  const fetchEditRequests = useCallback(() => {
    if (!businessId) return
    getEditRequests()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.requests || []
        const forBusiness = all.filter(r => r.businessId === businessId)
        
        const pending = forBusiness.filter(r => 
          r.status === 'pending' || r.status === 'submitted' || !r.status
        )
        setPendingEditRequests(pending)
        
        // Get recently processed (approved/rejected) within last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentlyProcessed = forBusiness.filter(r => 
          (r.status === 'approved' || r.status === 'rejected') &&
          r.updatedAt && new Date(r.updatedAt) > sevenDaysAgo
        )
        setRecentEditResults(recentlyProcessed)
      })
      .catch(() => {
        setPendingEditRequests([])
        setRecentEditResults([])
      })
  }, [businessId])

  useEffect(() => {
    fetchEditRequests()
  }, [fetchEditRequests])

  const dismissEditResult = (requestId) => {
    setDismissedEditResults(prev => [...prev, requestId])
  }

  // Filter out dismissed results
  const visibleEditResults = recentEditResults.filter(r => !dismissedEditResults.includes(r._id))

  const {
    pendingTotal, pendingPayments, allPaid, hasPayments,
    hasActivePermit, pendingPostReqs, allPostReqsVerified, hasPostReqs,
    currentStep, stepStatuses, nextAction, loading, refetchPayments,
  } = usePermitProgress(business, businessId, permitDownloaded)

  const hasPendingEditRequest = pendingEditRequests.length > 0

  const retirementStatus = business?.retirementStatus || (business?.businessStatus === 'closed' ? 'confirmed' : '')
  const retirementPending = retirementStatus === 'requested'
  const retirementActive = ['requested', 'inspector_verified', 'pending_tax_payment'].includes(retirementStatus)
  const retirementReason = business?.retirementApplicationLetter || business?.retirementReason
  const retirementAlertConfig = {
    requested: {
      type: 'warning',
      title: 'Retirement Requested',
      description: buildRetirementRequestedDescription(business?.retirementRequestedAt, retirementReason),
    },
    inspector_verified: { type: 'info', title: 'Retirement Verified by Inspector', description: 'Your retirement request has been inspector-verified and is awaiting LGU officer confirmation.' },
    pending_tax_payment: { type: 'warning', title: 'Cessation Tax Assessed', description: 'A cessation tax has been assessed for your business. Please complete the payment in the Payments & Fees section below to proceed with closure.' },
    confirmed: { type: 'success', title: 'Retirement Confirmed', description: `Confirmed ${formatDate(business?.retirementConfirmedAt)}. Business status is now closed.` },
    rejected: { type: 'error', title: 'Retirement Request Rejected', description: business?.retirementRejectionReason || 'Please review remarks and contact LGU support if needed.' },
  }
  const retirementAlert = retirementAlertConfig[retirementStatus] || null

  const collapseItems = [
    {
      key: 'payments',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Payments & Fees
          {pendingPayments.length > 0 && <Tag color="warning" style={{ marginLeft: 8 }}>{pendingPayments.length} pending</Tag>}
        </span>
      ),
      children: <PaymentsTab businessId={businessId} onPaymentComplete={refetchPayments} />,
    },
    {
      key: 'permit',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Mayor's Permit
          {hasActivePermit && <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>}
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access permit information</div>
          </div>
        : <PermitsTab businessId={businessId} businessName={business?.businessName} onPermitDownloaded={() => setPermitDownloaded(true)} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'compliance',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <SolutionOutlined style={{ marginRight: 8 }} />
          Inspections & Compliance
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access compliance information</div>
          </div>
        : <ComplianceTab businessId={businessId} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'post-requirements',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <FileDoneOutlined style={{ marginRight: 8 }} />
          Post-Requirements
          {pendingPostReqs.length > 0 && <Tag color="warning" style={{ marginLeft: 8 }}>{pendingPostReqs.length} pending</Tag>}
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access post-requirements</div>
          </div>
        : <PostRequirementsTab businessId={businessId} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'application-form',
      label: <span><FileTextOutlined style={{ marginRight: 8 }} />Submitted Application Form</span>,
      children: <ApplicationFormTab business={business} />,
    },
  ]

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Left Column - Actions, Alerts, and Progress */}
        <div style={{ flex: '0 0 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Actions Card */}
          <Card
            size="small"
            title="Actions"
            style={{ borderRadius: token.borderRadiusLG }}
          >
            {/* Alerts inside Actions card */}
            {retirementAlert && (
              <Alert
                type={retirementAlert.type}
                showIcon
                message={retirementAlert.title}
                description={retirementAlert.description}
                style={{ marginBottom: 16 }}
              />
            )}

            {hasPendingEditRequest && (
              <Alert
                type="info"
                showIcon
                icon={<EditOutlined />}
                message="Edit Request Pending"
                description={`You have ${pendingEditRequests.length} edit request${pendingEditRequests.length > 1 ? 's' : ''} awaiting review by the BPLO. You will be notified once processed.`}
                style={{ marginBottom: 16 }}
              />
            )}

            {visibleEditResults.map(result => (
              <Alert
                key={result._id}
                type={result.status === 'approved' ? 'success' : 'error'}
                showIcon
                closable
                onClose={() => dismissEditResult(result._id)}
                message={result.status === 'approved' ? 'Edit Request Approved' : 'Edit Request Rejected'}
                description={
                  <>
                    Your request to change <strong>{result.fieldName}</strong> to "{result.requestedValue}" was {result.status}.
                    {result.reviewNotes && <div style={{ marginTop: 4 }}><em>Note: {result.reviewNotes}</em></div>}
                  </>
                }
                style={{ marginBottom: 16 }}
              />
            ))}
            
            {!loading && <ActiveActionCard nextAction={nextAction} token={token} style={{ marginBottom: 16 }} />}
            
            <Space wrap size="small" style={{ paddingTop: 12 }}>
              {!retirementActive && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditOpen(true)}
                  disabled={hasPendingEditRequest}
                >
                  {hasPendingEditRequest ? 'Edit Request Pending' : 'Request Edits'}
                </Button>
              )}
              
              {!retirementPending && (
                <Button
                  icon={<StopOutlined />}
                  danger
                  onClick={() => setRetireOpen(true)}
                >
                  Retire Business
                </Button>
              )}
            </Space>
          </Card>

          {/* Permit Application Progress Card */}
          <Card title="Permit Application Progress" size="small" >
            <ProgressStepper stepStatuses={stepStatuses} currentStep={currentStep} token={token} business={business} />
          </Card>

          {/* Business Details Card */}
          <Card title="Business Details" size="small" style={{ marginBottom: 24 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Business Name">
                {business?.formData?.businessName || 
                 business?.businessName || 
                 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{business?.applicationReferenceNumber || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Registration Date">{formatDate(business?.submittedAt || business?.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Approval Date">{formatDate(business?.reviewedAt || business?.approvedAt)}</Descriptions.Item>
              <Descriptions.Item label="Permit Status">
                {hasActivePermit
                  ? <Tag color="success">Active — {business?.permitNumber}</Tag>
                  : <Tag color="default">Not yet issued</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {business?.formData?.businessEmail || 
                 business?.emailAddress || 
                 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {business?.formData?.businessPhone || 
                 business?.mobileNumber || 
                 business?.contactNumber || 
                 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Right Column - Details Only */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Collapsible Detail Sections */}
          <Collapse
            defaultActiveKey={['payments']}
            items={collapseItems}
            accordion
            style={{ borderRadius: token.borderRadiusLG }}
          />
        </div>
      </div>

      <RetirementModal
        open={retireOpen}
        onClose={() => setRetireOpen(false)}
        business={business}
        onSuccess={onRefresh}
      />
      <EditRequestDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        business={business}
        onSuccess={() => { fetchEditRequests(); onRefresh?.(); }}
      />
      <AppealDrawer
        open={appealOpen}
        onClose={() => setAppealOpen(false)}
        business={business}
        onSuccess={onRefresh}
      />
    </div>
  )
}
