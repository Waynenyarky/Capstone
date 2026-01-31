import React, { useState, useEffect } from 'react'
import { Steps, Form, Input, Button, Select, Upload, Checkbox, Card, Typography, Row, Col, Spin, Alert, theme, Tabs, Space, Divider, Tooltip, Grid } from 'antd'
import { UploadOutlined, SafetyCertificateOutlined, MobileOutlined, FormOutlined, CheckCircleOutlined, LockOutlined, SecurityScanOutlined, CopyOutlined } from '@ant-design/icons'
import { useBusinessRegistration } from '../../hooks/useBusinessRegistration'
import { useAuthSession } from '@/features/authentication'
import { useMfaSetup } from '@/features/authentication/hooks'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import PasskeyStatusCard from '@/features/authentication/presentation/passkey/components/PasskeyStatusCard'
import PasskeyList from '@/features/authentication/presentation/passkey/components/PasskeyList'
import QrDisplay from '@/features/authentication/views/components/QrDisplay'
import IdVerificationStatus from './IdVerificationStatus'
import IdentityVerificationForm from './IdentityVerificationForm'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { useBreakpoint } = Grid
const { TextArea } = Input

// MFA Step Component
function MfaStepContent({ onMfaStatusChange }) {
  const { currentUser } = useAuthSession()
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
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
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center', color: '#001529' }}>Secure Your Account</Title>
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
    profileData,
    handleNext,
    handlePrev,
    handleStepClick,
    refreshProfile
  } = useBusinessRegistration({ onComplete })
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [mfaComplete, setMfaComplete] = useState(false)

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div style={{ padding: isMobile ? '24px 16px' : '40px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: `1px solid ${token.colorBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: token.colorPrimary
                }}
              >
                <FormOutlined style={{ fontSize: 32 }} />
              </div>
              <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center', color: token.colorTextHeading }}>
                Continue your registration
              </Title>
            </div>

            <Card
              variant="borderless"
              style={{
                maxWidth: 520,
                margin: '0 auto',
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorFillQuaternary
              }}
              styles={{ body: { padding: 24 } }}
            >
              <Title level={5} style={{ marginBottom: 16, color: token.colorTextHeading, fontWeight: 600 }}>
                What you&apos;ll need
              </Title>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  listStyleType: 'disc',
                  color: token.colorTextSecondary
                }}
              >
                <li style={{ padding: '4px 0' }}>Valid government-issued ID (Driver&apos;s License, Passport, SSS, etc.)</li>
                <li style={{ padding: '4px 0' }}>Front and back copies — PDF, JPG, or PNG only; max 5 MB per file</li>
                <li style={{ padding: '4px 0' }}>Clear, readable; no blur or glare; full document visible</li>
                <li style={{ padding: '4px 0' }}>ID must be valid (not expired)</li>
              </ul>
            </Card>
          </div>
        )
      
      case 1: // Identity
        return (
          <div>
            <IdentityVerificationForm
              form={form}
              profileData={profileData}
              refreshProfile={refreshProfile}
              isMobile={isMobile}
            />
          </div>
        )

      case 2: // MFA Setup
        return <MfaStepContent onMfaStatusChange={setMfaComplete} />
        
      case 3: // Legal Consent (Moved from Step 2)
        return (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center', color: '#001529' }}>Legal Consent</Title>
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
        margin: isMobile ? '0px' : '24px auto', 
        borderRadius: isMobile ? 0 : 8,
        boxShadow: isMobile ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
        background: isMobile ? 'transparent' : undefined,
      }}
      styles={{ body: { padding: isMobile ? '16px' : '40px 48px' } }}
    >
      {!isMobile && (
        <div className="business-registration-steps" style={{ marginBottom: 48, overflow: 'hidden' }}>
          <style>{`
            .business-registration-steps .ant-steps-item-finish .ant-steps-item-icon .anticon-check {
              color: #fff !important;
            }
            .business-registration-steps .ant-steps-item-finish .ant-steps-item-icon .anticon-check svg {
              fill: #fff;
            }
          `}</style>
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
      )}
      
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
          size="default"
          requiredMark="optional"
        >
          <div style={{ minHeight: 400, paddingBottom: isMobile ? 80 : 0 }}>
            {renderStepContent()}
          </div>

          <div style={{ 
            marginTop: isMobile ? 24 : 40, 
            paddingTop: isMobile ? 16 : 24, 
            paddingBottom: isMobile ? 16 : 0,
            paddingLeft: isMobile ? 16 : 0,
            paddingRight: isMobile ? 16 : 0,
            borderTop: '1px solid #f0f0f0', 
            textAlign: 'right', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            // Sticky footer on mobile
            ...(isMobile && {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
              zIndex: 100,
              margin: 0,
            })
          }}>
             {currentStep > 0 && (
              <Button size="default" onClick={handlePrev}>
                Previous
              </Button>
            )}
            {currentStep === 2 && (
              <Button 
                size="default" 
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
              size="default"
              disabled={currentStep === 2 && !mfaComplete}
              style={{ 
                minWidth: 120,
                background: currentStep === 2 && !mfaComplete ? '#d9d9d9' : '#001529',
                borderColor: currentStep === 2 && !mfaComplete ? '#d9d9d9' : '#001529'
              }}
            >
              {currentStep === 0 ? 'Get Started' : currentStep === 1 ? 'Verify & Continue' : (currentStep === steps.length - 1 ? 'Submit Registration' : 'Next Step')}
            </Button>
          </div>
        </Form>
      )}
    </Card>
  )
}
