import React, { useState, useEffect } from 'react'
import { Layout, Button, Card, Input, Spin, Space, Tooltip, Checkbox, Steps, Typography, Alert, Divider, theme, Result } from 'antd'
import { 
  SafetyCertificateOutlined, 
  ScanOutlined, 
  MobileOutlined, 
  CopyOutlined, 
  ArrowLeftOutlined,
  CheckCircleFilled,
  LockOutlined,
  SecurityScanOutlined
} from '@ant-design/icons'
import QrDisplay from '@/features/authentication/views/components/QrDisplay.jsx'
import { useAuthSession, useMfaSetup } from '@/features/authentication/hooks'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

export default function MfaSetup() {
  const { token } = theme.useToken()
  const { currentUser, role } = useAuthSession()
  const {
    loading, qrDataUrl, uri, secret, code, setCode, enabled,
    handleSetup, handleVerify, handleDisable, 
    showSecret, toggleShowSecret, confirmedSaved, setConfirmedSaved, handleCopy,
  } = useMfaSetup()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  // Modern Dark Palette
  const colors = {
    background: 'radial-gradient(circle at 50% -20%, #0050b3 0%, transparent 40%), linear-gradient(135deg, #001529 0%, #003a70 100%)',
    primary: '#003a70',
    accent: '#faad14',
    text: '#001529',
    cardShadow: '0 12px 32px rgba(0, 21, 41, 0.4)'
  }

  // Determine role-based logic
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleKey)
  const needsOnboarding = isStaffRole && (!!currentUser?.mustSetupMfa || !!currentUser?.mustChangeCredentials)

  // Sync step with state
  useEffect(() => {
    if (enabled) {
      setCurrentStep(3) // Completed/Enabled state
    } else if (secret) {
      if (currentStep === 0) setCurrentStep(1) // Move to scan if secret exists
    } else {
      setCurrentStep(0) // Reset to start if no secret and disabled
    }
  }, [enabled, secret])

  const onSetupClick = async () => {
    await handleSetup()
    setCurrentStep(1)
  }

  const handleVerifyAndContinue = async () => {
    const ok = await handleVerify()
    if (!ok) return
    if (needsOnboarding) {
      navigate('/staff/onboarding', { replace: true })
    }
  }

  const stepsItems = [
    { title: 'Intro', icon: <SecurityScanOutlined /> },
    { title: 'Scan QR', icon: <ScanOutlined /> },
    { title: 'Verify', icon: <MobileOutlined /> },
    { title: 'Done', icon: <CheckCircleFilled /> },
  ]

  const renderContent = () => {
    // STATE: ENABLED (Step 3)
    if (enabled) {
      return (
        <Result
          status="success"
          title="Two-Factor Authentication Enabled"
          subTitle="Your account is now secured. You will need to enter a verification code when signing in."
          extra={[
            <Button type="primary" key="continue" onClick={() => needsOnboarding ? navigate('/staff/onboarding', { replace: true }) : navigate(-1)}>
              {needsOnboarding ? 'Continue Onboarding' : 'Return to Settings'}
            </Button>,
            <Button key="disable" danger onClick={handleDisable} loading={loading}>
              Disable MFA
            </Button>,
          ]}
        />
      )
    }

    // STATE: STEP 0 - INTRO
    if (currentStep === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ marginBottom: 24 }}>
             <SafetyCertificateOutlined style={{ fontSize: 64, color: colors.primary }} />
          </div>
          <Title level={2} style={{ color: colors.primary }}>Secure Your Account</Title>
          <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 400, margin: '0 auto 32px' }}>
            Multi-factor authentication adds an extra layer of security. 
            You'll need an authenticator app like <strong>Google Authenticator</strong> or <strong>Authy</strong>.
          </Paragraph>
          
          <Button 
            type="primary" 
            size="large" 
            onClick={onSetupClick} 
            loading={loading} 
            icon={<LockOutlined />}
            style={{ 
              background: colors.accent, 
              borderColor: colors.accent, 
              color: '#001529',
              minWidth: 200, 
              height: 48,
              fontWeight: 600
            }}
          >
            Start Setup
          </Button>
        </div>
      )
    }

    // STATE: STEP 1 - SCAN QR
    if (currentStep === 1) {
      return (
        <div style={{ padding: '0 12px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3} style={{ color: colors.primary }}>Scan QR Code</Title>
            <Paragraph type="secondary">
              Open your authenticator app and scan the code below.
            </Paragraph>
          </div>

          <div style={{ 
            background: '#fff', 
            padding: 24, 
            borderRadius: 16, 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: 32,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
          }}>
            {loading ? <Spin /> : <QrDisplay dataUrl={qrDataUrl} size={200} />}
          </div>

          <div style={{ marginBottom: 32 }}>
             <Alert
               message={
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <Text strong style={{ color: colors.primary }}>Can't scan the code?</Text>
                   <Button type="link" size="small" onClick={toggleShowSecret}>
                     {showSecret ? 'Hide Key' : 'View Key'}
                   </Button>
                 </div>
               }
               description={showSecret && (
                 <div style={{ marginTop: 12 }}>
                   <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
                     Enter this setup key manually in your app:
                   </Paragraph>
                   <Input.Search
                      readOnly 
                      value={secret} 
                      onSearch={handleCopy}
                      enterButton={<Tooltip title="Copy"><CopyOutlined /></Tooltip>}
                   />
                 </div>
               )}
               type="info"
               showIcon={false}
               style={{ border: 'none', background: '#f0f5ff' }}
             />
          </div>

          <Button type="primary" block size="large" onClick={() => setCurrentStep(2)} style={{ background: colors.primary, height: 48 }}>
            Next Step
          </Button>
        </div>
      )
    }

    // STATE: STEP 2 - VERIFY
    if (currentStep === 2) {
      return (
        <div style={{ padding: '0 12px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3} style={{ color: colors.primary }}>Verify Code</Title>
            <Paragraph type="secondary">
              Enter the 6-digit code generated by your authenticator app.
            </Paragraph>
          </div>

          <div style={{ maxWidth: 320, margin: '0 auto 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Input.OTP 
                length={6} 
                value={code} 
                onChange={(val) => setCode(val)} 
                size="large"
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <Alert 
              type="warning" 
              message="Backup Your Key"
              description={
                <Checkbox checked={confirmedSaved} onChange={(e) => setConfirmedSaved(e.target.checked)}>
                  I have saved my backup secret key safely
                </Checkbox>
              }
            />
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button 
              type="primary" 
              block 
              size="large" 
              onClick={handleVerifyAndContinue} 
              disabled={!confirmedSaved || code.length !== 6 || loading}
              loading={loading}
              style={{ background: colors.primary, height: 48 }}
            >
              Verify & Enable
            </Button>
            <Button type="text" block onClick={() => setCurrentStep(1)}>
              Back to QR Code
            </Button>
          </Space>
        </div>
      )
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: colors.background }}>
      <Layout.Header style={{ background: 'transparent', padding: '0 24px', display: 'flex', alignItems: 'center', height: 80 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)} 
          type="text"
          style={{ color: '#fff', fontSize: 16 }}
        >
          Back
        </Button>
      </Layout.Header>

      <Layout.Content style={{ padding: '0 24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32, color: '#fff' }}>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>Security Setup</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Protect your account with Two-Factor Authentication</Text>
        </div>

        <Card 
          style={{ 
            width: '100%', 
            maxWidth: 500, 
            boxShadow: colors.cardShadow, 
            borderRadius: 24, 
            border: 'none',
            overflow: 'hidden'
          }}
          styles={{ body: { padding: 40 } }}
        >
          <Steps 
            current={currentStep} 
            items={stepsItems} 
            size="small" 
            style={{ marginBottom: 40 }} 
            responsive={false}
          />
          {renderContent()}
        </Card>
      </Layout.Content>
    </Layout>
   )
}
