import React, { useState, useEffect } from 'react'
import { Layout, Button, Input, Spin, Space, Tooltip, Typography, Alert, theme, Result } from 'antd'
import { 
  SafetyCertificateOutlined, 
  MobileOutlined, 
  CopyOutlined, 
  ArrowLeftOutlined,
  KeyOutlined,
  CameraOutlined,
  VerifiedOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import QrDisplay from '@/features/authentication/components/QrDisplay.jsx'
import ConfirmLogoutModal from '@/features/authentication/components/ConfirmLogoutModal.jsx'
import { useAuthSession, useMfaSetup, useConfirmLogoutModal } from '@/features/authentication/hooks'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { getProfile } from '@/features/authentication/services/authService'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

/**
 * @param {object} props
 * @param {boolean} [props.embedded] - If true, render only the card content (no layout/header); used inside onboarding pages.
 * @param {() => void | Promise<void>} [props.onComplete] - When embedded, called when MFA is enabled (after profile refresh). Replaces redirect.
 */
export default function MfaSetup({ embedded = false, onComplete }) {
  const { token } = theme.useToken()
  const { currentUser, role, login, logout } = useAuthSession()
  const {
    loading, qrDataUrl, secret, code, setCode, enabled,
    handleSetup, handleVerify,
    showSecret, toggleShowSecret, handleCopy,
    markMfaComplete,
  } = useMfaSetup()
  const { handleRegister: registerPasskey, registering: passkeyRegistering } = usePasskeyManager()
  const navigate = useNavigate()
  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({
    onConfirm: async () => {
      if (logout) logout()
      navigate('/', { replace: true })
    },
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [isReturningUser, setIsReturningUser] = useState(false)

  // When embedded, no redirect; parent handles next step via onComplete
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleKey)
  const isAdmin = roleKey === 'admin'
  const needsOnboarding = (isStaffRole || isAdmin) && (!!currentUser?.mustSetupMfa || !!currentUser?.mustChangeCredentials)
  const postMfaTarget = React.useMemo(() => {
    if (embedded) return null
    if (isAdmin) return currentUser?.mustChangeCredentials ? '/admin/onboarding' : '/admin/dashboard'
    return needsOnboarding ? '/staff/onboarding' : null
  }, [embedded, isAdmin, currentUser?.mustChangeCredentials, needsOnboarding])

  const [navigating, setNavigating] = useState(false)
  const refreshAndContinue = React.useCallback(async () => {
    setNavigating(true)
    try {
      const fresh = await getProfile()
      const merged = { ...currentUser, ...fresh, token: currentUser?.token }
      if (merged.mfaEnabled === true) {
        merged.mfaReenrollmentRequired = false
        merged.mfaReEnrollmentRequired = false
      }
      const remember = !!localStorage.getItem('auth__currentUser')
      login(merged, { remember })
      if (embedded && typeof onComplete === 'function') {
        onComplete()
      } else if (postMfaTarget) {
        window.location.assign(postMfaTarget)
      } else {
        navigate(-1)
      }
    } catch (e) {
      console.error('[MfaSetup] Failed to refresh profile', e)
      if (embedded && typeof onComplete === 'function') onComplete()
      else if (postMfaTarget) window.location.assign(postMfaTarget)
      else navigate(-1)
    } finally {
      setNavigating(false)
    }
  }, [embedded, onComplete, postMfaTarget, navigate, currentUser, login])

  const goToPostMfa = refreshAndContinue

  // Sync step with state and detect returning users
  useEffect(() => {
    if (enabled) {
      // Check if this is a returning user (MFA already enabled before this page load)
      const wasEnabledInitially = currentUser?.mfaEnabled === true
      setIsReturningUser(wasEnabledInitially)
      setCurrentStep(wasEnabledInitially ? 4 : 3) // 4=management, 3=completed
    } else if (secret) {
      if (currentStep === 0) setCurrentStep(1) // Move to scan if secret exists
    } else {
      setCurrentStep(0) // Reset to start if no secret and disabled
      setIsReturningUser(false)
    }
  }, [enabled, secret, currentStep, currentUser?.mfaEnabled])

  const onSetupClick = async () => {
    await handleSetup()
    setCurrentStep(1)
  }

  const onPasskeySetup = async () => {
    const success = await registerPasskey()
    if (!success) return
    try {
      const fresh = await getProfile()
      const raw = localStorage.getItem('auth__currentUser')
      const remember = !!raw
      const merged = { ...currentUser, ...fresh, token: currentUser?.token }
      if (merged.mfaEnabled === true) {
        merged.mfaReenrollmentRequired = false
        merged.mfaReEnrollmentRequired = false
      }
      login(merged, { remember })
      markMfaComplete()
      goToPostMfa()
    } catch (e) {
      console.error('Failed to refresh session after passkey registration', e)
      markMfaComplete()
      goToPostMfa()
    }
  }

  const handleVerifyAndContinue = async () => {
    const ok = await handleVerify()
    if (!ok) return
    goToPostMfa()
  }

  const renderContent = () => {
    // STATE: MANAGEMENT (Step 4) - For returning users who already have MFA enabled
    if (enabled && isReturningUser) {
      return (
        <div style={{ padding: '24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ color: '#52c41a', marginTop: 16 }}>Two-Factor Authentication Active</Title>
            <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
              Your account is already protected with two-factor authentication. You can change it again below.
            </Paragraph>
          </div>

          <Space direction="vertical" style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }} size="middle">
            
            <Button 
              type="primary" 
              onClick={onSetupClick} 
              loading={loading} 
              icon={<MobileOutlined />}
            >
              Set up New Authenticator
            </Button>
            <Button 
              type="default"
              onClick={onPasskeySetup} 
              loading={passkeyRegistering} 
              icon={<KeyOutlined />}
            >
              Add Passkey
            </Button>
          </Space>
        </div>
      )
    }

    // STATE: ENABLED (Step 3) - For first-time setup completion
    if (enabled) {
      return (
        <Result
          status="success"
          title="Two-Factor Authentication Enabled"
          subTitle="Your account is now secured. You will need your authenticator app or passkey when signing in."
          extra={[
            <Button type="primary" key="continue" onClick={() => goToPostMfa()} loading={navigating} disabled={navigating}>
              {embedded ? 'Continue' : (postMfaTarget ? (isAdmin ? 'Go to Admin Dashboard' : 'Continue Onboarding') : 'Return to Settings')}
            </Button>,
          ]}
        />
      )
    }

    // STATE: STEP 0 - INTRO: choose authenticator app or passkey
    if (currentStep === 0) {
      return (
        <div style={{ padding: '24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {!embedded && <SafetyCertificateOutlined style={{ fontSize: 48, color: token.colorPrimary }} />}
            <Title level={4} style={{ color: token.colorPrimary, marginTop: embedded ? 0 : 16 }}>Secure Your Account</Title>
            <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
              Choose how you want to sign in securely: use an authenticator app (e.g. Google Authenticator) or a passkey (e.g. Windows Hello, Face ID).
            </Paragraph>
          </div>

          <Space direction="vertical" style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }} size="middle">
            
            <Button 
              type="primary" 
              onClick={onSetupClick} 
              loading={loading} 
              icon={<MobileOutlined />}
            >
              Use authenticator app
            </Button>
            <Button 
              type="default"
              onClick={onPasskeySetup} 
              loading={passkeyRegistering} 
              icon={<KeyOutlined />}
            >
              Use passkey
            </Button>
          </Space>
          
        </div>
      )
    }

    // STATE: STEP 1 - SCAN QR
    if (currentStep === 1) {
      return (
        <div style={{ padding: '0 12px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {!embedded && <CameraOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 24 }} />}
            <Title level={4} style={{ color: token.colorPrimary, marginTop: embedded ? 0 : undefined }}>Scan QR Code</Title>
            <Paragraph type="secondary">
              Open your authenticator app and scan the code below.
            </Paragraph>
          </div>

          <div style={{ 
            padding: 24, 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: 32,
          }}>
            {loading ? <Spin /> : <QrDisplay dataUrl={qrDataUrl} size={200} />}
          </div>

          <div style={{ marginBottom: 32 }}>
             <Alert
               message={
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <Text strong style={{ color: token.colorPrimary }}>Can't scan the code?</Text>
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
               style={{ border: 'none', background: token.colorInfoBg }}
             />
          </div>

          <Button type="primary" onClick={() => setCurrentStep(2)} >
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
            {!embedded && <VerifiedOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 24 }} />}
            <Title level={4} style={{ color: token.colorPrimary, marginTop: embedded ? 0 : undefined }}>Verify Code</Title>
            <Paragraph type="secondary">
              Enter the 6-digit code generated by your authenticator app.
            </Paragraph>
          </div>

          <div style={{ maxWidth: 320, margin: '0 auto 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div
                style={{ width: '100%', maxWidth: 280 }}
                onKeyDown={(e) => {
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                  if (allowedKeys.includes(e.key)) return
                  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                  const numericOnly = pastedText.replace(/[^0-9]/g, '').slice(0, 6)
                  if (numericOnly) {
                    setCode(numericOnly)
                  }
                }}
              >
                <Input.OTP 
                  length={6} 
                  value={code} 
                  onChange={(val) => {
                    const numericValue = val.replace(/[^0-9]/g, '').slice(0, 6)
                    setCode(numericValue)
                  }} 
                  autoFocus
                  inputType="numeric"
                  mask={false}
                  style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                />
              </div>
            </div>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              block 
              onClick={handleVerifyAndContinue} 
              disabled={code.length !== 6 || loading}
              loading={loading}
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

  const cardContent = (
    <>
      {!embedded && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px', color: token.colorTextHeading }}>
            Security Setup
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>Protect your account with Two-Factor Authentication</Text>
        </div>
      )}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: 500, 
          overflow: 'hidden'
        }}
        styles={{ body: { padding: embedded ? 24 : 40 } }}
      >
        {renderContent()}
      </div>
    </>
  )

  if (embedded) {
    return <div style={{ width: '100%', alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>{cardContent}</div>
  }

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Layout.Header style={{ background: token.colorBgContainer, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80, borderBottom: `1px solid ${token.colorBorder}` }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)} 
          type="text"
          style={{ color: token.colorText, fontSize: 16 }}
        >
          Back
        </Button>
        <Button 
          icon={<LogoutOutlined />} 
          onClick={show}
          type="text"
          danger
          style={{ fontSize: 16 }}
        >
          Logout
        </Button>
      </Layout.Header>
      <Layout.Content style={{ padding: '0 24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', background: token.colorBgLayout }}>
        {cardContent}
      </Layout.Content>
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </Layout>
  )
}
