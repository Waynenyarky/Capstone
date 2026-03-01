/**
 * Assign Inspection Page
 * LGU Manager assigns inspections to inspectors
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  message,
  Spin,
  Alert,
  Space,
  Typography,
  Table,
  Tag,
  Empty,
} from 'antd'
import { AuditOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import LGUManagerLayout from '../components/LGUManagerLayout'
import {
  getInspectors,
  getBusinessesForInspection,
  createInspection,
} from '../infrastructure/services/inspectionAssignmentService'

const { Title, Text } = Typography

export default function AssignInspectionPage() {
  const [form] = Form.useForm()
  const [inspectors, setInspectors] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [pendingInspections, setPendingInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [inspList, bizList] = await Promise.all([
        getInspectors(),
        getBusinessesForInspection(),
      ])
      setInspectors(inspList)
      setBusinesses(bizList)
      const unassigned = bizList.filter(b => !b.inspectorAssigned)
      setPendingInspections(unassigned)
    } catch (e) {
      setError(e?.message || 'Failed to load data')
      message.error(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(values) {
    setSubmitting(true)
    setError(null)
    try {
      const { inspectorId, business, permitType, inspectionType, scheduledDate } = values
      if (!business) {
        message.error('Please select a business')
        return
      }
      const [businessProfileId, businessId] = String(business).split('::')
      if (!businessProfileId || !businessId) {
        message.error('Invalid business selection')
        return
      }
      await createInspection({
        inspectorId,
        businessProfileId,
        businessId,
        permitType,
        inspectionType,
        scheduledDate: scheduledDate?.toISOString?.() || scheduledDate,
      })
      message.success('Inspection assigned successfully')
      form.resetFields()
    } catch (e) {
      setError(e?.message || 'Failed to assign inspection')
      message.error(e?.message || 'Failed to assign inspection')
    } finally {
      setSubmitting(false)
    }
  }

  const businessOptions = businesses.map((b) => ({
    value: `${b.businessProfileId}::${b.businessId}`,
    label: `${b.businessName || 'Unknown'} (${b.businessId})`,
  }))

  const MAX_INSPECTOR_CAPACITY = 10
  const inspectorOptions = inspectors.map((i) => {
    const assignmentCount = i.activeInspections ?? i.assignmentCount ?? 0
    const isOverloaded = assignmentCount >= MAX_INSPECTOR_CAPACITY
    return {
      value: i._id,
      label: `${i.name || i.email} (${i.email}) — ${assignmentCount} active${isOverloaded ? ' [OVERLOADED]' : ''}`,
      disabled: isOverloaded,
    }
  })

  return (
    <LGUManagerLayout pageTitle="Assign Inspection">
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
        {pendingInspections.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <Title level={5} style={{ margin: 0 }}>Unassigned Businesses ({pendingInspections.length})</Title>
              </Space>
              <Table
                size="small"
                rowKey={(r) => `${r.businessProfileId}::${r.businessId}`}
                dataSource={pendingInspections}
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: 'Business', dataIndex: 'businessName', key: 'name', render: (v) => v || 'Unknown' },
                  { title: 'Business ID', dataIndex: 'businessId', key: 'id', render: (v) => <Tag>{v}</Tag> },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          form.setFieldsValue({ business: `${record.businessProfileId}::${record.businessId}` })
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                        }}
                      >
                        Assign
                      </Button>
                    ),
                  },
                ]}
                locale={{ emptyText: <Empty description="All businesses have inspectors assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Space>
          </Card>
        )}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={4}>
              <AuditOutlined /> Assign Inspection
            </Title>
            <Text type="secondary">
              Select a business, assign an inspector, and set the inspection schedule.
            </Text>
            {error && (
              <Alert
                type="error"
                message={error}
                closable
                onClose={() => setError(null)}
              />
            )}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="business"
                  label="Business"
                  rules={[{ required: true, message: 'Select a business' }]}
                >
                  <Select
                    placeholder="Select business"
                    options={businessOptions}
                    showSearch
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="inspectorId"
                  label="Inspector"
                  rules={[{ required: true, message: 'Select an inspector' }]}
                >
                  <Select
                    placeholder="Select inspector"
                    options={inspectorOptions}
                    showSearch
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="permitType"
                  label="Permit Type"
                  rules={[{ required: true }]}
                  initialValue="initial"
                >
                  <Select
                    options={[
                      { value: 'initial', label: 'Initial' },
                      { value: 'renewal', label: 'Renewal' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="inspectionType"
                  label="Inspection Type"
                  rules={[{ required: true }]}
                  initialValue="initial"
                >
                  <Select
                    options={[
                      { value: 'initial', label: 'Initial' },
                      { value: 'renewal', label: 'Renewal' },
                      { value: 'follow_up', label: 'Follow-up' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="scheduledDate"
                  label="Scheduled Date"
                  rules={[{ required: true, message: 'Select scheduled date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PlusOutlined />}
                    loading={submitting}
                  >
                    Assign Inspection
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Space>
        </Card>
      </div>
    </LGUManagerLayout>
  )
}
