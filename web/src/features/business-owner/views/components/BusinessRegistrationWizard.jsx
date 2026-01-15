import React, { useState, useEffect } from 'react'
import { Steps, Form, Input, Button, DatePicker, Select, Upload, Checkbox, Card, Typography, Row, Col, Spin, Alert, theme, Tabs, Space, Divider, Tooltip } from 'antd'
import { UploadOutlined, SafetyCertificateOutlined, IdcardOutlined, MobileOutlined, FileTextOutlined, CheckCircleOutlined, UserOutlined, LockOutlined, SecurityScanOutlined, CopyOutlined } from '@ant-design/icons'
import { useBusinessRegistration } from '../../hooks/useBusinessRegistration'
import { useAuthSession } from '@/features/authentication'
import { useMfaSetup } from '@/features/authentication/hooks'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import PasskeyStatusCard from '@/features/authentication/presentation/passkey/components/PasskeyStatusCard'
import PasskeyList from '@/features/authentication/presentation/passkey/components/PasskeyList'
import QrDisplay from '@/features/authentication/views/components/QrDisplay'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

// MFA Step Component
function MfaStepContent({ onMfaStatusChange }) {
  const { currentUser } = useAuthSession()
  const { token } = theme.useToken()
  const [activeTab, setActiveTab] = useState('passkey')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [passkeyEnabled, setPasskeyEnabled] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // MFA hooks
  const {
    loading: totpLoading,
    qrDataUrl,
    secret,
    code,
    setCode,
    enabled: totpEnabled,
    handleSetup: handleTotpSetup,
    handleVerify: handleTotpVerify,
    showSecret,
    toggleShowSecret,
    confirmedSaved,
    setConfirmedSaved,
    handleCopy,
  } = useMfaSetup()

  const {
    credentials,
    loading: passkeyLoading,
    registering,
    hasPasskeys,
    handleRegister: handlePasskeyRegister,
  } = usePasskeyManager()

  // Check MFA status on mount and when credentials change
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!currentUser?.email) {
        setLoadingStatus(false)
        return
      }

      try {
        // Check TOTP status
        const totpStatus = await mfaStatus(currentUser.email)
        setMfaEnabled(!!totpStatus?.enabled)

        // Check passkey status from credentials
        setPasskeyEnabled(credentials.length > 0)
      } catch (err) {
        console.error('Failed to check MFA status:', err)
      } finally {
        setLoadingStatus(false)
      }
    }

    checkMfaStatus()
  }, [currentUser?.email, credentials.length])

  const handleTotpSetupClick = async () => {
    await handleTotpSetup()
  }

  const handleTotpVerifyClick = async () => {
    const success = await handleTotpVerify()
    if (success) {
      setMfaEnabled(true)
    }
  }

  const handlePasskeyRegisterClick = async () => {
    await handlePasskeyRegister()
    // Passkey status will update via credentials change in useEffect
  }

  // Update passkey status when credentials change
  useEffect(() => {
    setPasskeyEnabled(credentials.length > 0)
  }, [credentials.length])

  const isMfaComplete = mfaEnabled || passkeyEnabled

  // Notify parent component of MFA status changes
  useEffect(() => {
    if (onMfaStatusChange) {
      onMfaStatusChange(isMfaComplete)
    }
  }, [isMfaComplete, onMfaStatusChange])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <SecurityScanOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8, color: '#001529' }}>Secure Your Account</Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Set up multi-factor authentication to add an extra layer of security to your account. You can choose Passkey Authentication, Two-Factor Authentication (TOTP), or both. <strong>Register at least one method to proceed with "Next Step", or use "Skip" to continue without MFA.</strong>
        </Typography.Paragraph>
      </div>

      {isMfaComplete && (
        <Alert
          message="Security Setup Complete"
          description="You have successfully set up multi-factor authentication. You can proceed to the next step."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'passkey',
            label: (
              <Space>
                <SafetyCertificateOutlined />
                <span>Passkey Authentication</span>
                {passkeyEnabled && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </Space>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>Passkey Authentication</Title>
                  <Typography.Paragraph type="secondary">
                    Use your device's biometric authentication (fingerprint, face recognition) or a security key to sign in securely without passwords.
                  </Typography.Paragraph>
                </div>

                {loadingStatus || passkeyLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                  </div>
                ) : passkeyEnabled ? (
                  <div>
                    <Alert
                      message="Passkey Authentication Enabled"
                      description={`You have ${credentials.length} passkey${credentials.length !== 1 ? 's' : ''} registered.`}
                      type="success"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    <PasskeyList
                      credentials={credentials}
                      onDelete={() => {}}
                      loading={passkeyLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <PasskeyStatusCard
                      hasPasskeys={false}
                      credentialsCount={0}
                      onRegister={handlePasskeyRegisterClick}
                      onDisable={() => {}}
                      deleting={false}
                      registering={registering}
                      loading={passkeyLoading}
                    />
                    <div style={{ marginTop: 24 }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<SafetyCertificateOutlined />}
                        onClick={handlePasskeyRegisterClick}
                        loading={registering}
                        block
                      >
                        Register Passkey
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'totp',
            label: (
              <Space>
                <MobileOutlined />
                <span>Two-Factor Authentication (TOTP)</span>
                {totpEnabled && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </Space>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>Two-Factor Authentication (TOTP)</Title>
                  <Typography.Paragraph type="secondary">
                    Use an authenticator app like Google Authenticator or Authy to generate verification codes for secure sign-in.
                  </Typography.Paragraph>
                </div>

                {totpEnabled ? (
                  <Alert
                    message="Two-Factor Authentication Enabled"
                    description="Your account is protected with TOTP authentication. You will need to enter a verification code when signing in."
                    type="success"
                    showIcon
                  />
                ) : secret ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Title level={5}>Scan QR Code</Title>
                      <Typography.Paragraph type="secondary">
                        Open your authenticator app and scan this code:
                      </Typography.Paragraph>
                      <div style={{ 
                        background: '#fff', 
                        padding: 24, 
                        borderRadius: 16, 
                        display: 'inline-block',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        marginTop: 16
                      }}>
                        {qrDataUrl ? (
                          <QrDisplay dataUrl={qrDataUrl} size={200} />
                        ) : (
                          <Spin size="large" />
                        )}
                      </div>
                    </div>

                    {showSecret && (
                      <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                          Or enter this secret key manually:
                        </Typography.Text>
                        <Input.Group compact>
                          <Input
                            value={secret}
                            readOnly
                            style={{ width: 'calc(100% - 80px)' }}
                          />
                          <Button icon={<CopyOutlined />} onClick={handleCopy}>
                            Copy
                          </Button>
                        </Input.Group>
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <Checkbox
                        checked={confirmedSaved}
                        onChange={(e) => setConfirmedSaved(e.target.checked)}
                      >
                        I have saved the secret key and scanned the QR code
                      </Checkbox>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Enter Verification Code
                      </Typography.Text>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        style={{ fontSize: 20, textAlign: 'center', letterSpacing: 8 }}
                      />
                    </div>

                    <Space>
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleTotpVerifyClick}
                        disabled={!code || code.length !== 6 || !confirmedSaved}
                        loading={totpLoading}
                      >
                        Verify & Enable
                      </Button>
                      <Button
                        onClick={toggleShowSecret}
                      >
                        {showSecret ? 'Hide' : 'Show'} Secret Key
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <LockOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
                      Click the button below to generate a QR code for your authenticator app.
                    </Typography.Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SecurityScanOutlined />}
                      onClick={handleTotpSetupClick}
                      loading={totpLoading}
                    >
                      Start TOTP Setup
                    </Button>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {isMfaComplete && (
        <Alert
          message="Ready to Continue"
          description="You have set up at least one authentication method. You can proceed to the next step."
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      )}

      {!isMfaComplete && (
        <Alert
          message="MFA Setup Required for Next Step"
          description="To proceed with 'Next Step', please register at least one authentication method (Passkey or TOTP). Alternatively, you can use the 'Skip' button to continue without MFA setup and configure it later from your account settings."
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      )}
    </div>
  )
}

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
  const { token } = theme.useToken()
  const [mfaComplete, setMfaComplete] = useState(false)

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div style={{ padding: '40px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <SafetyCertificateOutlined style={{ fontSize: 56, color: token.colorPrimary, marginBottom: 24, filter: `drop-shadow(0 4px 6px ${token.colorPrimary}33)` }} />
              <Title level={2} style={{ color: token.colorTextHeading, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome to BizClear Registration</Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: '1.6' }}>
                Complete your registration efficiently and securely in just a few steps.
              </Typography.Paragraph>
            </div>

            <Alert
              message={<span style={{ fontWeight: 600 }}>Before you start</span>}
              description="Please ensure you have the following documents ready to complete the registration process."
              type="info"
              showIcon
              style={{ marginBottom: 40, borderRadius: 8, border: `1px solid ${token.colorInfoBg}`, background: token.colorInfoBg }}
            />

            <Row gutter={[32, 32]}>
              <Col xs={24} md={8}>
                <Card 
                  hoverable 
                  variant="borderless"
                  style={{ height: '100%', borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}`, transition: 'all 0.3s' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                >
                  <div style={{ 
                    marginBottom: 24, 
                    background: token.colorBgContainer, 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    border: `1px solid ${token.colorBorder}`
                  }}>
                    <IdcardOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
                  </div>
                  <Title level={5} style={{ marginBottom: 12, color: token.colorTextHeading, fontWeight: 600 }}>Valid Government ID</Title>
                  <Typography.Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                    Driver's License, Passport, SSS, or other valid government-issued IDs.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card 
                  hoverable 
                  variant="borderless"
                  style={{ height: '100%', borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}`, transition: 'all 0.3s' }}
                  styles={{ body: { padding: 32, textAlign: 'center' } }}
                >
                  <div style={{ 
                    marginBottom: 24, 
                    background: token.colorBgContainer, 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    border: `1px solid ${token.colorBorder}`
                  }}>
                    <FileTextOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
                  </div>
                  <Title level={5} style={{ marginBottom: 12, color: token.colorTextHeading, fontWeight: 600 }}>Digital Documents</Title>
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

      case 2: // MFA Setup
        return <MfaStepContent onMfaStatusChange={setMfaComplete} />
        
      case 3: // Legal Consent (Moved from Step 2)
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
              <Button size="large" onClick={handlePrev}>
                Previous
              </Button>
            )}
            {currentStep === 2 && (
              <Button 
                size="large" 
                onClick={handleNext}
                loading={loading}
              >
                Skip
              </Button>
            )}
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large"
              disabled={currentStep === 2 && !mfaComplete}
              style={{ 
                minWidth: 120,
                background: currentStep === 2 && !mfaComplete ? '#d9d9d9' : '#001529',
                borderColor: currentStep === 2 && !mfaComplete ? '#d9d9d9' : '#001529'
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
