import React, { useState, useCallback } from 'react'
import { Typography, Descriptions, Tag, Card, Form, Input, Button, Space, Empty, theme } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  requested: 'warning',
  inspector_verified: 'processing',
  confirmed: 'success',
  rejected: 'error',
}

export default function CessationDetailPanel({ cessation, onReviewComplete }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [processing, setProcessing] = useState(false)
  const { success, error: notifyError } = useNotifier()

  const handleReview = useCallback(async (decision) => {
    if (!cessation) return
    const businessId = cessation.businessId || cessation._id
    try {
      setProcessing(true)
      const values = form.getFieldsValue()
      await put(`/api/business/retirements/${businessId}/review`, {
        status: decision,
        reviewNotes: values.reviewNotes,
      })
      success(`Cessation ${decision}`)
      form.resetFields()
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to process cessation request')
    } finally {
      setProcessing(false)
    }
  }, [cessation, form, success, notifyError, onReviewComplete])

  if (!cessation) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a cessation request to review" />
      </div>
    )
  }

  const status = cessation.retirementStatus || cessation.status
  const canReview = status === 'requested' || status === 'inspector_verified'

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Cessation Request Details</Text>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Business">
          <Text strong>{cessation.businessName || cessation.businesses?.[0]?.businessName || 'N/A'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Business ID">
          <Text code>{cessation.businessId || cessation._id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Reason">
          {cessation.retirementReason || cessation.reason || <Text type="secondary">No reason provided</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[status] || 'default'}>{status || 'unknown'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Requested">
          {cessation.retirementRequestedAt || cessation.createdAt
            ? dayjs(cessation.retirementRequestedAt || cessation.createdAt).format('MMM D, YYYY h:mm A')
            : '—'}
        </Descriptions.Item>
        {cessation.inspectorVerifiedAt && (
          <Descriptions.Item label="Inspector Verified">
            {dayjs(cessation.inspectorVerifiedAt).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
        )}
      </Descriptions>

      {canReview && (
        <Card size="small" title="Review Decision" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Form.Item name="reviewNotes" label="Review Notes (Optional)">
              <TextArea rows={3} placeholder="Add notes about your decision..." />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('confirmed')}
              >
                Confirm Cessation
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('rejected')}
              >
                Reject
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {!canReview && cessation.retirementRejectionReason && (
        <Card size="small" title="Review Notes">
          <Text>{cessation.retirementRejectionReason}</Text>
        </Card>
      )}
    </div>
  )
}
