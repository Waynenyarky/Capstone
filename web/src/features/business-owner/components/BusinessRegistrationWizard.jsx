import React from 'react'
import { Steps, Form, Input, Button, DatePicker, Select, Upload, Checkbox, Card, Typography, Row, Col, Spin, Alert } from 'antd'
import { UploadOutlined, SafetyCertificateOutlined, IdcardOutlined, MobileOutlined, FileTextOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useBusinessRegistration } from '../hooks/useBusinessRegistration'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

export default function BusinessRegistrationWizard({ onComplete }) {
  const {
    currentStep,
    steps,
    loading,
    fetching,
    form,
    idFileUrl,
    idFileBackUrl,
    handleNext,
    handlePrev,
    handleStepClick
  } = useBusinessRegistration({ onComplete })

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div style={{ padding: '40px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <SafetyCertificateOutlined style={{ fontSize: 56, color: '#1890ff', marginBottom: 24, filter: 'drop-shadow(0 4px 6px rgba(24, 144, 255, 0.2))' }} />
              <Title level={2} style={{ color: '#001529', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome to BizClear Registration</Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: '1.6' }}>
                Complete your registration efficiently and securely in just a few steps.
              </Typography.Paragraph>
            </div>

            <Alert
              message={<span style={{ fontWeight: 600 }}>Before you start</span>}
              description="Please ensure you have the following documents ready to complete the registration process."
              type="info"
              showIcon
              style={{ marginBottom: 40, borderRadius: 8, border: '1px solid #bae7ff', background: '#e6f7ff' }}
            />

            <Row gutter={[32, 32]}>
              <Col xs={24} md={8}>
                <Card 
                  hoverable 
                  variant="borderless"
                  style={{ height: '100%', borderRadius: 16, border: '1px solid #f0f0f0', transition: 'all 0.3s' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                >
                  <div style={{ 
                    marginBottom: 24, 
                    background: '#ffffff', 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #f5f5f5'
                  }}>
                    <IdcardOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                  </div>
                  <Title level={5} style={{ marginBottom: 12, color: '#001529', fontWeight: 600 }}>Valid Government ID</Title>
                  <Typography.Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                    Driver's License, Passport, SSS, or other valid government-issued IDs.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card 
                  hoverable 
                  variant="borderless"
                  style={{ height: '100%', borderRadius: 16, border: '1px solid #f0f0f0', transition: 'all 0.3s' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                >
                  <div style={{ 
                    marginBottom: 24, 
                    background: '#ffffff', 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #f5f5f5'
                  }}>
                    <FileTextOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                  </div>
                  <Title level={5} style={{ marginBottom: 12, color: '#001529', fontWeight: 600 }}>Digital Documents</Title>
                  <Typography.Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                    Clear, readable digital copies (Front & Back) of your identification.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card 
                  hoverable 
                  variant="borderless"
                  style={{ height: '100%', borderRadius: 16, border: '1px solid #f0f0f0', transition: 'all 0.3s' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                >
                  <div style={{ 
                    marginBottom: 24, 
                    background: '#ffffff', 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #f5f5f5'
                  }}>
                    <UserOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                  </div>
                  <Title level={5} style={{ marginBottom: 12, color: '#001529', fontWeight: 600 }}>Personal Information</Title>
                  <Typography.Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                    Your full legal name, date of birth, and active mobile number.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 48, textAlign: 'center' }}>
               <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', padding: '10px 24px', borderRadius: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                 <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8, fontSize: 16 }} /> 
                 <Typography.Text strong style={{ color: '#595959' }}>Estimated time to complete: 5-10 minutes</Typography.Text>
               </div>
            </div>
          </div>
        )
      
      case 1: // Identity
        return (
          <>
            <Title level={3} style={{ marginBottom: 32, color: '#001529' }}>Identity Verification</Title>
            <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 8, marginBottom: 32 }}>
              <Title level={5} style={{ marginTop: 0 }}>Personal Information</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="First Name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="middleName" label="Middle Name" rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="Middle Name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="Last Name" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: 'Required' }]}>
                    <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" placeholder="Select Date" />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item name="mobileNumber" label="Mobile Number" rules={[
                    { required: true, message: 'Mobile number required' },
                    { pattern: /^[9]\d{9}$/, message: 'Please enter a valid mobile number starting with 9 (e.g., 9123456789)' }
                  ]}>
                     <Input prefix="+63" placeholder="9123456789" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 8 }}>
              <Title level={5} style={{ marginTop: 0 }}>Valid Identification</Title>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="idType" label="ID Type" rules={[{ required: true }]}>
                    <Select placeholder="Select ID Type">
                      <Option value="drivers_license">Driver's License</Option>
                      <Option value="passport">Passport</Option>
                      <Option value="sss_id">SSS ID</Option>
                      <Option value="umid">UMID</Option>
                      <Option value="prc_id">PRC ID</Option>
                      <Option value="philsys_id">PhilSys ID</Option>
                      <Option value="voters_id">Voter's ID</Option>
                      <Option value="postal_id">Postal ID</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="idNumber" label="ID Number" rules={[{ required: true }]}>
                    <Input placeholder="Enter ID Number" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item 
                    name="idFileUrl" 
                    label="Front of ID" 
                    valuePropName="fileList" 
                    getValueFromEvent={(e) => {
                      if (Array.isArray(e)) {
                        return e;
                      }
                      return e && e.fileList && e.fileList.slice(-1);
                    }}
                    rules={[{ required: true, message: 'Front ID is required' }]}
                  >
                    <Upload 
                      name="idFile" 
                      action="/api/upload" 
                      listType="picture-card" 
                      maxCount={1} 
                      accept=".pdf,.jpg,.jpeg,.png"
                      beforeUpload={() => false} 
                    >
                      {idFileUrl && idFileUrl.length >= 1 ? null : (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Upload Front</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="idFileBackUrl" 
                    label="Back of ID" 
                    valuePropName="fileList" 
                    getValueFromEvent={(e) => {
                      if (Array.isArray(e)) {
                        return e;
                      }
                      return e && e.fileList && e.fileList.slice(-1);
                    }}
                    rules={[{ required: true, message: 'Back ID is required' }]}
                  >
                    <Upload 
                      name="idFileBack" 
                      action="/api/upload" 
                      listType="picture-card" 
                      maxCount={1} 
                      accept=".pdf,.jpg,.jpeg,.png"
                      beforeUpload={() => false}
                    >
                      {idFileBackUrl && idFileBackUrl.length >= 1 ? null : (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Upload Back</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </>
        )

      case 2: // Legal Consent (Was Consent)
        return (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: 32, textAlign: 'center', color: '#001529' }}>Legal Consent</Title>
            <div style={{ background: '#f8f9fa', padding: 32, borderRadius: 8 }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={5}>1. Information Accuracy</Title>
                <Form.Item 
                  name="confirmTrueAndAccurate" 
                  valuePropName="checked" 
                  rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('You must confirm this to proceed') }]}
                >
                  <Checkbox style={{ lineHeight: '24px' }}>
                    I hereby confirm that all the information provided in this registration form is true, accurate, and complete to the best of my knowledge. I understand that any false statement may be grounds for rejection or legal action.
                  </Checkbox>
                </Form.Item>
              </div>

              <div style={{ marginBottom: 24 }}>
                <Title level={5}>2. Legal Disclaimers</Title>
                <Form.Item 
                  name="acceptLegalDisclaimers" 
                  valuePropName="checked" 
                  rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('You must accept this to proceed') }]}
                >
                  <Checkbox style={{ lineHeight: '24px' }}>
                    I accept all legal disclaimers associated with the use of this platform and agree to comply with all applicable local and national laws and regulations governing my business operations.
                  </Checkbox>
                </Form.Item>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Title level={5}>3. Privacy Policy</Title>
                <Form.Item 
                  name="acknowledgePrivacyPolicy" 
                  valuePropName="checked" 
                  rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('You must acknowledge this to proceed') }]}
                >
                  <Checkbox style={{ lineHeight: '24px' }}>
                    I acknowledge that I have read and understood the Privacy Policy. I consent to the collection, use, and processing of my personal and business data in accordance with the Data Privacy Act of 2012.
                  </Checkbox>
                </Form.Item>
              </div>
            </div>
          </div>
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
    <Card 
      variant="borderless" 
      style={{ 
        maxWidth: 900, 
        margin: '24px auto', 
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
      styles={{ body: { padding: '40px 48px' } }}
    >
      <div style={{ marginBottom: 48 }}>
        <Steps 
          current={currentStep} 
          size="default"
          labelPlacement="horizontal"
          onChange={(step) => {
            handleStepClick(step)
          }}
          items={steps.map(s => ({ 
            ...s, 
            status: currentStep === steps.indexOf(s) ? 'process' : (currentStep > steps.indexOf(s) ? 'finish' : 'wait') 
          }))}
        />
      </div>
      
      {fetching ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>Loading registration data...</div>
        </div>
      ) : (
        <Form
          key={currentStep} // Force re-render on step change to avoid stale fields
          form={form}
          layout="vertical"
          onFinish={handleNext}
          size="large"
          requiredMark="optional"
        >
          <div style={{ minHeight: 400 }}>
            {renderStepContent()}
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #f0f0f0', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
             {currentStep > 0 && (
              <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large"
              style={{ 
                minWidth: 120,
                background: '#001529',
                borderColor: '#001529'
              }}
            >
              {currentStep === 0 ? 'Get Started' : (currentStep === steps.length - 1 ? 'Submit Registration' : 'Next Step')}
            </Button>
          </div>
        </Form>
      )}
    </Card>
  )
}
