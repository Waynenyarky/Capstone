import React, { useState, useEffect, useCallback } from 'react'
import {
  Table, Card, Button, Modal, Form, Input, Space, Tag, Typography,
  Select, Spin, Empty, Descriptions, message, Grid, theme
} from 'antd'
import {
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, ReloadOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const APPEAL_TYPES = [
  { value: 'fee_dispute', label: 'Fee Dispute' },
  { value: 'violation_dispute', label: 'Violation Dispute' },
  { value: 'inspection_result', label: 'Inspection Result' },
  { value: 'permit_denial', label: 'Permit Denial' },
  { value: 'penalty_dispute', label: 'Penalty Dispute' },
  { value: 'other', label: 'Other' },
]

export default function StaffAppealsPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState([])
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [reviewModal, setReviewModal] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/business/appeals', { role: 'staff' })
      let data = res?.data || []
      if (statusFilter) {
        data = data.filter((a) => a.status === statusFilter)
      }
      setAppeals(data)
    } catch (err) {
      notifyError(err, 'Failed to load appeals')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, notifyError])

  useEffect(() => { fetchAppeals() }, [fetchAppeals])

  const handleReview = useCallback(async (values) => {
    if (!reviewModal) return
    try {
      setProcessing(true)
      await put(`/api/business/appeals/${reviewModal._id}`, {
        status: values.decision,
        resolution: values.resolution,
      })
      success(`Appeal ${values.decision}`)
      setReviewModal(null)
      form.resetFields()
      fetchAppeals()
    } catch (err) {
      notifyError(err, 'Failed to process appeal')
    } finally {
      setProcessing(false)
    }
  }, [reviewModal, form, success, notifyError, fetchAppeals])

  const getStatusTag = (status) => {
    const map = {
      submitted: { color: 'processing', text: 'Submitted' },
      under_review: { color: 'warning', text: 'Under Review' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    { title: 'Business ID', dataIndex: 'businessId', key: 'businessId', render: (v) => <Text code>{v?.slice(-8) || 'N/A'}</Text> },
    {
      title: 'Type',
      dataIndex: 'appealType',
      key: 'appealType',
      render: (v) => {
        const t = APPEAL_TYPES.find((t) => t.value === v)
        return t?.label || v
      },
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => { setReviewModal(record); form.resetFields() }}
          disabled={record.status === 'approved' || record.status === 'rejected'}
        >
          Review
        </Button>
      ),
    },
  ]

  return (
    <StaffLayout>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              Appeal Review
            </Title>
            <Paragraph type="secondary">
              Review and process business owner appeals.
            </Paragraph>
          </div>
          <Space>
            <Select
              placeholder="Filter by status"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="submitted">Submitted</Select.Option>
              <Select.Option value="under_review">Under Review</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchAppeals} loading={loading}>Refresh</Button>
          </Space>
        </div>

        <Table
          aria-label="Appeals list"
          dataSource={appeals}
          columns={columns}
          rowKey={(r) => r._id || r.id}
          loading={loading}
          locale={{ emptyText: <Empty description="No appeals to review" /> }}
          scroll={{ x: 'max-content' }}
        />

        <Modal
          title="Review Appeal"
          open={!!reviewModal}
          onCancel={() => { setReviewModal(null); form.resetFields() }}
          footer={null}
          width={isMobile ? '95%' : 600}
          destroyOnHidden
        >
          {reviewModal && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Business ID">{reviewModal.businessId}</Descriptions.Item>
                <Descriptions.Item label="Type">
                  {APPEAL_TYPES.find((t) => t.value === reviewModal.appealType)?.label || reviewModal.appealType}
                </Descriptions.Item>
                <Descriptions.Item label="Status">{getStatusTag(reviewModal.status)}</Descriptions.Item>
                <Descriptions.Item label="Description">{reviewModal.description}</Descriptions.Item>
                {reviewModal.evidence?.length > 0 && (
                  <Descriptions.Item label="Evidence">
                    {reviewModal.evidence.map((e, i) => <div key={i}>{e}</div>)}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Form form={form} layout="vertical" onFinish={handleReview}>
                <Form.Item name="decision" label="Decision" rules={[{ required: true, message: 'Select a decision' }]}>
                  <Select placeholder="Select decision">
                    <Select.Option value="approved">
                      <Space><CheckCircleOutlined style={{ color: token.colorSuccess }} /> Approve</Space>
                    </Select.Option>
                    <Select.Option value="rejected">
                      <Space><CloseCircleOutlined style={{ color: token.colorError }} /> Reject</Space>
                    </Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="resolution" label="Resolution / Comments" rules={[{ required: true, message: 'Provide resolution comments' }]}>
                  <TextArea rows={4} placeholder="Explain the decision..." />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={processing} block>
                  Submit Decision
                </Button>
              </Form>
            </Space>
          )}
        </Modal>
      </div>
    </StaffLayout>
  )
}
