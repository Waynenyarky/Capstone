/**
 * OfficerApprovedView — shown when an application has a post-decision status
 * (approved, rejected, needs_revision). Renders:
 *   1. Decision card (with revoke countdown) + Appeal card
 *   2. Collapsible sections mirroring the business-owner ApprovedBusinessView
 *      (Payments, Permit, Compliance, Post-Requirements, Application Form)
 *      plus an Owner Info section.
 *
 * The business-owner's ApprovedBusinessView internal tab components are not
 * exported individually, so we replicate the collapsible structure here while
 * reusing the same service calls and lightweight sub-components.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Typography, Card, Tag, Space, theme, Table, Empty, App, Spin,
  Descriptions, Alert, Collapse, Statistic, Row, Col, Segmented, Drawer,
  Select, Button,
} from 'antd'
import {
  DollarOutlined, FileTextOutlined, SafetyCertificateOutlined,
  SolutionOutlined, FileDoneOutlined, UserOutlined, EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { get } from '@/lib/http.js'
import { getPayments } from '@/features/business-owner/services/paymentsService'
import { getPostRequirements } from '@/features/business-owner/services/postRequirementsService'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import DynamicFormRenderer from '@/features/business-owner/components/DynamicFormRenderer'
import { Form } from '@/shared/components/AppForm'
import PermitDownloadCard from '@/features/business-owner/components/permits/PermitDownloadCard'
import OwnerInfoReadOnlyView from './OwnerInfoReadOnlyView'

const { Text, Title } = Typography

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('MMM D, YYYY')
}

function formatCurrency(value) {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
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
            if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
              normalized[key] = parsed
            }
          } catch { /* keep original */ }
        }
      }
      if (item.type === 'repeatable_group' && Array.isArray(normalized[key]) && item.groupFields?.length) {
        const groupDateKeys = (item.groupFields || [])
          .filter((f) => f.type === 'date')
          .map((f) => f.key || f.label)
          .filter(Boolean)
        if (!groupDateKeys.length) return
        normalized[key] = normalized[key].map((row) => {
          if (!row || typeof row !== 'object') return row
          const next = { ...row }
          groupDateKeys.forEach((gk) => {
            const v = next[gk]
            if (v != null && v !== '' && !dayjs.isDayjs(v)) {
              try {
                const parsed = dayjs(v)
                if (parsed?.isValid?.()) next[gk] = parsed
              } catch { /* keep original */ }
            }
          })
          return next
        })
      }
    })
  })
  return normalized
}

