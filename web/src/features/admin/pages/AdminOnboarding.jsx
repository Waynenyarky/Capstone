import React, { useState, useEffect } from 'react'
import { Row, Col, Form, theme } from 'antd'
import { useLocation } from 'react-router-dom'
import { SecurityScanOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import { firstLoginChangeCredentials, getProfile } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications'
import AdminLayout from '../components/AdminLayout'
import { OnboardingStepContent } from '@/features/shared'

export default function AdminOnboarding() {
  const { currentUser, login } = useAuthSession()
  const { success, error } = useNotifier()
  const location = useLocation()
  const { token } = theme.useToken()
  const [form] = Form.useForm()

  const mustChange = !!currentUser?.mustChangeCredentials
  const mustMfa = !!currentUser?.mustSetupMfa

  const [currentStep, setCurrentStep] = useState(0)
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
    if (location.pathname === '/admin/onboarding') {
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

  const handleCredentialsFinish = async (values) => {
    setSubmitting(true)
    try {
      await firstLoginChangeCredentials({
        newPassword: values.password,
        newUsername: currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'admin'),
      })
      const fresh = await getProfile()
      const raw = localStorage.getItem('auth__currentUser')
      const remember = !!raw
      const merged = { ...currentUser, ...fresh, token: currentUser?.token }
      login(merged, { remember })
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

  const handleComplete = () => {
    window.location.assign('/admin/dashboard')
  }

  return (
    <AdminLayout hideSidebar pageTitle="Onboarding" pageIcon={<SecurityScanOutlined />}>
      <div style={{ padding: '40px 24px', background: token.colorBgLayout, flex: 1, overflow: 'auto' }}>
        <Row justify="center">
          <Col xs={24} sm={24} md={20} lg={18} xl={16}>
            <OnboardingStepContent
              variant="admin"
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
            />
          </Col>
        </Row>
      </div>
    </AdminLayout>
  )
}
