import { useState, useEffect } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Row, Col, theme } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShopOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import { firstLoginChangeCredentials } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications'
import BusinessOwnerLayout from '../components/shared/BusinessOwnerLayout'
import OnboardingStepContent from '@/shared/components/OnboardingStepContent'

export default function BusinessOwnerOnboarding() {
  const { currentUser } = useAuthSession()
  const { success, error } = useNotifier()
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [form] = Form.useForm()

  const mustChange = !!currentUser?.mustChangeCredentials
  const mustMfa = !!currentUser?.mustSetupMfa
  const passwordExpired = !!currentUser?.passwordExpired

  // Business owners skip password step on signup, only show for password expiration
  const initialStep = passwordExpired ? 0 : (mustMfa ? 0 : 1)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const onboardingMode = passwordExpired ? 'password-expired' : 'mfa-only'
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [checkingMfa, setCheckingMfa] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!currentUser?.email) return
      setCheckingMfa(true)
      try {
        const status = await mfaStatus(currentUser.email)
        const isEnabled = !!status?.enabled
        setMfaEnabled(isEnabled)
        if (isEnabled) {
          if (onboardingMode === 'mfa-only') {
            setCurrentStep(1) // Skip to complete
          } else if (onboardingMode === 'password-expired') {
            if (currentStep === 1) setCurrentStep(2)
          }
        }
      } catch (err) {
        console.error('Failed to check MFA status:', err)
      } finally {
        setCheckingMfa(false)
      }
    }
    checkMfaStatus()
  }, [currentUser?.email, currentUser?.mustSetupMfa, currentStep, onboardingMode])

  useEffect(() => {
    if (!mustMfa && onboardingMode === 'mfa-only' && currentStep === 0) {
      setCurrentStep(1) // Skip MFA, go to complete
    }
  }, [mustMfa, currentStep, onboardingMode])

  useEffect(() => {
    if (location.pathname === '/business-owner/onboarding') {
      const checkMfa = async () => {
        if (!currentUser?.email) return
        try {
          const status = await mfaStatus(currentUser.email)
          if (status?.enabled) {
            setMfaEnabled(true)
            if (onboardingMode === 'mfa-only') {
              setCurrentStep(1) // Skip to complete
            }
          }
        } catch (err) {
          console.error('Failed to check MFA status on navigation:', err)
        }
      }
      const timer = setTimeout(checkMfa, 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, currentUser?.email, currentStep, onboardingMode])

  const handleCredentialsFinish = async (values) => {
    setSubmitting(true)
    try {
      await firstLoginChangeCredentials({
        newPassword: values.password,
        newUsername: currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'businessowner'),
      })
      success('Password changed successfully')
      if (mustMfa) setCurrentStep(2)
      else setCurrentStep(3)
    } catch (err) {
      console.error('Change credentials error:', err)
      error(err?.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    // For business owners, navigate directly to dashboard
    // MFA is optional, so no need to wait for mustSetupMfa to be cleared
    navigate('/owner', { replace: true })
  }

  const handleMfaSkip = () => {
    // MFA is optional for business owners. Skipping navigates directly to dashboard.
    // (mustSetupMfa remains set but is not enforced by ProtectedRoute for business owners.)
    navigate('/owner', { replace: true })
  }

  return (
    <BusinessOwnerLayout hideSidebar pageTitle="Onboarding" pageIcon={<ShopOutlined />}>
      <div
        style={{
          paddingBottom: 128,
          background: token.colorBgContainer,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <Row justify="center" align="middle" style={{ flex: 1 }}>
          <Col xs={24} sm={24} md={20} lg={18} xl={16}>
            <OnboardingStepContent
              variant="business_owner"
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              mustChange={mustChange}
              mustMfa={mustMfa}
              currentUser={currentUser}
              form={form}
              handleCredentialsFinish={handleCredentialsFinish}
              submitting={submitting}
              checkingMfa={checkingMfa}
              mfaEnabled={mfaEnabled}
              onComplete={handleComplete}
              passwordExpired={passwordExpired}
              onBack={() => setCurrentStep(Math.max(0, currentStep - 1))}
              mode={onboardingMode}
              onMfaSkip={handleMfaSkip}
            />
          </Col>
        </Row>
      </div>
    </BusinessOwnerLayout>
  )
}
