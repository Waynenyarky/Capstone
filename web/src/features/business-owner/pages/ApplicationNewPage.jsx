import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form } from '@/shared/components/AppForm'
import { Typography, Button, Card, Space, Alert, App, Input, Select, Upload, Checkbox, Row, Col, Modal } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { ArrowLeftOutlined, ShopOutlined, FileProtectOutlined, CheckCircleOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../components/shared/BusinessOwnerLayout'
import { addBusiness, submitBusinessApplication } from '../services/businessProfileService'

const { Title, Text } = Typography
const { Option } = Select

export default function ApplicationNewPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [businessCreated, setBusinessCreated] = useState(null)

  const handleBack = () => {
    navigate('/owner')
  }

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      let businessId = businessCreated?.businessId || businessCreated?._id

      if (!businessId) {
        const result = await addBusiness(values)
        businessId = result.businessId || result._id
        setBusinessCreated(result)
      }

      await submitBusinessApplication(businessId)
      message.success('Application submitted successfully!')
      navigate('/owner')
    } catch (error) {
      message.error(error.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BusinessOwnerLayout
      pageTitle="New Application"
      pageIcon={<FileProtectOutlined />}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              style={{ marginBottom: 16 }}
              data-testid="back-button"
            >
              Back to Dashboard
            </Button>
            <Title level={3} data-testid="application-form-title">
              <ShopOutlined style={{ marginRight: 8 }} />
              Business Permit Application
            </Title>
            <Text type="secondary">
              Fill in all required information to apply for a new business permit.
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            data-testid="business-application-form"
          >
            <Card title="Business Information" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="businessName"
                    label="Business Name"
                    rules={[{ required: true, message: 'Please enter business name' }]}
                  >
                    <Input 
                      placeholder="Enter your business name"
                      data-testid="business-name-input"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="businessType"
                    label="Business Type"
                    rules={[{ required: true, message: 'Please select business type' }]}
                  >
                    <Select 
                      placeholder="Select business type"
                      data-testid="business-type-select"
                    >
                      <Option value="Restaurant">Restaurant</Option>
                      <Option value="Retail">Retail Store</Option>
                      <Option value="Service">Service Center</Option>
                      <Option value="E-commerce">E-commerce</Option>
                      <Option value="Manufacturing">Manufacturing</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lineOfBusiness"
                    label="Line of Business"
                    rules={[{ required: true, message: 'Please select line of business' }]}
                  >
                    <Select 
                      placeholder="Select line of business"
                      data-testid="line-of-business-select"
                    >
                      <Option value="Food Service">Food Service</Option>
                      <Option value="Retail Trade">Retail Trade</Option>
                      <Option value="Professional Services">Professional Services</Option>
                      <Option value="Manufacturing">Manufacturing</Option>
                      <Option value="Wholesale">Wholesale</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="businessAddress"
                label="Business Address"
                rules={[{ required: true, message: 'Please enter business address' }]}
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Enter complete business address"
                  data-testid="business-address-input"
                />
              </Form.Item>
            </Card>

            <Card title="Owner Information" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ownerName"
                    label="Owner Name"
                    rules={[{ required: true, message: 'Please enter owner name' }]}
                  >
                    <Input 
                      placeholder="Enter owner full name"
                      data-testid="owner-name-input"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ownerEmail"
                    label="Owner Email"
                    rules={[
                      { required: true, message: 'Please enter owner email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input 
                      placeholder="Enter owner email"
                      data-testid="owner-email-input"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="ownerPhone"
                label="Owner Phone"
                rules={[{ required: true, message: 'Please enter owner phone' }]}
              >
                <Input 
                  placeholder="Enter owner phone number"
                  data-testid="owner-phone-input"
                />
              </Form.Item>
            </Card>

            <Card title="Required Documents" style={{ marginBottom: 24 }}>
              <Alert
                message="Document Upload"
                description="Please upload all required documents. Files must be in PDF format and under 10MB."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item
                name="documents"
                label="Business Permit Documents"
                rules={[{ required: true, message: 'Please upload required documents' }]}
              >
                <Upload
                  accept=".pdf"
                  multiple
                  beforeUpload={() => false}
                  data-testid="document-upload-input"
                >
                  <Button icon={<UploadOutlined />} data-testid="upload-button">
                    Upload Documents
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="dtiRegistration"
                valuePropName="checked"
              >
                <Checkbox data-testid="dti-checkbox">
                  I have DTI/SEC registration
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="barangayClearance"
                valuePropName="checked"
              >
                <Checkbox data-testid="barangay-checkbox">
                  I have Barangay Clearance
                </Checkbox>
              </Form.Item>
            </Card>

            <Form.Item>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  data-testid="submit-application-button"
                  onClick={() => {
                    Modal.confirm({
                      title: 'Confirm Application Submission',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Are you sure you want to submit this business permit application? This action cannot be undone.',
                      okText: 'Yes, Submit',
                      cancelText: 'Cancel',
                      onOk: () => form.submit()
                    })
                  }}
                >
                  <CheckCircleOutlined /> Submit Application
                </Button>
                <Button onClick={handleBack} size="large">
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {submitting && (
            <div style={{ textAlign: 'center', padding: 24 }} data-testid="submitting-indicator">
              <LottieSpinner size="large" />
              <p>Submitting your application...</p>
            </div>
          )}
        </Card>
      </div>
    </BusinessOwnerLayout>
  )
}
