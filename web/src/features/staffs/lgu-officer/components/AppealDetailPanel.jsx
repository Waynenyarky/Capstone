import React, { useState, useCallback } from 'react'
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
  upheld: 'success',
  overturned: 'error',
  resolved: 'success',
}

export default function AppealDetailPanel({ appeal, onReviewComplete }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [processing, setProcessing] = useState(false)
  const { success, error: notifyError } = useNotifier()

  const handleReview = useCallback(async (decision) => {
    if (!appeal) return
    try {
      setProcessing(true)
      const values = form.getFieldsValue()
      await put(`/api/business/appeals/${appeal._id}`, {
        status: decision,
        resolution: values.resolution,
      })
      success(`Appeal ${decision}`)
      form.resetFields()
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to process appeal')
    } finally {
      setProcessing(false)
    }
  }, [appeal, form, success, notifyError, onReviewComplete])

  if (!appeal) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select an appeal to review" />
      </div>
    )
  }

  const isPending = appeal.status === 'pending' || appeal.status === 'submitted'

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Appeal Details</Text>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Appeal ID">
          <Text code>{appeal._id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Business">
          <Text strong>{appeal.businessName || appeal.businessId || 'N/A'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          {appeal.appealType || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          {appeal.description || <Text type="secondary">No description</Text>}
        </Descriptions.Item>
        {appeal.evidence && (
          <Descriptions.Item label="Evidence">
            {appeal.evidence}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[appeal.status] || 'default'}>{appeal.status || 'pending'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Filed">
          {appeal.createdAt ? dayjs(appeal.createdAt).format('MMM D, YYYY h:mm A') : '—'}
        </Descriptions.Item>
      </Descriptions>

      {isPending && (
        <Card size="small" title="Review Decision" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Form.Item name="resolution" label="Resolution Notes">
              <TextArea rows={3} placeholder="Explain your decision..." />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('upheld')}
              >
                Uphold Appeal
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('overturned')}
              >
                Overturn / Deny
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {!isPending && appeal.resolution && (
        <Card size="small" title="Resolution">
          <Text>{appeal.resolution}</Text>
        </Card>
      )}
    </div>
  )
}
