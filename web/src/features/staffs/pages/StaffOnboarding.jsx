import React, { useState, useEffect } from 'react'
import { Row, Col, Form, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { SecurityScanOutlined } from '@ant-design/icons'
import { useStaffOnboarding } from '../hooks/useStaffOnboarding'
import StaffLayout from '../components/StaffLayout'
import { OnboardingStepContent } from '@/features/shared'
import { mfaStatus } from '@/features/authentication/services/mfaService'

// Dev mode: bypass MFA setup when VITE_BYPASS_MFA_DEV=true
const bypassMfaDev = import.meta.env.VITE_BYPASS_MFA_DEV === 'true'

export default function StaffOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
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
    onCredentialsSuccess: () => setCurrentStep(bypassMfaDev ? 3 : 2),
  })
  // Override mustMfa in dev mode
  const mustMfa = bypassMfaDev ? false : mustMfaRaw
  const { token } = theme.useToken()
  const location = useLocation()
  const [mfaEnabled, setMfaEnabled] = useState(bypassMfaDev ? true : false)
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

  const handleComplete = () => {
    navigate(homePath, { replace: true })
  }

  return (
    <StaffLayout
      hideSidebar
      pageTitle="Onboarding"
      pageIcon={<SecurityScanOutlined />}
      headerActions={null}
      noContentWrap
    >
      <div
        style={{
          padding: '40px 24px',
          background: token.colorBgLayout,
          flex: 1,
          overflow: 'auto',
        }}
      >
        <Row justify="center">
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
            />
          </Col>
        </Row>
      </div>
    </StaffLayout>
  )
}
