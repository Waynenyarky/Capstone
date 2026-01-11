import React, { useEffect, useState } from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space, Spin, message, Result } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { FormOutlined, MailOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication/hooks'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import BusinessRegistrationWizard from '../components/BusinessRegistrationWizard'
import Sidebar from '@/features/authentication/components/Sidebar'
import { getBusinessProfile } from '../services/businessProfileService'
import { post, get } from '@/lib/http'

// Dashboard Feature Imports
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData'
import ComplianceStatus from '../features/dashboard/components/ComplianceStatus'
import PermitSummary from '../features/dashboard/components/PermitSummary'
import PaymentsDue from '../features/dashboard/components/PaymentsDue'
import InspectionsViolations from '../features/dashboard/components/InspectionsViolations'
import Appeals from '../features/dashboard/components/Appeals'
import Notifications from '../features/dashboard/components/Notifications'
import BusinessProfile from '../features/dashboard/components/BusinessProfile'
import Documents from '../features/dashboard/components/Documents'
import AuditTrail from '../features/dashboard/components/AuditTrail'
import AISuggestions from '../features/dashboard/components/AISuggestions'

const { Title, Paragraph } = Typography

export default function BusinessOwnerDashboard() {
  const { currentUser, role, login, logout } = useAuthSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  
  // Dashboard Data Hook
  const { loading: dashboardLoading, data: dashboardData } = useDashboardData()

  const handleSendLink = async () => {
    try {
      setSending(true)
      await post('/api/auth/send-verification-email')
      message.success('Verification link sent! Please check your email.')
    } catch (err) {
      if (err.message && (err.message.includes('Unauthorized') || err.message.includes('missing token'))) {
        logout()
        return
      }
      message.error(err.message || 'Failed to send verification link.')
    } finally {
      setSending(false)
    }
  }

  const handleCheckVerified = async () => {
    try {
      setChecking(true)
      const freshUser = await get('/api/auth/me')
      if (freshUser && freshUser.isEmailVerified) {
        // Preserve the existing token!
        login({ ...freshUser, token: currentUser?.token })
        message.success('Verified! Refreshing...')
        window.location.reload()
      } else {
        message.warning('Email still not verified. Please check your inbox.')
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to check status. Please reload.')
    } finally {
      setChecking(false)
    }
  }

  // Listen for verification from other tabs
  useEffect(() => {
    const bc = new BroadcastChannel('auth_channel')
    let processing = false

    bc.onmessage = async (event) => {
      if (event.data.type === 'email-verified' && !processing) {
        processing = true
        message.success('Email verified! Syncing...')
        try {
          // Force fetch fresh user data to update THIS tab's session
          // This is crucial if using sessionStorage (which isn't shared between tabs)
          const freshUser = await get('/api/auth/me')
          if (freshUser && freshUser.isEmailVerified) {
            // Preserve the existing token!
            login({ ...freshUser, token: currentUser?.token })
            setLoading(true) // Trigger profile fetch
          }
        } catch (err) {
          console.error('Failed to sync verified status:', err)
        } finally {
          setTimeout(() => { processing = false }, 2000)
        }
      }
    }
    return () => bc.close()
  }, [login])

  useEffect(() => {
    if (!currentUser) navigate('/login')
    else if (role !== 'business_owner') navigate('/dashboard')
    else {
      // Fetch business profile to check status
      setLoading(true)
      getBusinessProfile()
        .then(setProfile)
        .catch(err => {
          console.error(err)
          if (err.message && (err.message.includes('Unauthorized') || err.message.includes('missing token'))) {
             logout()
             return
          }
          setFetchError(err)
        })
        .finally(() => setLoading(false))
    }
  }, [currentUser, role, navigate, logout])

  if (!currentUser || role !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..." />
      </div>
    )
  }

  // Keys to hide if business registration is not complete
  // Hide everything except dashboard (which shows the wizard) and logout
  const RESTRICTED_SIDEBAR_KEYS = ['permit-apps', 'cessation', 'payments', 'appeals', 'profile']

  // Ensure email is verified before allowing business registration
  if (!currentUser.isEmailVerified) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
        <Sidebar 
          hiddenKeys={RESTRICTED_SIDEBAR_KEYS} 
          itemOverrides={{ dashboard: { label: 'Verification', icon: <MailOutlined /> } }}
        />
        <Layout.Content style={{ padding: '40px 60px' }}>
          <div style={{ margin: '48px auto', textAlign: 'center' }}>
            <Card>
              <Result
                status="info"
                title="Please Verify Your Email"
                subTitle={
                  <span>
                  To proceed with your business registration, you must verify your email address. <br />
                  Click the button below to send a verification link to <b>{currentUser.email}</b>.
                </span>
                }
                extra={
                  <Space>
                  <Button loading={sending} onClick={handleSendLink}>
                    Send Verification Link
                  </Button>
                  <Button type="primary" loading={checking} onClick={handleCheckVerified}>
                    I have verified my email
                  </Button>
                </Space>
                }
              />
            </Card>
          </div>
        </Layout.Content>
      </Layout>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large"><div style={{ marginTop: 16 }}>Loading Profile...</div></Spin>
      </div>
    )
  }

  if (fetchError) {
    return (
      <BusinessOwnerLayout pageTitle="Error">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Title level={4} type="danger">Failed to load profile</Title>
          <Paragraph>{fetchError.message || 'Unknown error occurred'}</Paragraph>
          <Button type="primary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </BusinessOwnerLayout>
    )
  }

  // If profile is not yet created (null) or in draft/revision mode, show the registration wizard
  if (!profile || profile.status === 'draft' || profile.status === 'needs_revision') {
    return (
      <BusinessOwnerLayout
        pageTitle="Business Registration"
        hiddenSidebarKeys={RESTRICTED_SIDEBAR_KEYS}
        sidebarOverrides={{ dashboard: { label: 'Business Registration', icon: <FormOutlined /> } }}
      >
          <div>
            <Title level={2} style={{ marginBottom: 32 }}>Complete Business Registration</Title>
            <BusinessRegistrationWizard onComplete={() => window.location.reload()} />
          </div>
      </BusinessOwnerLayout>
    )
  }

  return (
    <BusinessOwnerLayout 
      pageTitle="Dashboard" 
      businessName={profile?.businessName}
    >
        {dashboardLoading ? (
           <div style={{ textAlign: 'center', padding: 50 }}>
             <Spin size="large" />
           </div>
        ) : (
          <div style={{ paddingBottom: 24 }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>Welcome back, {currentUser?.firstName || 'Owner'}</Title>
                <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>Here is your business overview for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Paragraph>
              </div>
              <Space>
                 <Button type="primary" size="large">New Application</Button>
              </Space>
            </div>

            {/* Compliance Status (Top Priority) */}
            <div style={{ marginBottom: 24 }}>
               <ComplianceStatus data={dashboardData?.compliance} />
            </div>

            <Row gutter={[24, 24]}>
              {/* Permit Summary */}
              <Col xs={24} lg={12} xl={8}>
                 <PermitSummary data={dashboardData?.permits} />
              </Col>

              {/* Payments Due */}
              <Col xs={24} lg={12} xl={8}>
                 <PaymentsDue data={dashboardData?.payments} />
              </Col>

              {/* Inspections & Violations */}
              <Col xs={24} lg={12} xl={8}>
                 <InspectionsViolations data={dashboardData?.inspections} />
              </Col>

              {/* Appeals */}
              <Col xs={24} lg={12} xl={8}>
                 <Appeals data={dashboardData?.appeals} />
              </Col>

              {/* Notifications */}
              <Col xs={24} lg={12} xl={8}>
                 <Notifications data={dashboardData?.notifications} />
              </Col>

              {/* Business Profile */}
              <Col xs={24} lg={12} xl={8}>
                 <BusinessProfile data={dashboardData?.businessProfile} />
              </Col>

              {/* Documents */}
              <Col xs={24} lg={12} xl={12}>
                 <Documents data={dashboardData?.documents} />
              </Col>

              {/* Audit Trail */}
              <Col xs={24} lg={12} xl={12}>
                 <AuditTrail data={dashboardData?.auditTrail} />
              </Col>
            </Row>

            {/* AI Suggestions (Bottom) */}
            <AISuggestions data={dashboardData?.aiSuggestions} />
          </div>
        )}
    </BusinessOwnerLayout>
  )
}
