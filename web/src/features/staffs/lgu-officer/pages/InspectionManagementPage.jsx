import React, { useState, useEffect, useCallback } from 'react'
import {
  Table, Card, Button, Modal, Form, Input, Select, DatePicker, Space, Tag,
  Typography, Spin, Empty, Drawer, Descriptions, Badge, Row, Col, message, Grid
} from 'antd'
import {
  AuditOutlined, PlusOutlined, ReloadOutlined, EyeOutlined,
  FilterOutlined, UserOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, post, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

const INSPECTION_TYPES = [
  { value: 'initial', label: 'Initial' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'joint', label: 'Joint' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'complaint', label: 'Complaint' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function InspectionManagementPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [inspections, setInspections] = useState([])
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [typeFilter, setTypeFilter] = useState(undefined)
  const [assignModal, setAssignModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true)
      // Inspections may be served from a different endpoint
      const res = await get('/api/business/inspections', {
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      }).catch(() => ({ data: [] }))
      setInspections(res?.data || [])
    } catch (err) {
      setInspections([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => { fetchInspections() }, [fetchInspections])

  const handleAssign = useCallback(async (values) => {
    try {
      setSubmitting(true)
      await post('/api/business/inspections', {
        businessId: values.businessId,
        inspectionType: values.inspectionType,
        scheduledDate: values.scheduledDate?.toISOString(),
        inspectorId: values.inspectorId,
        complaintDetails: values.complaintDetails || '',
      })
      success('Inspection assigned')
      setAssignModal(false)
      form.resetFields()
      fetchInspections()
    } catch (err) {
      notifyError(err, 'Failed to assign inspection')
    } finally {
      setSubmitting(false)
    }
  }, [form, success, notifyError, fetchInspections])

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'default', text: 'Pending' },
      in_progress: { color: 'processing', text: 'In Progress' },
      completed: { color: 'success', text: 'Completed' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const getResultTag = (result) => {
    if (!result) return '-'
    const map = {
      passed: { color: 'success', text: 'Passed' },
      failed: { color: 'error', text: 'Failed' },
      needs_reinspection: { color: 'warning', text: 'Needs Re-inspection' },
    }
    const cfg = map[result] || { color: 'default', text: result }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    { title: 'Business ID', dataIndex: 'businessId', key: 'businessId', render: (v) => <Text code>{v}</Text> },
    {
      title: 'Type',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      render: (v) => {
        const t = INSPECTION_TYPES.find((t) => t.value === v)
        return <Tag>{t?.label || v}</Tag>
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: 'Result', dataIndex: 'overallResult', key: 'result', render: getResultTag },
    {
      title: 'Scheduled',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailDrawer(record)}>
          Details
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
              <AuditOutlined style={{ marginRight: 8 }} />
              Inspection Management
            </Title>
            <Paragraph type="secondary">
              Manage business inspections: initial, renewal, compliance, complaint, and joint inspections.
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchInspections} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAssignModal(true) }}>
              Assign Inspection
            </Button>
          </Space>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="Filter by status"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="Filter by type"
              style={{ width: 160 }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              options={INSPECTION_TYPES}
            />
          </Space>
        </Card>

        <Table
          aria-label="Inspections"
          dataSource={inspections}
          columns={columns}
          rowKey={(r) => r._id || r.id}
          loading={loading}
          locale={{ emptyText: <Empty description="No inspections found" /> }}
          scroll={{ x: 'max-content' }}
        />

        {/* Assign Inspection Modal */}
        <Modal
          title="Assign Inspection"
          open={assignModal}
          onCancel={() => { setAssignModal(false); form.resetFields() }}
          footer={null}
          width={isMobile ? '95%' : 500}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleAssign}>
            <Form.Item name="businessId" label="Business ID" rules={[{ required: true }]}>
              <Input placeholder="e.g. BP-2024-00001" />
            </Form.Item>
            <Form.Item name="inspectionType" label="Inspection Type" rules={[{ required: true }]}>
              <Select placeholder="Select type" options={INSPECTION_TYPES} />
            </Form.Item>
            <Form.Item name="scheduledDate" label="Scheduled Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="inspectorId" label="Inspector ID">
              <Input placeholder="Inspector user ID (optional)" />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.inspectionType !== curr.inspectionType}
            >
              {({ getFieldValue }) =>
                getFieldValue('inspectionType') === 'complaint' ? (
                  <Form.Item name="complaintDetails" label="Complaint Details">
                    <Input.TextArea rows={3} placeholder="Describe the complaint" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Assign
            </Button>
          </Form>
        </Modal>

        {/* Detail Drawer */}
        <Drawer
          title="Inspection Details"
          open={!!detailDrawer}
          onClose={() => setDetailDrawer(null)}
          width={isMobile ? '100%' : 500}
        >
          {detailDrawer && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Business ID">{detailDrawer.businessId}</Descriptions.Item>
                <Descriptions.Item label="Type">
                  {INSPECTION_TYPES.find((t) => t.value === detailDrawer.inspectionType)?.label || detailDrawer.inspectionType}
                </Descriptions.Item>
                <Descriptions.Item label="Status">{getStatusTag(detailDrawer.status)}</Descriptions.Item>
                <Descriptions.Item label="Result">{getResultTag(detailDrawer.overallResult)}</Descriptions.Item>
                <Descriptions.Item label="Scheduled">
                  {detailDrawer.scheduledDate ? dayjs(detailDrawer.scheduledDate).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Completed">
                  {detailDrawer.completedAt ? dayjs(detailDrawer.completedAt).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
              </Descriptions>

              {detailDrawer.complaintDetails && (
                <Card size="small" title="Complaint Details">
                  <Text>{detailDrawer.complaintDetails}</Text>
                </Card>
              )}

              {detailDrawer.checklist?.length > 0 && (
                <Card size="small" title="Checklist">
                  <Table
                    aria-label="Inspection checklist"
                    dataSource={detailDrawer.checklist}
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: 'Item', dataIndex: 'label' },
                      {
                        title: 'Result',
                        dataIndex: 'result',
                        render: (v) => {
                          const colors = { pass: 'success', fail: 'error', na: 'default', pending: 'processing' }
                          return <Tag color={colors[v] || 'default'}>{v}</Tag>
                        },
                      },
                      { title: 'Remarks', dataIndex: 'remarks' },
                    ]}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}

              {detailDrawer.violationsFound?.length > 0 && (
                <Card size="small" title="Violations Found">
                  {detailDrawer.violationsFound.map((v, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <Tag color={v.severity === 'critical' ? 'red' : v.severity === 'high' ? 'orange' : 'default'}>
                        {v.severity}
                      </Tag>
                      <Text>{v.description || v.type}</Text>
                    </div>
                  ))}
                </Card>
              )}
            </Space>
          )}
        </Drawer>
      </div>
    </StaffLayout>
  )
}
