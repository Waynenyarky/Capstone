import React, { useEffect, useState } from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space, Spin, message, Result } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '@/features/authentication/components/Sidebar'
import { useAuthSession } from '@/features/authentication/hooks'
import BusinessRegistrationWizard from '../components/BusinessRegistrationWizard'
import { getBusinessProfile } from '../services/businessProfileService'
import { post, get } from '@/lib/http'

const { Title, Paragraph } = Typography

export default function BusinessOwnerDashboard() {
  const { currentUser, role, login, logout } = useAuthSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleSendLink = async () => {
    try {
      setSending(true)
      await post('/api/auth/send-verification-email')
      message.success('Verification link sent! Please check your email.')
    } catch (err) {
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
          setFetchError(err)
        })
        .finally(() => setLoading(false))
    }
  }, [currentUser, role, navigate])

  if (!currentUser || role !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..." />
      </div>
    )
  }

  // Ensure email is verified before allowing business registration
  if (!currentUser.isEmailVerified) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
        <Layout.Sider width={260} style={{ background: '#fff' }}>
          <Sidebar />
        </Layout.Sider>
        <Layout.Content style={{ padding: 32 }}>
          <div style={{ maxWidth: 800, margin: '48px auto', textAlign: 'center' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Title level={4} type="danger">Failed to load profile</Title>
        <Paragraph>{fetchError.message || 'Unknown error occurred'}</Paragraph>
        <Button type="primary" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // If profile is not yet created (null) or in draft/revision mode, show the registration wizard
  if (!profile || profile.status === 'draft' || profile.status === 'needs_revision') {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
        <Layout.Sider width={260} style={{ background: '#fff' }}>
          <Sidebar />
        </Layout.Sider>
        <Layout.Content style={{ padding: 32 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: 32 }}>Complete Business Registration</Title>
            <BusinessRegistrationWizard onComplete={() => window.location.reload()} />
          </div>
        </Layout.Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Layout.Sider width={260} style={{ background: '#fff' }}>
        <Sidebar />
      </Layout.Sider>
      <Layout.Content style={{ padding: 32 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <Title level={2}>Business Owner</Title>
            <Paragraph type="secondary">Quick links for Business Owner workspace.</Paragraph>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Dashboard</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Overview and stats</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary">Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Permit Applications</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>View and manage permits</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Cessation</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage cessations</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Payments</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Payment history and actions</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Appeals</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Submit or track appeals</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Profile / Settings</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage profile and MFA</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Link to="/profile-static"><Button>Open</Button></Link>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Layout.Content>
    </Layout>
  )
}
