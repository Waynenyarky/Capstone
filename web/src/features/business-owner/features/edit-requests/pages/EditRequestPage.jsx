import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, Space, Tag,
  Typography, Spin, Empty, Alert, message, Grid
} from 'antd'
import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../components/BusinessOwnerLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const EDITABLE_FIELDS = [
  { value: 'businessName', label: 'Business Name' },
  { value: 'businessTradeName', label: 'Trade Name' },
  { value: 'businessAddress', label: 'Business Address' },
  { value: 'contactNumber', label: 'Contact Number' },
  { value: 'emailAddress', label: 'Email Address' },
  { value: 'mobileNumber', label: 'Mobile Number' },
  { value: 'ownerFullName', label: 'Owner Name' },
  { value: 'businessActivities', label: 'Business Activities' },
  { value: 'numberOfEmployees', label: 'Number of Employees' },
  { value: 'other', label: 'Other (specify in reason)' },
]

export default function EditRequestPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [reqRes, bizRes] = await Promise.all([
        get('/api/business/edit-requests'),
        get('/api/business/businesses'),
      ])
      setRequests(reqRes?.data || [])
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
      await post('/api/business/edit-requests', {
        businessId: values.businessId,
        fieldName: values.fieldName,
        currentValue: values.currentValue || '',
        requestedValue: values.requestedValue,
        reason: values.reason,
      })
      success('Edit request submitted')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (err) {
      notifyError(err, 'Failed to submit edit request')
    } finally {
      setSubmitting(false)
    }
  }, [form, success, notifyError, fetchData])

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'processing', text: 'Pending' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    { title: 'Business', dataIndex: 'businessId', key: 'businessId', render: (v) => <Text code>{v?.slice(-8) || 'N/A'}</Text> },
    { title: 'Field', dataIndex: 'fieldName', key: 'fieldName' },
    { title: 'Requested Value', dataIndex: 'requestedValue', key: 'requestedValue', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Review Notes',
      dataIndex: 'reviewNotes',
      key: 'reviewNotes',
      ellipsis: true,
      render: (v) => v || '-',
    },
  ]

  return (
    <BusinessOwnerLayout pageTitle="Edit Request" pageIcon={<EditOutlined />}>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Request changes to your business information. An officer will review and approve your request.
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
              New Request
            </Button>
          </Space>
        </div>

        <Table
          dataSource={requests}
          columns={columns}
          rowKey={(r) => r._id || r.id}
          loading={loading}
          locale={{ emptyText: <Empty description="No edit requests yet" /> }}
          scroll={{ x: 'max-content' }}
        />

        <Modal
          title="Request Business Information Change"
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
            <Form.Item name="fieldName" label="Field to Change" rules={[{ required: true, message: 'Select a field' }]}>
              <Select placeholder="Select field" options={EDITABLE_FIELDS} />
            </Form.Item>
            <Form.Item name="currentValue" label="Current Value">
              <Input placeholder="Current value (optional)" />
            </Form.Item>
            <Form.Item name="requestedValue" label="New Value" rules={[{ required: true, message: 'Enter the new value' }]}>
              <TextArea rows={3} placeholder="Enter the new value you want" />
            </Form.Item>
            <Form.Item name="reason" label="Reason for Change" rules={[{ required: true, message: 'Provide a reason' }]}>
              <TextArea rows={3} placeholder="Explain why this change is needed" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Submit Request
            </Button>
          </Form>
        </Modal>
      </div>
    </BusinessOwnerLayout>
  )
}