// ── Application Form Tab ─────────────────────────────────────────────────────
function ApplicationFormTab({ business }) {
  const { token } = theme.useToken()
  const form = Form.useForm()[0]
  const [formDefinition, setFormDefinition] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const appId = business?.applicationId || business?._id || business?.businessId
    if (!appId) return
    setLoading(true)
    const formDefId = business?.formDefinitionId
    const formType = business?.formType || 'permit'
    ;(async () => {
      try {
        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, business?.businessType || null, null)
        }
        if (res?.success && res?.definition) setFormDefinition(res.definition)
      } catch (e) {
        console.error('Failed to load form definition:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [business?.applicationId, business?._id, business?.businessId, business?.formDefinitionId, business?.formType, business?.businessType])

  const formData = business?.formData && typeof business.formData === 'object' ? business.formData : {}

  const documents = useMemo(() => {
    const lguDocs = business?.lguDocuments || business?.documentCids || {}
    const resolved = { ...lguDocs }
    Object.keys(lguDocs).forEach((k) => {
      if (k.endsWith('IpfsCid')) {
        const baseKey = k.replace(/IpfsCid$/, '')
        if (!resolved[baseKey] && lguDocs[k]) resolved[baseKey] = lguDocs[k]
      }
    })
    if (formData && typeof formData === 'object') {
      Object.keys(formData).forEach((k) => {
        const val = formData[k]
        if (typeof val === 'string' && (val.startsWith('Qm') || val.startsWith('bafy'))) {
          if (!resolved[k]) resolved[k] = val
        }
      })
    }
    return resolved
  }, [business?.lguDocuments, business?.documentCids, formData])

  const normalizedFormData = useMemo(
    () => normalizeFormDataForRenderer(formData, formDefinition),
    [formData, formDefinition]
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /><div style={{ marginTop: 16 }}><Text type="secondary">Loading application form...</Text></div></div>
  if (!formDefinition) return <div style={{ textAlign: 'center', padding: 48 }}><Empty image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />} description={<Text type="secondary">Application form not available</Text>} /></div>

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

// ── Payments Tab (read-only for officer) ─────────────────────────────────────
function PaymentsTab({ businessId }) {
  const { message } = App.useApp()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const displayPayments = useMemo(() => {
    const nonPending = []
    const pendingBySignature = new Map()
    for (const p of payments) {
      const isPending = p?.status === 'pending' && !p?.paidAt
      if (!isPending) { nonPending.push(p); continue }
      const sig = [p?.businessId || '', p?.paymentType || '', p?.relatedEntityType || '', p?.relatedEntityId || '', p?.description || '', Number(p?.amount || 0)].join('|')
      if (!pendingBySignature.has(sig)) pendingBySignature.set(sig, p)
    }
    return [...nonPending, ...Array.from(pendingBySignature.values())]
  }, [payments])

  const paidPayments = displayPayments.filter(p => p.status === 'paid')
  const pendingPayments = displayPayments.filter(p => p.status === 'pending' && !p.paidAt)
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

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
            </Text>
          )}
        </div>
      ),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'paid' ? 'success' : v === 'pending' ? 'processing' : v === 'cancelled' ? 'default' : 'warning'}>{v || 'N/A'}</Tag> },
  ]

  return (
    <>
      {pendingTotal > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`${pendingPayments.length} pending payment(s) totalling ${formatCurrency(pendingTotal)}`} />
      )}
      <Table
        size="small"
        rowKey={r => r._id || r.paymentId}
        columns={columns}
        dataSource={displayPayments}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No payment records" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
      {totalPaid > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">Total paid: {formatCurrency(totalPaid)}</Text>
        </div>
      )}
    </>
  )
}

