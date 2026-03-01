import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Card, Tag, Space, Button, theme, Tabs, Table, Empty, Modal,
  Input, Drawer, Select, Descriptions, Alert, Checkbox, App, Spin, Upload,
  Statistic, Row, Col, Segmented, Popconfirm,
} from 'antd'
import {
  SafetyCertificateOutlined, DollarOutlined, CheckCircleOutlined,
  WarningOutlined, ClockCircleOutlined, DownloadOutlined, ReloadOutlined,
  ExclamationCircleOutlined, FileTextOutlined, StopOutlined, EditOutlined,
  AppstoreOutlined, UploadOutlined, AuditOutlined, FileDoneOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPayments, processPayment, cancelPayment } from '../services/paymentsService'
import { getInspections, getInspection as getInspectionDetail } from '../services/inspectionsService'
import { getViolations, acknowledgeViolation, getViolationSummary } from '../services/violationsService'
import { getGeneralPermits, getOccupationalPermits } from '../services/permitsService'
import { submitRetirement } from '../services/retirementService'
import { submitEditRequest, getEditRequests } from '../services/editRequestsService'
import { submitAppeal, getAppeals } from '../services/appealsService'
import { getPostRequirements, submitCompliance, requestExtension } from '../services/postRequirementsService'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('MMM D, YYYY')
}

function formatCurrency(value) {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

function OverviewTab({ business, onRetire, onRequestEdit }) {
  const { token } = theme.useToken()
  const retirementPending = business?.retirementStatus === 'requested'

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

      {retirementPending && (
        <Alert
          type="warning"
          showIcon
          message="Retirement Pending"
          description="Your retirement request is being reviewed by the LGU Officer."
          style={{ marginTop: 16 }}
        />
      )}

      <Space style={{ marginTop: 20 }} wrap>
        {!retirementPending && (
          <Button icon={<StopOutlined />} danger onClick={onRetire}>
            Retire Business
          </Button>
        )}
        <Button icon={<EditOutlined />} onClick={onRequestEdit}>
          Request Edit
        </Button>
      </Space>
    </div>
  )
}

function PaymentsTab({ businessId }) {
  const { message } = App.useApp()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchPayments = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handlePay = async (record) => {
    const id = record._id || record.paymentId
    setActionLoading(id)
    try {
      await processPayment(id, { paymentMethod: 'cash' })
      message.success('Payment processed')
      fetchPayments()
    } catch (err) {
      message.error(err?.message || 'Failed to process payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (record) => {
    const id = record._id || record.paymentId
    setActionLoading(id)
    try {
      await cancelPayment(id, 'Cancelled by owner')
      message.success('Payment cancelled')
      fetchPayments()
    } catch (err) {
      message.error(err?.message || 'Failed to cancel payment')
    } finally {
      setActionLoading(null)
    }
  }

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
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'paid' ? 'success' : v === 'pending' ? 'processing' : v === 'cancelled' ? 'default' : 'warning'}>{v || 'N/A'}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_, r) => {
        const id = r._id || r.paymentId
        if (r.status !== 'pending') return null
        return (
          <Space size="small">
            <Button size="small" type="primary" loading={actionLoading === id} onClick={() => handlePay(r)}>Pay</Button>
            <Popconfirm title="Cancel this payment?" onConfirm={() => handleCancel(r)} okText="Yes" cancelText="No">
              <Button size="small" danger loading={actionLoading === id}>Cancel</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.paymentId}
      columns={columns}
      dataSource={payments}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No payment records" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
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

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    Promise.all([
      getInspections({ businessId }).catch(() => []),
      getViolations({ businessId }).catch(() => []),
      getViolationSummary().catch(() => null),
    ]).then(([ins, vio, sum]) => {
      setInspections(Array.isArray(ins) ? ins : ins?.inspections || [])
      setViolations(Array.isArray(vio) ? vio : vio?.violations || [])
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

  const inspectionCols = [
    { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Type', dataIndex: 'inspectionType', key: 'type', width: 120 },
    { title: 'Result', dataIndex: 'result', key: 'result', width: 100, render: v => <Tag color={v === 'passed' ? 'success' : v === 'failed' ? 'error' : 'default'}>{v || 'Pending'}</Tag> },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v, r) => v || r.inspector?.name || 'N/A' },
    { title: '', key: 'action', width: 60, render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleInspectionDetail(r)} /> },
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
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Violations</Title>
          <Select size="small" value={violationStatusFilter} onChange={setViolationStatusFilter} style={{ width: 130 }} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'appealed', label: 'Appealed' }]} />
        </div>
        <Table size="small" rowKey={r => r._id || r.violationId} columns={violationCols} dataSource={filteredViolations} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No violations recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>

      <Drawer title="Inspection Detail" open={detailOpen} onClose={() => setDetailOpen(false)} width={480}>
        {detailLoading ? <Spin /> : detailData ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Date">{formatDate(detailData.scheduledDate)}</Descriptions.Item>
            <Descriptions.Item label="Type">{detailData.inspectionType || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Result">{detailData.result || 'Pending'}</Descriptions.Item>
            <Descriptions.Item label="Inspector">{detailData.inspectorName || detailData.inspector?.name || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Notes">{detailData.notes || 'N/A'}</Descriptions.Item>
          </Descriptions>
        ) : <Empty />}
      </Drawer>
    </div>
  )
}

