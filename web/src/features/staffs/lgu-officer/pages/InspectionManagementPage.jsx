import { useState, useEffect, useCallback } from 'react'
import {
  Table, Card, Button, Modal, Form, Select, DatePicker, Space, Tag,
  Typography, Empty, Drawer, Descriptions, Row, Col, Grid
} from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  AuditOutlined, PlusOutlined, ReloadOutlined, EyeOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, post } from '@/lib/http.js'
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

  // Searchable select data
  const [businesses, setBusinesses] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [lookupsLoading, setLookupsLoading] = useState(false)

  const fetchLookups = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const [bizRes, inspRes] = await Promise.all([
        get('/api/lgu-officer/businesses-for-inspection').catch(() => ({ businesses: [] })),
        get('/api/lgu-officer/inspectors').catch(() => ({ inspectors: [] })),
      ])
      setBusinesses(bizRes?.businesses || [])
      setInspectors(inspRes?.inspectors || [])
    } catch {
      setBusinesses([])
      setInspectors([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/lgu-officer/inspections', {
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { inspectionType: typeFilter }),
      }).catch(() => ({ inspections: [] }))
      setInspections(res?.inspections || res?.data || [])
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
      // Find the selected business to get businessProfileId
      const selectedBiz = businesses.find(b => b.businessId === values.businessId)
      await post('/api/lgu-officer/inspections', {
        businessProfileId: selectedBiz?.businessProfileId || values.businessId,
        businessId: values.businessId,
        permitType: values.permitType || 'initial',
        inspectionType: values.inspectionType,
        scheduledDate: values.scheduledDate?.toISOString(),
        inspectorId: values.inspectorId,
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
  }, [form, success, notifyError, fetchInspections, businesses])

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
    { title: 'Business', dataIndex: 'businessName', key: 'business', ellipsis: true, render: (v, r) => v || r.businessId || 'N/A' },
    {
      title: 'Type',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      width: 110,
      render: (v) => {
        const t = INSPECTION_TYPES.find((t) => t.value === v)
        return <Tag>{t?.label || v}</Tag>
      },
    },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', width: 140, render: (v) => v || <Text type="secondary">Unassigned</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: getStatusTag },
    { title: 'Result', dataIndex: 'overallResult', key: 'result', width: 130, render: getResultTag },
    {
      title: 'Scheduled',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 110,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 80,
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAssignModal(true); fetchLookups() }}>
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
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleAssign}>
            <Form.Item name="businessId" label="Business" rules={[{ required: true, message: 'Select a business' }]}>
              <Select
                showSearch
                placeholder="Search business by name or ID..."
                loading={lookupsLoading}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={businesses.map(b => ({
                  value: b.businessId,
                  label: `${b.businessName || 'Unnamed'} (${b.businessId})`,
                }))}
                notFoundContent={lookupsLoading ? <LottieSpinner size="small" /> : <Empty description="No approved businesses" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              />
            </Form.Item>
            <Form.Item name="inspectorId" label="Inspector" rules={[{ required: true, message: 'Select an inspector' }]}>
              <Select
                showSearch
                placeholder="Search inspector by name..."
                loading={lookupsLoading}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={inspectors.map(i => ({
                  value: i._id,
                  label: `${i.name}${i.email ? ` (${i.email})` : ''}`,
                }))}
                notFoundContent={lookupsLoading ? <LottieSpinner size="small" /> : <Empty description="No inspectors found" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="inspectionType" label="Inspection Type" rules={[{ required: true }]}>
                  <Select placeholder="Select type" options={INSPECTION_TYPES} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="permitType" label="Permit Type" rules={[{ required: true }]} initialValue="initial">
                  <Select options={[{ value: 'initial', label: 'Initial' }, { value: 'renewal', label: 'Renewal' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="scheduledDate" label="Scheduled Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Assign Inspection
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
