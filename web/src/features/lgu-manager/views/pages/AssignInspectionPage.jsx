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
} from 'antd'
import { AssignmentOutlined, PlusOutlined } from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import {
  getInspectors,
  getBusinessesForInspection,
  createInspection,
} from '../../infrastructure/services/inspectionAssignmentService'

const { Title, Text } = Typography

export default function AssignInspectionPage() {
  const [form] = Form.useForm()
  const [inspectors, setInspectors] = useState([])
  const [businesses, setBusinesses] = useState([])
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

  const inspectorOptions = inspectors.map((i) => ({
    value: i._id,
    label: `${i.name || i.email} (${i.email})`,
  }))

  return (
    <LGUManagerLayout pageTitle="Assign Inspection">
      <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 24 }}>
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={4}>
              <AssignmentOutlined /> Assign Inspection
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