function PermitsTab({ businessId }) {
  const [general, setGeneral] = useState([])
  const [occupational, setOccupational] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    Promise.all([
      getGeneralPermits({ businessId }).catch(() => []),
      getOccupationalPermits({ businessId }).catch(() => []),
    ]).then(([gen, occ]) => {
      setGeneral(Array.isArray(gen) ? gen : gen?.permits || [])
      setOccupational(Array.isArray(occ) ? occ : occ?.permits || [])
    }).finally(() => setLoading(false))
  }, [businessId])

  const columns = [
    { title: 'Permit Type', dataIndex: 'permitType', key: 'type', render: (v, r) => v || r.type || 'N/A' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'active' || v === 'approved' ? 'success' : v === 'expired' ? 'error' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Issued', dataIndex: 'issuedDate', key: 'issued', render: v => formatDate(v), width: 120 },
    { title: 'Expiry', dataIndex: 'expiryDate', key: 'expiry', render: v => formatDate(v), width: 120 },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>

  const allPermits = [
    ...general.map(p => ({ ...p, permitType: p.permitType || 'General' })),
    ...occupational.map(p => ({ ...p, permitType: p.permitType || 'Occupational' })),
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.permitId}
      columns={columns}
      dataSource={allPermits}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No permits issued yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
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
      destroyOnClose
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
    { value: 'tradeName', label: 'Trade Name' },
    { value: 'businessAddress', label: 'Business Address' },
    { value: 'contactNumber', label: 'Contact Number' },
    { value: 'email', label: 'Email' },
    { value: 'primaryLineOfBusiness', label: 'Line of Business' },
  ]

  const handleSubmit = async () => {
    if (!selectedFields.length) { message.warning('Select at least one field'); return }
    if (!reason.trim()) { message.warning('Please provide a reason'); return }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      const fields = selectedFields.map(f => ({
        fieldName: f,
        currentValue: business?.[f] || '',
        proposedValue: fieldValues[f] || '',
      }))
      await submitEditRequest({ businessId, fields, reason })
      message.success('Edit request submitted')
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
      destroyOnClose
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
        .filter(f => f.status === 'done' && (f.response?.url || f.url))
        .map(f => f.response?.url || f.url)
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
      destroyOnClose
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

  const columns = [
    { title: 'Field', dataIndex: 'fieldName', key: 'field', width: 150 },
    { title: 'Current', dataIndex: 'currentValue', key: 'current', ellipsis: true },
    { title: 'Requested', dataIndex: 'requestedValue', key: 'requested', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 120 },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id}
      columns={columns}
      dataSource={requests}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No edit requests" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
}

function PostRequirementsTab({ businessId }) {
  const { message: msg } = App.useApp()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPostRequirements({ businessId })
      .then(data => setRequirements(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setRequirements([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmitCompliance = async (requirementId) => {
    setActionLoading(requirementId)
    try {
      await submitCompliance(requirementId, { submittedDocuments: [] })
      msg.success('Compliance submitted')
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to submit compliance')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestExtension = async (requirementId) => {
    setActionLoading(requirementId)
    try {
      const newDate = dayjs().add(30, 'day').toISOString()
      await requestExtension(requirementId, { newDueDate: newDate, reason: 'Requesting additional time' })
      msg.success('Extension requested')
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
              <Button size="small" type="primary" loading={actionLoading === id} onClick={() => handleSubmitCompliance(id)}>Submit</Button>
            ) : null}
            {r.status !== 'verified' && (
              <Button size="small" loading={actionLoading === id} onClick={() => handleRequestExtension(id)}>Extend</Button>
            )}
          </Space>
        )
      },
    },
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

export default function ApprovedBusinessView({ business, onRefresh }) {
  const { token } = theme.useToken()
  const [retireOpen, setRetireOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)

  const businessId = business?.businessId || business?._id

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <AppstoreOutlined />,
      children: (
        <OverviewTab
          business={business}
          onRetire={() => setRetireOpen(true)}
          onRequestEdit={() => setEditOpen(true)}
        />
      ),
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: <DollarOutlined />,
      children: <PaymentsTab businessId={businessId} />,
    },
    {
      key: 'compliance',
      label: 'Compliance',
      icon: <CheckCircleOutlined />,
      children: <ComplianceTab businessId={businessId} />,
    },
    {
      key: 'permits',
      label: 'Permits',
      icon: <SafetyCertificateOutlined />,
      children: <PermitsTab businessId={businessId} />,
    },
    {
      key: 'appeals',
      label: 'Appeals',
      icon: <AuditOutlined />,
      children: <AppealsTab businessId={businessId} />,
    },
    {
      key: 'edit-requests',
      label: 'Edit Requests',
      icon: <EditOutlined />,
      children: <EditRequestsTab businessId={businessId} />,
    },
    {
      key: 'post-requirements',
      label: 'Post Requirements',
      icon: <FileDoneOutlined />,
      children: <PostRequirementsTab businessId={businessId} />,
    },
  ]

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button type="link" icon={<ExclamationCircleOutlined />} onClick={() => setAppealOpen(true)}>
          File Appeal
        </Button>
      </div>
      <Tabs items={tabItems} defaultActiveKey="overview" />

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
        onSuccess={onRefresh}
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
