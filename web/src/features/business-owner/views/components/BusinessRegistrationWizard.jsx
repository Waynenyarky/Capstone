import React, { useState, useEffect } from 'react'
import { Steps, Form, Input, Button, Select, Upload, Checkbox, Card, Typography, Row, Col, Spin, Alert, theme, Tabs, Space, Divider, Tooltip, Grid, Modal } from 'antd'
import { UploadOutlined, SafetyCertificateOutlined, MobileOutlined, FormOutlined, CheckCircleOutlined, SecurityScanOutlined, CopyOutlined } from '@ant-design/icons'
import { useBusinessRegistration } from '../../hooks/useBusinessRegistration'
import { useAuthSession } from '@/features/authentication'
import { useMfaSetup } from '@/features/authentication/hooks'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import QrDisplay from '@/features/authentication/views/components/QrDisplay'
import IdVerificationStatus from './IdVerificationStatus'
import IdentityVerificationForm from './IdentityVerificationForm'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

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
  const [totpModalOpen, setTotpModalOpen] = useState(false)

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
    setTotpModalOpen(true)
  }

  const handleTotpVerifyClick = async () => {
    const success = await handleTotpVerify()
    if (success) {
      setMfaEnabled(true)
      setTotpModalOpen(false)
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
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <SecurityScanOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center' }}>Secure Your Account</Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 620, margin: '0 auto' }}>
          Choose at least one method to secure your account. You can set up both, or skip and configure later.
        </Typography.Paragraph>
      </div>

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
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Use biometric authentication or a security key to sign in without passwords.
                </Typography.Paragraph>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SafetyCertificateOutlined />}
                    onClick={handlePasskeyRegisterClick}
                    loading={registering || passkeyLoading || loadingStatus}
                    disabled={passkeyEnabled}
                  >
                    {passkeyEnabled ? 'Passkey Enabled' : 'Set up Passkey'}
                  </Button>
                </Space>
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
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Use an authenticator app (Google Authenticator, Authy) to generate sign-in codes.
                </Typography.Paragraph>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SecurityScanOutlined />}
                    onClick={handleTotpSetupClick}
                    loading={totpLoading || loadingStatus}
                    disabled={totpEnabled}
                  >
                    {totpEnabled ? 'TOTP Enabled' : 'Set up TOTP'}
                  </Button>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Set up TOTP"
        open={totpModalOpen}
        onCancel={() => setTotpModalOpen(false)}
        footer={null}
        centered
        width={isMobile ? 320 : 480}
      >
        <div style={{ textAlign: 'center' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code to finish setup.
          </Typography.Paragraph>
          <div
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 12,
              display: 'inline-block',
              border: `1px solid ${token.colorBorderSecondary}`,
              marginBottom: 16
            }}
          >
            {qrDataUrl ? <QrDisplay dataUrl={qrDataUrl} size={180} /> : <Spin size="large" />}
          </div>
        </div>

        {showSecret && secret && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Or enter this secret key manually:
            </Typography.Text>
            <Input.Group compact>
              <Input value={secret} readOnly style={{ width: 'calc(100% - 80px)' }} />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                Copy
              </Button>
            </Input.Group>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <Checkbox checked={confirmedSaved} onChange={(e) => setConfirmedSaved(e.target.checked)}>
            I have saved the secret key / scanned the QR code
          </Checkbox>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Enter verification code
          </Typography.Text>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            style={{ fontSize: 20, textAlign: 'center', letterSpacing: 8 }}
          />
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={toggleShowSecret}>
            {showSecret ? 'Hide' : 'Show'} Secret Key
          </Button>
          <Button
            type="primary"
            onClick={handleTotpVerifyClick}
            disabled={!code || code.length !== 6 || !confirmedSaved}
            loading={totpLoading}
          >
            Verify & Enable
          </Button>
        </Space>
      </Modal>

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
