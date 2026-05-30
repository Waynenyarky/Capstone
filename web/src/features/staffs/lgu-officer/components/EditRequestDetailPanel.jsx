import { useState, useEffect, useCallback } from 'react'
import { Typography, Descriptions, Tag, Card, Form, Input, Button, Space, Empty, theme } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  pending: 'processing',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
}

export default function EditRequestDetailPanel({ request, onReviewComplete }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [processing, setProcessing] = useState(false)
  const { success, error: notifyError } = useNotifier()

  const handleReview = useCallback(async (decision) => {
    if (!request) return
    try {
      setProcessing(true)
      const values = form.getFieldsValue()
      await put(`/api/business/edit-requests/${request._id}`, {
        status: decision,
        reviewNotes: values.reviewNotes,
      })
      success(`Edit request ${decision}`)
      form.resetFields()
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to process edit request')
    } finally {
      setProcessing(false)
    }
  }, [request, form, success, notifyError, onReviewComplete])

  useEffect(() => {
    form.resetFields()
  }, [request, form])

  if (!request) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select an edit request to review" />
      </div>
    )
  }

  const isPending = request.status === 'pending' || request.status === 'submitted' || !request.status

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Edit Request Details</Text>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Business ID">
          <Text code>{request.businessId}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Field">
          <Text strong>{request.fieldName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Current Value">
          {request.currentValue || <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Value">
          <Text strong style={{ color: token.colorPrimary }}>{request.requestedValue}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Reason">
          {request.reason || <Text type="secondary">No reason provided</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[request.status] || 'default'}>{request.status || 'pending'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Submitted">
          {request.createdAt ? dayjs(request.createdAt).format('MMM D, YYYY h:mm A') : '—'}
        </Descriptions.Item>
      </Descriptions>

      {isPending && (
        <Card size="small" title="Review Decision" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Form.Item name="reviewNotes" label="Review Notes (Optional)">
              <TextArea rows={3} placeholder="Add notes about your decision..." />
            </Form.Item>
            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />} loading={processing} onClick={() => handleReview('approved')}>
                Approve
              </Button>
              <Button danger icon={<CloseCircleOutlined />} loading={processing} onClick={() => handleReview('rejected')}>
                Reject
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {!isPending && request.reviewNotes && (
        <Card size="small" title="Review Notes">
          <Text>{request.reviewNotes}</Text>
        </Card>
      )}
    </div>
  )
}
