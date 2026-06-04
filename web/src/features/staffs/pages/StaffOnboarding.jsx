import { useState, useEffect } from 'react'
import { Row, Col, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { useStaffOnboarding } from '../hooks/useStaffOnboarding'
import StaffLayout from '../components/StaffLayout'
import { OnboardingStepContent } from '@/features/shared'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import { getProfile } from '@/features/authentication/services/authService'
import { useAuthSession } from '@/features/authentication'

// MFA always required for staff when backend sets mustSetupMfa (no dev bypass)
const bypassMfaDev = false

export default function StaffOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completingOnboarding, setCompletingOnboarding] = useState(false)
  const { login, currentUser: authCurrentUser } = useAuthSession()
  const {
    form,
    submitting,
    mustChange,
    mustMfa: mustMfaRaw,
    currentUser,
    homePath,
    handleCredentialsFinish,
    navigate,
  } = useStaffOnboarding({
    onCredentialsSuccess: () => setCurrentStep(2),
  })
  const mustMfa = mustMfaRaw
  const { token } = theme.useToken()
  const location = useLocation()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [checkingMfa, setCheckingMfa] = useState(false)

  useEffect(() => {
    // Dev mode: skip MFA check entirely
    if (bypassMfaDev) {
      setMfaEnabled(true)
      if (currentStep === 0 && !mustChange) setCurrentStep(3)
      return
    }
    const checkMfaStatus = async () => {
      if (!currentUser?.email) return
      setCheckingMfa(true)
      try {
        const status = await mfaStatus(currentUser.email)
        const isEnabled = !!status?.enabled
        setMfaEnabled(isEnabled)
        if (isEnabled) {
          if (currentStep === 2) setCurrentStep(3)
          else if (currentStep === 0 && !mustChange) setCurrentStep(3)
        }
      } catch (err) {
        console.error('Failed to check MFA status:', err)
      } finally {
        setCheckingMfa(false)
      }
    }
    checkMfaStatus()
  }, [currentUser?.email, currentUser?.mustSetupMfa, currentStep, mustChange])

  useEffect(() => {
    if (!mustMfa && currentStep === 2) setCurrentStep(3)
  }, [mustMfa, currentStep])

  useEffect(() => {
    if (location.pathname === '/staff/onboarding') {
      const checkMfa = async () => {
        if (!currentUser?.email) return
        try {
          const status = await mfaStatus(currentUser.email)
          if (status?.enabled) {
            setMfaEnabled(true)
            if (currentStep === 2) setCurrentStep(3)
          }
        } catch (err) {
          console.error('Failed to check MFA status on navigation:', err)
        }
      }
      const timer = setTimeout(checkMfa, 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, currentUser?.email, currentStep])

  const handleComplete = async () => {
    setCompletingOnboarding(true)
    try {
      // Fetch fresh profile to ensure mustChangeCredentials and mustSetupMfa are cleared
      const fresh = await getProfile()
      const merged = { ...currentUser, ...fresh, token: currentUser?.token }
      const remember = !!localStorage.getItem('auth__currentUser')
      login(merged, { remember })
    } catch (e) {
      console.error('[StaffOnboarding] Failed to refresh profile before dashboard', e)
      // Fallback: navigate anyway to avoid being stuck
      setCompletingOnboarding(false)
      navigate(homePath, { replace: true })
    }
  }

  // Navigate after auth context has updated with cleared flags
  useEffect(() => {
    if (completingOnboarding && authCurrentUser && !authCurrentUser.mustChangeCredentials && !authCurrentUser.mustSetupMfa) {
      // Auth context has been updated with cleared flags, safe to navigate
      navigate(homePath, { replace: true })
    }
  }, [completingOnboarding, authCurrentUser, navigate, homePath])

  return (
    <StaffLayout
      hideSidebar
      noContentWrap
    >
      <div
        style={{
          padding: '40px 24px',
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
              variant="staff"
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
              passwordExpired={!!currentUser?.passwordExpired}
              onBack={() => setCurrentStep(Math.max(0, currentStep - 1))}
              mode={currentUser?.passwordExpired ? 'password-expired' : 'onboarding'}
            />
          </Col>
        </Row>
      </div>
    </StaffLayout>
  )
}
