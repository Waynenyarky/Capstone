import React, { useState, useEffect } from 'react'
import { Steps, Form, Input, Button, DatePicker, Select, Upload, Checkbox, Card, Typography, message, Row, Col, Spin } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getBusinessProfile, updateBusinessProfile } from '../services/businessProfileService'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const steps = [
  { key: 'account', title: 'Account', description: 'Verified' },
  { key: 'identity', title: 'Identity', description: 'Owner' },
  { key: 'registration', title: 'Registration', description: 'Business' },
  { key: 'location', title: 'Location', description: 'Address' },
  { key: 'compliance', title: 'Compliance', description: 'Permits' },
  { key: 'profile', title: 'Risk Profile', description: 'Details' },
  { key: 'notify', title: 'Notifications', description: 'Alerts' },
  { key: 'consent', title: 'Consent', description: 'Legal' },
]

export default function BusinessRegistrationWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1) 
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProfile()
  }, [])

  // Populate form when step or data changes
  useEffect(() => {
    // Ensure we don't get stuck on step 0 (Account) if backend returns 1
    if (currentStep === 0) {
      setCurrentStep(1)
      return
    }

    if (!profileData) return
    
    // Map current step index to data key
    const stepKeys = [
      null, 
      'ownerIdentity', 
      'businessRegistration', 
      'location', 
      'compliance', 
      'profileDetails', 
      'notifications', 
      'consent'
    ]
    
    const key = stepKeys[currentStep]
    if (key && profileData[key]) {
      const data = { ...profileData[key] }
      
      // Handle Date conversions
      if (data.dateOfBirth) {
        const date = dayjs(data.dateOfBirth)
        data.dateOfBirth = date.isValid() ? date : null
      }

      // Handle File URLs -> FileList for Upload components
      const fileFields = ['idFileUrl', 'registrationFileUrl']
      fileFields.forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
          data[field] = [{
            uid: '-1',
            name: 'Uploaded Document',
            status: 'done',
            url: data[field]
          }]
        }
      })
      
      form.setFieldsValue(data)
    } else {
      form.resetFields()
    }
  }, [currentStep, profileData, form])

  const fetchProfile = async () => {
    try {
      setFetching(true)
      const data = await getBusinessProfile()
      if (data) {
        setProfileData(data)
        // Map backend step (2-8) to UI step index. Default 2 -> Index 1 (Identity)
        const stepIndex = (data.currentStep || 2) - 1
        setCurrentStep(stepIndex >= 0 ? stepIndex : 1)
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load profile')
    } finally {
      setFetching(false)
    }
  }

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // Normalize file uploads (Convert FileList back to URL string)
      const fileFields = ['idFileUrl', 'registrationFileUrl']
      fileFields.forEach(field => {
        const val = values[field]
        if (Array.isArray(val)) {
          if (val.length > 0) {
            const file = val[0]
            // If new upload, use response url. If existing, use url.
            values[field] = file.response?.url || file.url || ''
          } else {
            values[field] = ''
          }
        }
      })
      
      const stepNumber = currentStep + 1
      const updated = await updateBusinessProfile(stepNumber, values)
      
      if (updated) {
        setProfileData(updated)
        
        if (currentStep < steps.length - 1) {
          const nextStep = currentStep + 1
          setCurrentStep(nextStep)
          window.scrollTo(0, 0)
        } else {
          message.success('Registration submitted successfully!')
          if (onComplete) onComplete()
        }
      }
    } catch (err) {
      console.error(err)
      // Only show error if it's not a validation error
      if (!err.errorFields) {
        message.error('Failed to save step. Please check fields.')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Account Creation (Should handle redirect or show summary)
        return <div style={{ textAlign: 'center' }}>Account Created Successfully. Click Next to proceed.</div>
      
      case 1: // Owner Identity
        return (
          <>
            <Title level={4}>Owner Identity Information</Title>
            <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
              <Input placeholder="As per valid ID" />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="idType" label="ID Type" rules={[{ required: true }]}>
              <Select>
                <Option value="passport">Passport</Option>
                <Option value="driver_license">Driver's License</Option>
                <Option value="umid">UMID</Option>
                <Option value="prc">PRC ID</Option>
                <Option value="national_id">National ID</Option>
              </Select>
            </Form.Item>
            <Form.Item name="idNumber" label="ID Number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="idFileUrl" label="Upload ID" valuePropName="fileList" getValueFromEvent={(e) => e && e.fileList}>
              <Upload name="idFile" action="/api/upload" listType="picture">
                <Button icon={<UploadOutlined />}>Click to upload (Front/Back)</Button>
              </Upload>
            </Form.Item>
          </>
        )

      case 2: // Business Registration
        return (
          <>
            <Title level={4}>Business Registration Information</Title>
            <Form.Item name="registeredName" label="Registered Business Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="tradeName" label="Trade Name">
              <Input placeholder="If different from registered name" />
            </Form.Item>
            <Form.Item name="businessType" label="Business Type" rules={[{ required: true }]}>
              <Select>
                <Option value="sole_proprietorship">Sole Proprietorship</Option>
                <Option value="partnership">Partnership</Option>
                <Option value="corporation">Corporation</Option>
              </Select>
            </Form.Item>
            <Form.Item name="registrationAgency" label="Registration Agency" rules={[{ required: true }]}>
              <Select>
                <Option value="dti">DTI</Option>
                <Option value="sec">SEC</Option>
                <Option value="cda">CDA</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="registrationNumber" 
              label="Registration Number" 
              rules={[
                { required: true },
                { pattern: /^[A-Z0-9-]+$/i, message: 'Invalid format (Alphanumeric and hyphens only)' }
              ]}
            >
              <Input placeholder="e.g. 123-456-789" />
            </Form.Item>
             <Form.Item name="registrationFileUrl" label="Certificate Upload" valuePropName="fileList" getValueFromEvent={(e) => e && e.fileList}>
              <Upload name="regFile" action="/api/upload" listType="picture">
                <Button icon={<UploadOutlined />}>Upload Certificate</Button>
              </Upload>
            </Form.Item>
          </>
        )

      case 3: // Location
        return (
          <>
            <Title level={4}>Business Location & Classification</Title>
            <Form.Item name="address" label="Business Address" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="region" label="Region" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="province" label="Province" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="city" label="City/Municipality" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="barangay" label="Barangay" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Title level={5}>GPS Coordinates</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['gps', 'lat']} label="Latitude">
                  <Input type="number" step="any" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['gps', 'lng']} label="Longitude">
                  <Input type="number" step="any" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="natureOfBusiness" label="Nature of Business" rules={[{ required: true }]}>
              <Input placeholder="Primary + Secondary" />
            </Form.Item>
            <Form.Item name="riskCategory" label="Business Category (Risk)" rules={[{ required: true }]}>
              <Select>
                <Option value="low">Low Risk</Option>
                <Option value="medium">Medium Risk</Option>
                <Option value="high">High Risk</Option>
              </Select>
            </Form.Item>
          </>
        )

      case 4: // Compliance
        const renderComplianceField = (name, label) => (
          <Form.Item label={label} style={{ marginBottom: 0 }}>
            <Form.Item
              name={name}
              rules={[{ required: true, message: 'Please enter value or check To Be Submitted' }]}
              style={{ display: 'inline-block', width: 'calc(100% - 150px)' }}
            >
              <Input placeholder="Enter Permit Number" />
            </Form.Item>
            <Form.Item
              style={{ display: 'inline-block', width: '150px', marginLeft: '8px' }}
            >
               <Checkbox onChange={(e) => {
                 if (e.target.checked) form.setFieldsValue({ [name]: 'To Be Submitted' })
                 else form.setFieldsValue({ [name]: '' })
               }}>To Be Submitted</Checkbox>
            </Form.Item>
          </Form.Item>
        )

        return (
          <>
            <Title level={4}>Tax & Local Compliance Info</Title>
            <Form.Item name="tin" label="Tax Identification Number (TIN)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            
            {renderComplianceField('barangayClearance', 'Barangay Clearance No.')}
            {renderComplianceField('mayorsPermit', "Mayor's Permit (Renewals)")}
            {renderComplianceField('fireSafetyCert', 'Fire Safety Certificate')}
            {renderComplianceField('sanitaryPermit', 'Sanitary Permit')}
            
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              Note: You may mark permits as "To Be Submitted", but final approval will be blocked until valid permits are uploaded.
            </Typography.Text>
          </>
        )

      case 5: // Profile Details
        return (
          <>
            <Title level={4}>Business Profile & Risk Assessment</Title>
            <Form.Item name="operatingHours" label="Operating Days & Hours">
              <Input placeholder="e.g. Mon-Fri 8am-5pm" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="numberOfEmployees" label="No. of Employees">
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="floorArea" label="Floor Area (sqm)">
                  <Input type="number" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="equipment" label="Equipment / Machinery Used">
              <TextArea rows={3} placeholder="List major equipment..." />
            </Form.Item>
            
            <Card type="inner" title="Hazard Declaration" size="small" style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
              <Form.Item name="hasHazards" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox style={{ fontWeight: 600 }}>
                  Does your business involve hazardous materials, flammable substances, or high-risk activities?
                </Checkbox>
              </Form.Item>
            </Card>
          </>
        )

      case 6: // Notifications
        return (
          <>
            <Title level={4}>Notifications & Communication</Title>
            <Form.Item name="email" valuePropName="checked" label="Email Notifications">
               <Checkbox>Receive alerts via Email</Checkbox>
            </Form.Item>
            <Form.Item name="sms" valuePropName="checked" label="SMS Notifications">
               <Checkbox>Receive alerts via SMS</Checkbox>
            </Form.Item>
            <Form.Item name="inApp" valuePropName="checked" label="In-App Notifications">
               <Checkbox>Receive In-App Alerts</Checkbox>
            </Form.Item>
          </>
        )

      case 7: // Consent
        return (
          <>
            <Title level={4}>Legal Consent & Final Submission</Title>
            <Form.Item name="termsAccepted" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('Must accept terms') }]}>
              <Checkbox>I accept the Terms & Conditions</Checkbox>
            </Form.Item>
            <Form.Item name="privacyAccepted" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('Must accept privacy policy') }]}>
              <Checkbox>I accept the Privacy Policy (Data Privacy Act)</Checkbox>
            </Form.Item>
            <Form.Item name="digitalInspectionConsent" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('Must consent to inspections') }]}>
              <Checkbox>I consent to Digital Inspections & Records</Checkbox>
            </Form.Item>
          </>
        )
        
      default:
        // Fallback for unknown steps
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <Typography.Text type="secondary">Step content not found. Please click Next or Previous.</Typography.Text>
            </div>
        )
    }
  }

  return (
    <Card variant="borderless" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 40, overflowX: 'auto', paddingBottom: 10 }}>
        <Steps 
          current={currentStep} 
          items={steps.map(s => ({ title: s.title, description: s.description }))}
          size="small"
          labelPlacement="vertical"
          onChange={(step) => {
            // Allow navigating to previous steps or current step
            if (step < currentStep && step > 0) {
              setCurrentStep(step)
            }
          }}
        />
      </div>
      
      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          key={currentStep} // Force re-render on step change to avoid stale fields
          form={form}
          layout="vertical"
          onFinish={handleNext}
        >
          <div style={{ minHeight: 300 }}>
            {renderStepContent()}
          </div>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
             {currentStep > 1 && (
              <Button style={{ margin: '0 8px' }} onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={loading}>
              {currentStep === steps.length - 1 ? 'Submit Registration' : 'Next'}
            </Button>
          </div>
        </Form>
      )}
    </Card>
  )
}