// ── Compliance Tab (uses officer-scoped API endpoints) ──────────────────────
function ComplianceTab({ businessId }) {
  const { token } = theme.useToken()
  const [inspections, setInspections] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inspectionFilter, setInspectionFilter] = useState('all')
  const [violationStatusFilter, setViolationStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    const inspQs = new URLSearchParams({ businessId, limit: '200' })
    const vioQs = new URLSearchParams({ businessId, limit: '200' })
    Promise.all([
      get(`/api/lgu-officer/inspections?${inspQs}`, { skipAutoLogout: true }).catch(() => ({ data: [] })),
      get(`/api/lgu-officer/violations?${vioQs}`, { skipAutoLogout: true }).catch(() => ({ violations: [] })),
    ]).then(([insRes, vioRes]) => {
      setInspections(insRes?.data || insRes?.inspections || [])
      setViolations(vioRes?.violations || vioRes?.data || [])
    }).finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleInspectionDetail = async (record) => {
    const id = record._id || record.inspectionId
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await get(`/api/lgu-officer/inspections/${id}`, { skipAutoLogout: true })
      setDetailData(res?.inspection || res?.data || res)
    } catch { setDetailData(record) }
    finally { setDetailLoading(false) }
  }

  // Compute summary from violations
  const summary = useMemo(() => {
    if (!violations.length) return null
    return {
      open: violations.filter(v => v.status === 'open').length,
      resolved: violations.filter(v => v.status === 'resolved').length,
      appealed: violations.filter(v => v.status === 'appealed').length,
    }
  }, [violations])

  const now = dayjs()
  const filteredInspections = inspections.filter(i => {
    if (inspectionFilter === 'upcoming') return dayjs(i.scheduledDate).isAfter(now)
    if (inspectionFilter === 'past') return dayjs(i.scheduledDate).isBefore(now)
    return true
  })
  const filteredViolations = violations.filter(v => violationStatusFilter === 'all' ? true : v.status === violationStatusFilter)

  const inspectionCols = [
    { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Type', dataIndex: 'inspectionType', key: 'type', width: 120 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: v => <Tag color={v === 'completed' ? 'success' : v === 'in_progress' ? 'processing' : v === 'pending_assignment' ? 'warning' : 'default'}>{v === 'pending_assignment' ? 'Needs Assignment' : v || 'Pending'}</Tag>,
    },
    {
      title: 'Result', dataIndex: 'overallResult', key: 'result', width: 100,
      render: v => v ? <Tag color={v === 'passed' ? 'success' : v === 'failed' ? 'error' : 'warning'}>{v}</Tag> : '—',
    },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v, r) => v || r.inspector?.name || 'N/A' },
    { title: '', key: 'action', width: 60, render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleInspectionDetail(r)} /> },
  ]

  const violationCols = [
    { title: 'Type', dataIndex: 'violationType', key: 'type' },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 100, render: v => <Tag color={v === 'critical' ? 'error' : v === 'major' ? 'warning' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Deadline', dataIndex: 'complianceDeadline', key: 'deadline', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'resolved' ? 'success' : v === 'open' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>

  // Render detail content for the drawer
  const renderDetailDrawer = () => {
    if (detailLoading) return <Spin />
    if (!detailData) return <Empty />

    const d = detailData
    const ack = d.ownerAcknowledgment || {}
    const hasAck = Boolean(ack.acknowledged)
    const checklist = d.checklist || []
    const detailViolations = d.violations || []
    const evidence = d.evidence || []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Date">{formatDate(d.scheduledDate)}</Descriptions.Item>
          <Descriptions.Item label="Type">{d.inspectionType || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={d.status === 'completed' ? 'success' : d.status === 'in_progress' ? 'processing' : 'default'}>{d.status || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Result">
            {d.overallResult ? <Tag color={d.overallResult === 'passed' ? 'success' : d.overallResult === 'failed' ? 'error' : 'warning'}>{d.overallResult}</Tag> : 'Pending'}
          </Descriptions.Item>
          <Descriptions.Item label="Inspector">{d.inspectorName || (d.inspectorId && typeof d.inspectorId === 'object' ? `${d.inspectorId.firstName || ''} ${d.inspectorId.lastName || ''}`.trim() : null) || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Assigned By">{d.assignedByName || 'System'}</Descriptions.Item>
          {d.completedAt && <Descriptions.Item label="Completed">{dayjs(d.completedAt).format('MMM D, YYYY h:mm A')}</Descriptions.Item>}
          <Descriptions.Item label="Owner Acknowledged">
            {hasAck ? <Tag color="success">Yes — {formatDate(ack.timestamp)}</Tag> : <Tag color="warning">Not yet</Tag>}
          </Descriptions.Item>
        </Descriptions>

        {d.notes && (
          <Card size="small" title="Inspector Notes">
            <Text>{d.notes}</Text>
          </Card>
        )}

        {checklist.length > 0 && (
          <Card size="small" title="Checklist Results">
            {checklist.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: idx < checklist.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none' }}>
                <Tag color={item.result === 'pass' ? 'success' : item.result === 'fail' ? 'error' : 'default'} style={{ minWidth: 44, textAlign: 'center' }}>{item.result}</Tag>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13 }}>{item.label}</Text>
                  {item.remarks && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{item.remarks}</Text>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {detailViolations.length > 0 && (
          <Card size="small" title={`Violations (${detailViolations.length})`}>
            {detailViolations.map((v, idx) => (
              <div key={idx} style={{ padding: '6px 0', borderBottom: idx < detailViolations.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Tag color={v.severity === 'critical' ? 'error' : v.severity === 'major' ? 'warning' : 'default'}>{v.severity}</Tag>
                  <Text strong>{v.violationType || `Violation ${idx + 1}`}</Text>
                  <Tag color={v.status === 'resolved' ? 'success' : v.status === 'open' ? 'error' : 'default'}>{v.status}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Text>
                {v.complianceDeadline && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    Deadline: {formatDate(v.complianceDeadline)}
                    {v.status === 'open' && dayjs(v.complianceDeadline).isBefore(dayjs()) && <Tag color="error" style={{ marginLeft: 4 }}>Overdue</Tag>}
                  </Text>
                )}
              </div>
            ))}
          </Card>
        )}

        {evidence.length > 0 && (
          <Card size="small" title={`Evidence (${evidence.length})`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {evidence.map((ev, idx) => {
                const src = ev.url || ev.filePath || ev.cid || ''
                return (
                  <div key={idx} style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout, borderRadius: 4, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                    {/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(src) || ev.type?.startsWith('image')
                      ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Text type="secondary" style={{ fontSize: 9, textAlign: 'center', padding: 2 }}>{ev.name || ev.fileName || `File ${idx + 1}`}</Text>}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {d.gpsCheck && (
          <Card size="small" title="GPS Verification">
            <Tag color={d.gpsCheck.matched ? 'success' : 'warning'}>
              {d.gpsCheck.matched ? 'Location matched' : 'Location mismatch'}
            </Tag>
            {d.gpsCheck.distanceMeters != null && <Text type="secondary" style={{ marginLeft: 8 }}>{Math.round(d.gpsCheck.distanceMeters)}m from address</Text>}
          </Card>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {summary && (
        <Row gutter={16}>
          <Col xs={8}><Statistic title="Open Violations" value={summary.open} valueStyle={{ color: '#cf1322' }} /></Col>
          <Col xs={8}><Statistic title="Resolved" value={summary.resolved} valueStyle={{ color: '#3f8600' }} /></Col>
          <Col xs={8}><Statistic title="Appealed" value={summary.appealed} valueStyle={{ color: '#faad14' }} /></Col>
        </Row>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Inspections ({inspections.length})</Title>
          <Segmented options={[{ label: 'All', value: 'all' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Past', value: 'past' }]} value={inspectionFilter} onChange={setInspectionFilter} size="small" />
        </div>
        <Table size="small" rowKey={r => r._id || r.inspectionId} columns={inspectionCols} dataSource={filteredInspections} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No inspections recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Violations ({violations.length})</Title>
          <Select size="small" value={violationStatusFilter} onChange={setViolationStatusFilter} style={{ width: 130 }} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'appealed', label: 'Appealed' }]} />
        </div>
        <Table size="small" rowKey={r => r._id || r.violationId} columns={violationCols} dataSource={filteredViolations} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No violations recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
      <Drawer title="Inspection Detail" open={detailOpen} onClose={() => setDetailOpen(false)} width={520}>
        {renderDetailDrawer()}
      </Drawer>
    </div>
  )
}

// ── Post-Requirements Tab ────────────────────────────────────────────────────
function PostRequirementsTab({ businessId }) {
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPostRequirements({ businessId })
      .then(data => setRequirements(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setRequirements([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

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
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.requirementId}
      columns={columns}
      dataSource={requirements}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No post-requirements" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
}

// ── Permit Progress Hook ─────────────────────────────────────────────────────
function usePermitProgress(business, businessId) {
  const [payments, setPayments] = useState([])
  const [postReqs, setPostReqs] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [postReqsLoading, setPostReqsLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setPaymentsLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false))
  }, [businessId])

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

  return {
    pendingPayments, pendingTotal, allPaid, hasPayments,
    hasActivePermit, pendingPostReqs,
    loading: paymentsLoading || postReqsLoading,
  }
}

// ── Main Export ──────────────────────────────────────────────────────────────
export default function OfficerApprovedView({
  application,
  ownerIdentity,
  businessReg,
  ownerName,
  onRevoke,
  onAppealResolved,
  paymentStatusAlert,
  revokeSection,
  appealCard,
  rejectedFieldsCard,
  historyCollapse,
}) {
  const { token } = theme.useToken()

  const businessId = application?.businessId || application?.applicationId
  const businessName = application?.businessName || businessReg?.registeredBusinessName || 'Unnamed Business'

  const {
    pendingPayments, pendingTotal, allPaid, hasPayments,
    hasActivePermit, pendingPostReqs, loading: progressLoading,
  } = usePermitProgress(application, businessId)

  const collapseItems = [
    {
      key: 'owner',
      label: <span><UserOutlined style={{ marginRight: 8 }} />Owner Information</span>,
      children: (
        <OwnerInfoReadOnlyView
          application={application}
          ownerIdentity={ownerIdentity}
          businessReg={businessReg}
          ownerName={ownerName}
        />
      ),
    },
    {
      key: 'payments',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Payments & Fees
          {pendingPayments.length > 0 && <Tag color="warning" style={{ marginLeft: 8 }}>{pendingPayments.length} pending</Tag>}
          {allPaid && hasPayments && <Tag color="success" style={{ marginLeft: 8 }}>All paid</Tag>}
        </span>
      ),
      children: <PaymentsTab businessId={businessId} />,
    },
    {
      key: 'permit',
      label: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Mayor's Permit
          {hasActivePermit && <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>}
        </span>
      ),
      children: <PermitDownloadCard businessId={businessId} businessName={businessName} />,
    },
    {
      key: 'compliance',
      label: <span><SolutionOutlined style={{ marginRight: 8 }} />Inspections & Compliance</span>,
      children: <ComplianceTab businessId={businessId} />,
    },
    {
      key: 'post-requirements',
      label: (
        <span>
          <FileDoneOutlined style={{ marginRight: 8 }} />
          Post-Requirements
          {pendingPostReqs.length > 0 && <Tag color="warning" style={{ marginLeft: 8 }}>{pendingPostReqs.length} pending</Tag>}
        </span>
      ),
      children: <PostRequirementsTab businessId={businessId} />,
    },
    {
      key: 'application-form',
      label: <span><FileTextOutlined style={{ marginRight: 8 }} />Submitted Application Form</span>,
      children: <ApplicationFormTab business={application} />,
    },
  ]

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      {/* Payment generation status alert (passed from parent) */}
      {paymentStatusAlert}

      {/* Decision card with revoke */}
      {revokeSection && (
        <Card title="Decision" size="small" style={{ marginBottom: 16 }}>
          {revokeSection}
        </Card>
      )}

      {/* Appeal card (for rejected applications) */}
      {appealCard}

      {/* Rejected fields card */}
      {rejectedFieldsCard}

      {/* Business Details Summary */}
      <Card title="Business Details" size="small" style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Business Name">
            {application?.formData?.businessName || application?.businessName || businessReg?.registeredBusinessName || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Reference">{application?.applicationReferenceNumber || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={
              application?.status === 'approved' ? 'success' :
              application?.status === 'rejected' ? 'error' :
              application?.status === 'needs_revision' ? 'warning' : 'default'
            }>
              {application?.status === 'approved' ? 'Approved' :
               application?.status === 'rejected' ? 'Rejected' :
               application?.status === 'needs_revision' ? 'Changes Requested' :
               application?.status || 'Unknown'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted">{formatDate(application?.submittedAt)}</Descriptions.Item>
          <Descriptions.Item label="Last Reviewed">{application?.reviewedAt ? formatDate(application.reviewedAt) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Applicant">{ownerName || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Collapsible sections */}
      <Collapse
        defaultActiveKey={application?.status === 'approved' ? ['payments'] : ['owner']}
        items={collapseItems}
        style={{ borderRadius: token.borderRadiusLG }}
      />

      {/* Application History */}
      {historyCollapse && (
        <div style={{ marginTop: 16 }}>
          {historyCollapse}
        </div>
      )}
    </div>
  )
}
