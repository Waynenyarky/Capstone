import React, { useState, useEffect } from 'react'
import { Layout, Row, Col, Card, Form, Input, Button, Typography, Steps, Spin, Alert, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { 
  SafetyCertificateOutlined, 
  LockOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  SecurityScanOutlined,
  IdcardOutlined
} from '@ant-design/icons'
import { passwordRules, confirmPasswordRules } from '@/features/authentication/validations/changePasswordRules.js'
import { useStaffOnboarding } from '../../hooks/useStaffOnboarding'
import { TopBar } from '@/features/shared'
import { useAuthSession } from '@/features/authentication'
import { mfaStatus } from '@/features/authentication/services/mfaService'

const { Title, Text, Paragraph } = Typography
const { Content } = Layout

export default function StaffOnboarding() {
  const {
    form,
    submitting,
    mustChange,
    mustMfa,
    currentUser,
    homePath,
    handleCredentialsFinish,
    navigate
  } = useStaffOnboarding()
  const { token } = theme.useToken()
  const location = useLocation()
  
  // Local state to manage current step - always start at Welcome (0)
  const [currentStep, setCurrentStep] = useState(0)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [checkingMfa, setCheckingMfa] = useState(false)
  
  // Check MFA status when component mounts, when currentUser changes, or when returning from MFA setup
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!currentUser?.email) return
      
      setCheckingMfa(true)
      try {
        const status = await mfaStatus(currentUser.email)
        const isEnabled = !!status?.enabled
        setMfaEnabled(isEnabled)
        
        // If MFA is enabled, determine the correct step
        if (isEnabled) {
          // If we're on MFA step (2), move to Complete
          if (currentStep === 2) {
            setCurrentStep(3)
          }
          // If we're on Welcome (0) and credentials are done, go to Complete
          else if (currentStep === 0 && !mustChange) {
            setCurrentStep(3)
          }
        }
      } catch (err) {
        console.error('Failed to check MFA status:', err)
      } finally {
        setCheckingMfa(false)
      }
    }
    
    checkMfaStatus()
  }, [currentUser?.email, currentUser?.mustSetupMfa, currentStep, mustChange])
  
  // Check when mustMfa changes (user returns from MFA setup)
  useEffect(() => {
    if (!mustMfa && currentStep === 2) {
      // MFA is no longer required (user completed it), move to Complete
      setCurrentStep(3)
    }
  }, [mustMfa, currentStep])
  
  // Check MFA status when location changes (user returns from MFA setup page)
  useEffect(() => {
    if (location.pathname === '/staff/onboarding') {
      const checkMfa = async () => {
        if (!currentUser?.email) return
        try {
          const status = await mfaStatus(currentUser.email)
          if (status?.enabled) {
            setMfaEnabled(true)
            // If MFA is enabled and we're on step 2, move to Complete
            if (currentStep === 2) {
              setCurrentStep(3)
            }
          }
        } catch (err) {
          console.error('Failed to check MFA status on navigation:', err)
        }
      }
      // Small delay to ensure user data is updated
      const timer = setTimeout(checkMfa, 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, currentStep, currentUser?.email])
  
  // Also check MFA status when window gains focus (user returns from MFA setup page)
  useEffect(() => {
    const handleFocus = async () => {
      if (!currentUser?.email || currentStep !== 2) return
      
      try {
        const status = await mfaStatus(currentUser.email)
        if (status?.enabled) {
          setMfaEnabled(true)
          setCurrentStep(3)
        }
      } catch (err) {
        console.error('Failed to check MFA status on focus:', err)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentUser?.email, currentStep])

  const usernameRules = [
    { required: true, message: 'Please enter a new username' },
    { pattern: /^[a-z0-9][a-z0-9._-]{2,39}$/, message: '3–40 chars: letters, numbers, dot, underscore, hyphen' },
  ]

  const steps = [
    { key: 'welcome', title: 'Welcome', description: 'Start' },
    { key: 'credentials', title: 'Credentials', description: 'Security' },
    { key: 'mfa', title: 'MFA Setup', description: 'Authentication' },
    { key: 'complete', title: 'Complete', description: 'Active' },
  ]
  
  const handleNext = async () => {
    if (currentStep === 0) {
      // From Welcome, go to Credentials if needed, otherwise check MFA status
      if (mustChange) {
        setCurrentStep(1)
      } else {
        // Check MFA status before deciding next step
        if (currentUser?.email) {
          try {
            const status = await mfaStatus(currentUser.email)
            const isEnabled = !!status?.enabled
            if (isEnabled || !mustMfa) {
              setCurrentStep(3) // MFA already set up or not required, go to Complete
            } else {
              setCurrentStep(2) // Need to set up MFA
            }
          } catch (err) {
            // If check fails, proceed based on mustMfa flag
            if (mustMfa) {
              setCurrentStep(2)
            } else {
              setCurrentStep(3)
            }
          }
        } else {
          // No email, proceed based on flags
          if (mustMfa) {
            setCurrentStep(2)
          } else {
            setCurrentStep(3)
          }
        }
      }
      window.scrollTo(0, 0)
    }
  }
  
  // Update step after credentials are saved
  const handleCredentialsFinishWithNavigation = async (values) => {
    await handleCredentialsFinish(values)
    // After credentials are saved, move to MFA step if needed, otherwise complete
    if (mustMfa) {
      setCurrentStep(2)
    } else {
      setCurrentStep(3)
    }
  }
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const renderStepContent = () => {
    // Step 0: Welcome
    if (currentStep === 0) {
      // Welcome step
      return (
        <div style={{ padding: '40px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SafetyCertificateOutlined style={{ fontSize: 56, color: token.colorPrimary, marginBottom: 24, filter: `drop-shadow(0 4px 6px ${token.colorPrimary}33)` }} />
            <Title level={2} style={{ color: token.colorTextHeading, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Welcome to BizClear Staff Portal
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: '1.6' }}>
              {currentUser?.firstName 
                ? `Hello, ${currentUser.firstName}! We're excited to have you join our team.`
                : 'We\'re excited to have you join our team.'}
            </Paragraph>
            <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600, margin: '16px auto 0', lineHeight: '1.6' }}>
              Complete your account setup to activate your staff access and begin using the platform.
            </Paragraph>
          </div>

          <Alert
            message={<span style={{ fontWeight: 600 }}>Before you start</span>}
            description="Please ensure you have the following information ready to complete the setup process."
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
                  <UserOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
                </div>
                <Title level={5} style={{ marginBottom: 12, color: token.colorTextHeading, fontWeight: 600 }}>Personal Information</Title>
                <Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                  Your account details and role information are already configured. You'll set up your login credentials next.
                </Text>
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
                  <LockOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
                </div>
                <Title level={5} style={{ marginBottom: 12, color: token.colorTextHeading, fontWeight: 600 }}>Secure Credentials</Title>
                <Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                  Create a strong username and password to protect your account and ensure secure access to the system.
                </Text>
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
                  <SecurityScanOutlined style={{ fontSize: 36, color: token.colorPrimary }} />
                </div>
                <Title level={5} style={{ marginBottom: 12, color: token.colorTextHeading, fontWeight: 600 }}>Multi-Factor Authentication</Title>
                <Text type="secondary" style={{ fontSize: 14, lineHeight: '1.5' }}>
                  Enable MFA to add an extra layer of security. This is required for all staff accounts to protect sensitive data.
                </Text>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 48, padding: '24px 32px', background: token.colorBgContainer, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <IdcardOutlined style={{ fontSize: 24, color: token.colorPrimary, marginRight: 12 }} />
              <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>What to Expect</Title>
            </div>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 12, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Quick Setup Process</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>The entire setup takes only 3-5 minutes to complete.</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 12, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Secure & Protected</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Your account will be secured with industry-standard security measures.</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 12, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Step-by-Step Guidance</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Clear instructions will guide you through each step of the process.</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 12, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Immediate Access</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Once complete, you'll have full access to your staff dashboard.</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', padding: '10px 24px', borderRadius: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8, fontSize: 16 }} /> 
              <Text strong style={{ color: '#595959' }}>Estimated time to complete: 3-5 minutes</Text>
            </div>
          </div>
        </div>
      )
    }

    // Step 1: Credentials
    if (currentStep === 1) {
      // Credentials step
      return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <LockOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
            <Title level={3} style={{ marginBottom: 8, color: token.colorTextHeading }}>Change Your Credentials</Title>
            <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              For security purposes, please set up a new username and password for your staff account.
            </Paragraph>
          </div>

          <div style={{ background: '#f8f9fa', padding: 32, borderRadius: 8 }}>
            <Form form={form} layout="vertical" onFinish={handleCredentialsFinishWithNavigation} size="large">
              <Form.Item name="username" label="New Username" rules={usernameRules}>
                <Input 
                  prefix={<UserOutlined />}
                  autoComplete="username" 
                  placeholder="Enter your new username"
                />
              </Form.Item>

              <Form.Item name="password" label="New Password" rules={passwordRules}>
                <Input.Password 
                  prefix={<LockOutlined />}
                  autoComplete="new-password" 
                  placeholder="Enter your new password"
                />
              </Form.Item>

              <Form.Item 
                name="confirmPassword" 
                label="Confirm New Password" 
                dependencies={['password']} 
                hasFeedback 
                rules={confirmPasswordRules}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  autoComplete="new-password" 
                  placeholder="Confirm your new password"
                />
              </Form.Item>

              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting} 
                disabled={submitting} 
                block
                size="large"
                style={{ 
                  marginTop: 8,
                  background: '#001529',
                  borderColor: '#001529',
                  height: 48
                }}
              >
                Save and Continue
              </Button>
            </Form>
          </div>
        </div>
      )
    }

    // Step 2: MFA
    if (currentStep === 2) {
      // MFA step
      return (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          {checkingMfa ? (
            <Spin size="large" />
          ) : mfaEnabled ? (
            <>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={3} style={{ marginBottom: 8, color: token.colorTextHeading }}>MFA Already Set Up</Title>
              <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 500, margin: '0 auto 32px' }}>
                Your account already has multi-factor authentication enabled. You can proceed to the next step.
              </Paragraph>
              <Alert
                message="MFA Enabled"
                description="Your account is protected with multi-factor authentication."
                type="success"
                showIcon
                style={{ marginBottom: 32, borderRadius: 8 }}
              />
              <Button 
                type="primary" 
                onClick={() => setCurrentStep(3)} 
                size="large"
                icon={<CheckCircleOutlined />}
                style={{ 
                  minWidth: 200,
                  background: '#001529',
                  borderColor: '#001529',
                  height: 48
                }}
              >
                Continue to Complete
              </Button>
            </>
          ) : (
            <>
              <SecurityScanOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
              <Title level={3} style={{ marginBottom: 8, color: token.colorTextHeading }}>Set Up Multi-Factor Authentication</Title>
              <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 500, margin: '0 auto 32px' }}>
                Multi-factor authentication is required for staff accounts to ensure the highest level of security.
              </Paragraph>

              <Alert
                message="Security Requirement"
                description="All staff accounts must have MFA enabled. This helps protect sensitive data and system access."
                type="warning"
                showIcon
                style={{ marginBottom: 32, borderRadius: 8 }}
              />

              <Button 
                type="primary" 
                onClick={() => {
                  // Store current path to return to after MFA setup
                  sessionStorage.setItem('returnAfterMfa', '/staff/onboarding')
                  navigate('/mfa/setup')
                }} 
                size="large"
                icon={<SecurityScanOutlined />}
                style={{ 
                  minWidth: 200,
                  background: '#001529',
                  borderColor: '#001529',
                  height: 48
                }}
              >
                Set Up MFA Now
              </Button>
            </>
          )}
        </div>
      )
    }

    // Step 3: Complete
    if (currentStep === 3) {
      // Complete step
      return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
        <Title level={2} style={{ marginBottom: 16, color: token.colorTextHeading }}>
          Account Setup Complete!
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 18, marginBottom: 32 }}>
          {`Welcome${currentUser?.firstName ? `, ${currentUser.firstName}` : ''}! Your staff account is now active and ready to use.`}
        </Paragraph>

        <Alert
          message="Setup Complete"
          description="You have successfully completed all required steps. You can now access your staff dashboard."
          type="success"
          showIcon
          style={{ marginBottom: 32, borderRadius: 8 }}
        />

        <Button 
          type="primary" 
          onClick={() => navigate(homePath, { replace: true })} 
          size="large"
          icon={<SafetyCertificateOutlined />}
          style={{ 
            minWidth: 200,
            background: '#001529',
            borderColor: '#001529',
            height: 48
          }}
        >
          Go to Dashboard
        </Button>
      </div>
    )
    }
    
    // Fallback
    return null
  }

  // Determine display step index for Steps component
  const displayStepIndex = currentStep
  
  const { logout } = useAuthSession()
  
  // Determine role label for TopBar
  const roleLabel = React.useMemo(() => {
    const roleKey = String(currentUser?.role?.slug || currentUser?.role || '').toLowerCase()
    const roleMap = {
      'lgu_officer': 'LGU Officer',
      'lgu_manager': 'LGU Manager',
      'inspector': 'Inspector',
      'cso': 'Customer Support Officer',
      'staff': 'Staff'
    }
    return roleMap[roleKey] || 'Staff'
  }, [currentUser])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopBar 
        title="Staff Account Setup"
        hideNotifications={true}
        hideProfileSettings={true}
        currentUser={currentUser}
        onLogout={logout}
        roleLabel={roleLabel}
      />
      <Content style={{  
        padding: '24px', 
        background: '#f5f7fb',
        overflowY: 'auto',
        height: 'calc(100vh - 64px)'
      }}>
        <Row justify="center">
          <Col xs={24} style={{ maxWidth: 900, width: '100%' }}>
            <Card 
              variant="borderless" 
              style={{ 
                margin: '24px auto', 
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
              styles={{ body: { padding: '40px 48px' } }}
            >
              <div style={{ marginBottom: 48 }}>
                <Steps 
                  current={displayStepIndex} 
                  size="default"
                  labelPlacement="horizontal"
                  items={steps.map((s, idx) => ({ 
                    ...s, 
                    status: displayStepIndex === idx ? 'process' : (displayStepIndex > idx ? 'finish' : 'wait') 
                  }))}
                />
              </div>

              <div style={{ minHeight: 400 }}>
                {renderStepContent()}
              </div>
              
              {/* Navigation buttons */}
              {currentStep === 0 && (
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={handleNext}
                    style={{ 
                      minWidth: 120,
                      background: '#001529',
                      borderColor: '#001529'
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
              
              {currentStep === 1 && (
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #f0f0f0', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <Button size="large" onClick={handlePrev}>
                    Previous
                  </Button>
                </div>
              )}
              
              {currentStep === 2 && (
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #f0f0f0', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <Button size="large" onClick={handlePrev}>
                    Previous
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
