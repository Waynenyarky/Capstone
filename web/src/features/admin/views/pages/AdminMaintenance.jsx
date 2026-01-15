import { useEffect, useState } from 'react'
import { Layout, Card, Form, Input, DatePicker, Select, Button, Space, Typography, Table, Tag } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { requestMaintenance, getMaintenanceCurrent, getMaintenanceApprovals, approveMaintenance } from '../../services'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text } = Typography

export default function AdminMaintenance() {
  const [form] = Form.useForm()
  const [current, setCurrent] = useState(null)
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(false)
  const { success, error } = useNotifier()

  const load = async () => {
    setLoading(true)
    try {
      const [statusRes, approvalsRes] = await Promise.all([getMaintenanceCurrent(), getMaintenanceApprovals()])
      setCurrent(statusRes?.maintenance || null)
      setApprovals((approvalsRes?.approvals || []).filter((a) => a.requestType === 'maintenance_mode'))
    } catch (err) {
      console.error('Load maintenance data failed', err)
      error(err, 'Failed to load maintenance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (values) => {
    try {
      await requestMaintenance({
        action: values.action,
        message: values.message,
        expectedResumeAt: values.expectedResumeAt ? values.expectedResumeAt.toISOString() : null,
      })
      success('Maintenance request submitted for approval')
      form.resetFields()
      load()
    } catch (err) {
      console.error('Maintenance request failed', err)
      error(err, 'Failed to submit request')
    }
  }

  const handleApprove = async (approvalId, approved) => {
    try {
      await approveMaintenance(approvalId, approved, '')
      success(approved ? 'Approved maintenance change' : 'Rejected maintenance change')
      load()
    } catch (err) {
      console.error('Approve maintenance failed', err)
      error(err, 'Failed to process approval')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'approvalId', key: 'approvalId' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Action', key: 'action', render: (_, rec) => rec.requestDetails?.action || '-' },
    { title: 'Message', key: 'message', render: (_, rec) => rec.requestDetails?.message || '-' },
    {
      title: 'Approve',
      key: 'approve',
      render: (_, rec) => rec.status === 'pending' ? (
        <Space>
          <Button size="small" type="primary" onClick={() => handleApprove(rec.approvalId, true)}>Approve</Button>
          <Button size="small" danger onClick={() => handleApprove(rec.approvalId, false)}>Reject</Button>
        </Space>
      ) : null,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Maintenance Control</Title>
          <Card loading={loading} title="Current Status">
            {current && current.isActive ? (
              <Space direction="vertical">
                <Text strong>Active</Text>
                <Text>{current.message || 'No message set'}</Text>
                {current.expectedResumeAt && <Text type="secondary">Expected resume: {new Date(current.expectedResumeAt).toLocaleString()}</Text>}
              </Space>
            ) : (
              <Text type="secondary">No active maintenance window.</Text>
            )}
          </Card>

          <Card title="Request Maintenance Change">
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Select action' }]}>
                <Select
                  options={[
                    { value: 'enable', label: 'Enable maintenance mode' },
                    { value: 'disable', label: 'Disable maintenance mode' },
                  ]}
                  placeholder="Choose"
                />
              </Form.Item>
              <Form.Item name="message" label="Message" rules={[{ max: 500 }]}>
                <Input.TextArea placeholder="Shown to users during maintenance" rows={3} />
              </Form.Item>
              <Form.Item name="expectedResumeAt" label="Expected Resume Time">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Submit for Approval</Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Pending/Recent Requests">
            <Table rowKey="approvalId" dataSource={approvals} columns={columns} pagination={false} />
          </Card>
        </Space>
      </Layout.Content>
    </Layout>
  )
}
