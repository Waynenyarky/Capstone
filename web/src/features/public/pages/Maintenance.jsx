import { Layout, Typography, Button, Grid, theme } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import HomeFooter from '../components/HomeFooter.jsx'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceStatus } from '@/features/authentication'
import { useAuthSession } from '@/features/authentication'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function Maintenance() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { loading, active, message, expectedResumeAt } = useMaintenanceStatus()
  const { currentUser, logout } = useAuthSession()
  const isLoggedIn = !!currentUser

  useEffect(() => {
    if (!loading && !active) {
      navigate('/', { replace: true })
    }
  }, [loading, active, navigate])

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
        <Layout.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Paragraph type="secondary">Checking status…</Paragraph>
        </Layout.Content>
        <HomeFooter />
      </Layout>
    )
  }

  if (!active) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <Layout.Content style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          background: token.colorBgContainer,
          padding: screens.md ? '0 50px' : '0 24px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
          <div style={{ maxWidth: '600px' }}>
            
            <Title level={1} style={{ 
              marginBottom: '16px', 
              fontSize: screens.md ? '48px' : '32px', 
              fontWeight: 700,
            }}>
              Under Maintenance
            </Title>
            
            <Paragraph style={{ 
              fontSize: screens.md ? '18px' : '16px', 
              color: token.colorTextSecondary, 
              marginBottom: '24px', 
              lineHeight: 1.7,
            }}>
              {message || "We're performing scheduled maintenance to improve our services. Please check back soon."}
            </Paragraph>

            {expectedResumeAt && (
              <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                Expected back: {new Date(expectedResumeAt).toLocaleString()}
              </Text>
            )}

            {isLoggedIn && (
              <Button 
                icon={<LogoutOutlined />} 
                onClick={() => {
                  logout()
                  navigate('/', { replace: true })
                }}
                style={{ 
                  height: '48px', 
                  padding: '0 32px', 
                  fontSize: '16px', 
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Logout and Go Back to the Home Page
              </Button>
            )}
          </div>
        </div>
      </Layout.Content>
      <HomeFooter />
    </Layout>
  )
}
