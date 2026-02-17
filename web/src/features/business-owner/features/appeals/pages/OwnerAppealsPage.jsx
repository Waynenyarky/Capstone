import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, Space, Tag,
  Typography, Spin, Empty, Alert, Upload, message, Grid
} from 'antd'
import { ExclamationCircleOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../components/BusinessOwnerLayout.jsx'
import { get, post } from '@/lib/http.js'
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

export default function OwnerAppealsPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [appealRes, bizRes] = await Promise.all([
        get('/api/business/appeals'),
        get('/api/business/businesses'),
      ])
      setAppeals(appealRes?.data || [])
      setBusinesses(bizRes?.businesses || [])
    } catch (err) {
      notifyError(err, 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = useCallback(async (values) => {
    try {
      setSubmitting(true)
      await post('/api/business/appeals', {
        businessId: values.businessId,
        appealType: values.appealType,
        description: values.description,
        evidence: values.evidence ? values.evidence.split('\n').filter(Boolean) : [],
      })
      success('Appeal submitted successfully')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (err) {
      if (err?.response?.data?.error?.code === 'DUPLICATE_APPEAL') {
        message.warning('An open appeal already exists for this business and type')
      } else {
        notifyError(err, 'Failed to submit appeal')
      }
    } finally {
      setSubmitting(false)
    }
  }, [form, success, notifyError, fetchData])

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
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
      render: (v) => v || '-',
    },
  ]

  return (
    <BusinessOwnerLayout>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              My Appeals
            </Title>
            <Paragraph type="secondary">
              Submit and track appeals for fee disputes, violations, inspection results, and more.
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
              Submit Appeal
            </Button>
          </Space>
        </div>

        <Table
          dataSource={appeals}
          columns={columns}
          rowKey={(r) => r._id || r.id}
          loading={loading}
          locale={{ emptyText: <Empty description="No appeals submitted yet" /> }}
          scroll={{ x: 'max-content' }}
        />

        <Modal
          title="Submit Appeal"
          open={modalOpen}
          onCancel={() => { setModalOpen(false); form.resetFields() }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="businessId" label="Business" rules={[{ required: true, message: 'Select a business' }]}>
              <Select placeholder="Select business">
                {businesses.map((b) => (
                  <Select.Option key={b.businessId} value={b.businessId}>
                    {b.businessName || b.registeredBusinessName || b.businessId}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="appealType" label="Appeal Type" rules={[{ required: true, message: 'Select appeal type' }]}>
              <Select placeholder="Select type" options={APPEAL_TYPES} />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Describe your appeal' }]}>
              <TextArea rows={4} placeholder="Describe the issue and why you are appealing..." />
            </Form.Item>
            <Form.Item name="evidence" label="Evidence / Supporting Documents (URLs, one per line)">
              <TextArea rows={3} placeholder="Paste document URLs or references, one per line" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Submit Appeal
            </Button>
          </Form>
        </Modal>
      </div>
    </BusinessOwnerLayout>
  )
}
