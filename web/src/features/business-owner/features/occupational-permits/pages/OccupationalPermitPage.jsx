import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker,
  Row, Col, Space, Tag, Typography, Spin, Empty, Tabs, Alert, Descriptions, Grid, Collapse
} from 'antd'
import { IdcardOutlined, PlusOutlined, ReloadOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../components/BusinessOwnerLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function OccupationalPermitPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [permits, setPermits] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchPermits = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/business/occupational-permits')
      setPermits(res?.data || [])
    } catch (err) {
      notifyError(err, 'Failed to load occupational permits')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => { fetchPermits() }, [fetchPermits])

  const handleSubmit = useCallback(async (values) => {
    try {
      setSubmitting(true)
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        civilStatus: values.civilStatus,
        dateOfBirth: values.dateOfBirth?.toISOString(),
        address: values.address,
        education: values.education,
        businessPlateNo: values.businessPlateNo,
        employer: values.employer,
        company: values.company,
        position: values.position,
        type: values.type,
      }
      await post('/api/business/occupational-permits', payload)
      success('Occupational permit application submitted')
      setModalOpen(false)
      form.resetFields()
      fetchPermits()
    } catch (err) {
      notifyError(err, 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }, [form, success, notifyError, fetchPermits])

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'processing', text: 'Pending' },
      lab_pending: { color: 'warning', text: 'Lab Pending' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    { title: 'Name', render: (_, r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'N/A' },
    { title: 'Type', dataIndex: 'type', render: (v) => v === 'self_employed' ? 'Self-employed' : 'Employed' },
    { title: 'Company', dataIndex: 'company' },
    { title: 'Status', dataIndex: 'status', render: getStatusTag },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Lab Exams',
      dataIndex: 'labExams',
      render: (labExams) => {
        if (!labExams || typeof labExams !== 'object') return '-'
        const entries = Object.entries(labExams instanceof Map ? Object.fromEntries(labExams) : labExams)
        if (entries.length === 0) return '-'
        const completed = entries.filter(([, v]) => v?.status === 'passed').length
        return `${completed}/${entries.length} passed`
      },
    },
  ]

  return (
    <BusinessOwnerLayout pageTitle="Occupational Permits" pageIcon={<IdcardOutlined />}>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Apply for occupational permits (employee permits). Processing time is approximately 30 days.
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchPermits} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
              Apply
            </Button>
          </Space>
        </div>

        <Tabs
          items={[
            {
              key: 'apply',
              label: 'My Applications',
              children: (
                <Table
                  dataSource={permits}
                  columns={columns}
                  rowKey={(r) => r._id || r.id}
                  loading={loading}
                  locale={{ emptyText: <Empty description="No occupational permit applications" /> }}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
          ]}
        />

        <Modal
          title="Apply for Occupational Permit"
          open={modalOpen}
          onCancel={() => { setModalOpen(false); form.resetFields() }}
          footer={null}
          width={isMobile ? '95%' : 700}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Collapse
              defaultActiveKey={['personal']}
              style={{ marginBottom: 16 }}
              items={[
                {
                  key: 'personal',
                  label: 'Personal Information',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                            <Input placeholder="First name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                            <Input placeholder="Last name" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col xs={24} md={8}>
                          <Form.Item name="gender" label="Gender">
                            <Select placeholder="Select">
                              <Select.Option value="male">Male</Select.Option>
                              <Select.Option value="female">Female</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item name="civilStatus" label="Civil Status">
                            <Select placeholder="Select">
                              <Select.Option value="single">Single</Select.Option>
                              <Select.Option value="married">Married</Select.Option>
                              <Select.Option value="widowed">Widowed</Select.Option>
                              <Select.Option value="separated">Separated</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          <Form.Item name="dateOfBirth" label="Date of Birth">
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item name="address" label="Address">
                        <Input placeholder="Complete address" />
                      </Form.Item>
                      <Form.Item name="education" label="Highest Education">
                        <Select placeholder="Select">
                          <Select.Option value="elementary">Elementary</Select.Option>
                          <Select.Option value="high_school">High School</Select.Option>
                          <Select.Option value="vocational">Vocational</Select.Option>
                          <Select.Option value="college">College</Select.Option>
                          <Select.Option value="postgraduate">Postgraduate</Select.Option>
                        </Select>
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'employment',
                  label: 'Employment Information',
                  children: (
                    <>
                      <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select placeholder="Select">
                          <Select.Option value="employed">Employed</Select.Option>
                          <Select.Option value="self_employed">Self-employed</Select.Option>
                        </Select>
                      </Form.Item>
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="businessPlateNo" label="Business Plate No." rules={[{ required: true }]}>
                            <Input placeholder="e.g. BP-2024-00001" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="employer" label="Employer Name">
                            <Input placeholder="Employer name" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="company" label="Company / Establishment">
                            <Input placeholder="Company name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="position" label="Position / Designation">
                            <Input placeholder="Position" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
              ]}
            />

            <Alert
              type="info"
              message="Pre-requirements"
              description="Please ensure you have the following before applying: Barangay Clearance, Community Tax Certificate (CTC), and PIS Registration."
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Alert
              type="warning"
              message="Lab Exams Required"
              description="After submission, you will need to complete lab exams. Food handlers: Urinalysis, Fecalysis, Hepa B, X-ray. Non-food: Drug Test, X-ray. Processing takes approximately 30 days."
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              Submit Application
            </Button>
          </Form>
        </Modal>
      </div>
    </BusinessOwnerLayout>
  )
}
