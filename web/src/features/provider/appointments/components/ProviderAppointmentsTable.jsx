import React from 'react'
import { Tabs, Table, Tag, Typography, Button, Modal, Input } from 'antd'
import dayjs from 'dayjs'
import { useAuthSession } from '@/features/authentication'
import { authHeaders } from '@/lib/authHeaders.js'
import { getProviderAppointments, reviewProviderAppointment } from '@/features/provider/services/appointmentsService.js'

const statusTabs = [
  { key: 'requested', label: 'Under Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function ProviderAppointmentsTable() {
  const { currentUser } = useAuthSession()
  const [activeKey, setActiveKey] = React.useState('requested')
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState([])
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [reviewDecision, setReviewDecision] = React.useState('accept')
  const [reviewNotes, setReviewNotes] = React.useState('')
  const [reviewingId, setReviewingId] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  const load = React.useCallback(async (key) => {
    setLoading(true)
    try {
      const headers = authHeaders(currentUser, 'provider')
      const items = await getProviderAppointments({ status: key }, headers)
      setData(Array.isArray(items) ? items : [])
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => { load(activeKey) }, [activeKey, load])

  const openReview = (record, decision) => {
    setReviewingId(record?.id || null)
    setReviewDecision(decision)
    setReviewNotes('')
    setReviewOpen(true)
  }

  const submitReview = async () => {
    if (!reviewingId) return
    setSubmitting(true)
    try {
      const headers = authHeaders(currentUser, 'provider', { 'Content-Type': 'application/json' })
      await reviewProviderAppointment(reviewingId, reviewDecision, reviewNotes, headers)
      setReviewOpen(false)
      setReviewingId(null)
      setReviewNotes('')
      await load(activeKey)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    {
      title: 'Appointment',
      dataIndex: 'appointmentAt',
      key: 'appointmentAt',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: 'Pricing',
      dataIndex: 'pricing',
      key: 'pricing',
      render: (_, row) => {
        if (row.pricingMode === 'hourly' || row.pricingSelection === 'hourly') {
          const rate = row.hourlyRate ? `${row.hourlyRate}/hr` : ''
          const hrs = row.estimatedHours ? `${row.estimatedHours}h` : ''
          return `${rate}${hrs ? ` • ${hrs}` : ''}`
        }
        if (row.pricingMode === 'fixed' || row.pricingSelection === 'fixed') {
          return typeof row.fixedPrice === 'number' ? `${row.fixedPrice}` : 'Fixed'
        }
        return '—'
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag>{s}</Tag>,
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        row.status === 'requested' ? (
          <>
            <Button type="primary" size="small" onClick={() => openReview(row, 'accept')}>Accept</Button>
            <Button danger size="small" onClick={() => openReview(row, 'decline')} style={{ marginLeft: 8 }}>Decline</Button>
          </>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={4}>Appointment Requests</Typography.Title>
      <Tabs
        activeKey={activeKey}
        onChange={(k) => setActiveKey(k)}
        items={statusTabs.map((t) => ({ key: t.key, label: t.label }))}
      />
      <Table
        rowKey={(r) => r.id}
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
      />
      <Modal
        title={reviewDecision === 'accept' ? 'Accept Appointment' : 'Decline Appointment'}
        open={reviewOpen}
        onOk={submitReview}
        confirmLoading={submitting}
        onCancel={() => setReviewOpen(false)}
        okText={reviewDecision === 'accept' ? 'Accept' : 'Decline'}
      >
        <Typography.Paragraph>
          {reviewDecision === 'accept'
            ? 'Optionally add a note to the customer.'
            : 'Add a reason for declining (optional).'}
        </Typography.Paragraph>
        <Input.TextArea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
      </Modal>
    </div>
  )
}