import React, { useState, useCallback } from 'react'
import {
  Card, Steps, Button, Form, Input, Select, Row, Col, Typography,
  Spin, Alert, Descriptions, Table, Space, Divider, message, Empty, Result, Grid
} from 'antd'
import {
  SearchOutlined, UserAddOutlined, FormOutlined,
  DollarOutlined, PrinterOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import {
  Step1ApplicationType,
  Step2TaxpayerInfo,
  Step3Addresses,
  Step4BusinessActivities,
  Step5Capital,
  Step6Accreditations,
} from '@/features/business-owner/features/business-registration/components/BusinessRegistrationForm.jsx'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps
const { useBreakpoint } = Grid

export default function WalkInApplicationPage() {
  const screens = useBreakpoint()
  const { error: notifyError } = useNotifier()
  const isMobile = !screens.md
  const [currentStep, setCurrentStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form] = Form.useForm()
  const [pisForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [computedFees, setComputedFees] = useState(null)
  const [computingFees, setComputingFees] = useState(false)
  const [result, setResult] = useState(null)

  // Step 0: Search PIS
  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 2) {
      message.warning('Enter at least 2 characters to search')
      return
    }
    try {
      setSearching(true)
      const res = await get('/api/business/walk-in/search-pis', { q: searchQuery })
      setSearchResults(res?.data || [])
    } catch (err) {
      notifyError(err, 'Search failed')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const selectUser = useCallback((user) => {
    setSelectedUser(user)
    // Pre-fill form with user data
    form.setFieldsValue({
      ownerFullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      emailAddress: user.email || '',
      mobileNumber: user.phoneNumber || '',
    })
    setCurrentStep(2) // Skip PIS creation, go to unified form
  }, [form])

  const createNewPis = useCallback(() => {
    setSelectedUser(null)
    setCurrentStep(1)
  }, [])

  // Step 1: Create PIS
  const handlePisSave = useCallback(async () => {
    try {
      const values = await pisForm.validateFields()
      // PIS creation would call auth service — for now store locally
      setSelectedUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        isNew: true,
        pisData: values,
      })
      form.setFieldsValue({
        ownerFullName: `${values.firstName} ${values.lastName}`,
        emailAddress: values.email,
        mobileNumber: values.phoneNumber,
      })
      setCurrentStep(2)
    } catch (err) {
      if (err?.errorFields) {
        notifyError(err, 'Please fill in all required PIS fields')
      }
    }
  }, [pisForm, form])

  // Step 3: Compute fees
  const handleComputeFees = useCallback(async () => {
    try {
      setComputingFees(true)
      const activities = form.getFieldValue('businessActivities') || []
      const res = await post('/api/business/walk-in/temp/compute-fees', { businessActivities: activities })
      setComputedFees(res?.data || { total: 0 })
    } catch (err) {
      // Fallback: compute locally
      const activities = form.getFieldValue('businessActivities') || []
      const total = activities.reduce((sum, a) => sum + (a.grossSales || 0) * 0.01, 0)
      setComputedFees({
        mayorsPermitFee: 500,
        businessTax: Math.round(total),
        total: 500 + Math.round(total),
        note: 'Estimated (fee service unavailable)',
      })
    } finally {
      setComputingFees(false)
    }
  }, [form])

  // Step 4: Submit & Generate Permit
  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true)
      const formValues = form.getFieldsValue(true)
      const payload = {
        applicantUserId: selectedUser?._id || null,
        pisData: selectedUser?.pisData || null,
        businessData: formValues,
        businessActivities: formValues.businessActivities || [],
        draft: false,
      }
      const res = await post('/api/business/walk-in', payload)
      setResult(res?.data || { applicationId: 'N/A' })
      setCurrentStep(4)
    } catch (err) {
      notifyError(err, 'Failed to submit walk-in application')
    } finally {
      setSubmitting(false)
    }
  }, [form, selectedUser])

  const steps = [
    { title: 'Search PIS', icon: <SearchOutlined /> },
    { title: 'Create PIS', icon: <UserAddOutlined /> },
    { title: 'Unified Form', icon: <FormOutlined /> },
    { title: 'Fees', icon: <DollarOutlined /> },
    { title: 'Permit', icon: <PrinterOutlined /> },
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="Search Existing PIS Record">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Input.Search
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                enterButton="Search"
                loading={searching}
                size="large"
              />
              {searchResults.length > 0 ? (
                <Table
                  aria-label="PIS search results"
                  dataSource={searchResults}
                  rowKey={(r) => r._id || r.email}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: 'Name', render: (_, r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email },
                    { title: 'Email', dataIndex: 'email' },
                    { title: 'Phone', dataIndex: 'phoneNumber' },
                    {
                      title: 'Action',
                      render: (_, r) => (
                        <Button type="primary" size="small" onClick={() => selectUser(r)}>
                          Select
                        </Button>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              ) : searching ? null : (
                <Empty description="No results. Search for an existing record or create a new PIS." />
              )}
              <Divider />
              <Button type="dashed" icon={<UserAddOutlined />} onClick={createNewPis} block>
                Create New PIS Record (Walk-in)
              </Button>
            </Space>
          </Card>
        )

      case 1:
        return (
          <Card title="Create PIS Record">
            <Form form={pisForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                    <Input placeholder="First name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                    <Input placeholder="Last name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name="phoneNumber" label="Phone" rules={[{ required: true }]}>
                    <Input placeholder="09xxxxxxxxx" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="nationality" label="Nationality">
                    <Input placeholder="Filipino" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="maritalStatus" label="Marital Status">
                    <Select placeholder="Select">
                      <Select.Option value="single">Single</Select.Option>
                      <Select.Option value="married">Married</Select.Option>
                      <Select.Option value="widowed">Widowed</Select.Option>
                      <Select.Option value="divorced">Divorced</Select.Option>
                      <Select.Option value="separated">Separated</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" onClick={handlePisSave}>
                Save PIS & Continue to Form
              </Button>
            </Form>
          </Card>
        )

      case 2:
        return (
          <div>
            {selectedUser && (
              <Alert
                type="info"
                message={`Filling form for: ${selectedUser.firstName || ''} ${selectedUser.lastName || ''} (${selectedUser.email || 'N/A'})`}
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}
            <Form form={form} layout="vertical">
              <Step1ApplicationType form={form} />
              <div style={{ marginTop: 24 }} />
              <Step2TaxpayerInfo form={form} />
              <div style={{ marginTop: 24 }} />
              <Step3Addresses form={form} />
              <div style={{ marginTop: 24 }} />
              <Step4BusinessActivities form={form} />
              <div style={{ marginTop: 24 }} />
              <Step5Capital form={form} />
              <div style={{ marginTop: 24 }} />
              <Step6Accreditations form={form} />
            </Form>
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type="primary" size="large" onClick={() => { handleComputeFees(); setCurrentStep(3) }}>
                Compute Fees
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <Card title="Computed Fees">
            {computingFees ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin tip="Computing fees...">
                <div style={{ minHeight: 48 }} />
              </Spin>
            </div>
            ) : computedFees ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Mayor's Permit Fee">
                    ₱{(computedFees.mayorsPermitFee || 0).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Tax">
                    ₱{(computedFees.businessTax || 0).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total">
                    <Text strong style={{ fontSize: 18 }}>₱{(computedFees.total || 0).toLocaleString()}</Text>
                  </Descriptions.Item>
                </Descriptions>
                {computedFees.note && <Alert type="warning" message={computedFees.note} />}
                <div style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setCurrentStep(2)}>Back to Form</Button>
                    <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
                      Submit & Generate Permit
                    </Button>
                  </Space>
                </div>
              </Space>
            ) : (
              <Empty description="No fees computed yet" />
            )}
          </Card>
        )

      case 4:
        return (
          <Result
            status="success"
            title="Walk-in Application Submitted"
            subTitle={`Reference: ${result?.applicationId || 'N/A'} | Business ID: ${result?.businessId || 'N/A'}`}
            extra={[
              <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                Print Permit
              </Button>,
              <Button key="new" onClick={() => {
                setCurrentStep(0)
                setResult(null)
                setComputedFees(null)
                setSelectedUser(null)
                setSearchResults([])
                setSearchQuery('')
                form.resetFields()
                pisForm.resetFields()
              }}>
                New Application
              </Button>,
            ]}
          />
        )

      default:
        return null
    }
  }

  return (
    <StaffLayout>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <Title level={3}>Walk-in Application</Title>
        <Paragraph type="secondary">
          Process a business permit application for a walk-in applicant.
        </Paragraph>

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
          size="small"
          direction={screens.md ? 'horizontal' : 'vertical'}
        />

        {renderStepContent()}
      </div>
    </StaffLayout>
  )
}
