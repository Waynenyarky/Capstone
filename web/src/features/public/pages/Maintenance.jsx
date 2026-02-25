import { Layout, Typography, Button, Grid, theme } from 'antd'
import { LogoutOutlined, ToolOutlined } from '@ant-design/icons'
import HomeHeader from '../components/HomeHeader.jsx'
import HomeFooter from '../components/HomeFooter.jsx'
import { useEffect, useState } from 'react'
import { getMaintenanceStatus } from '../services/maintenanceService.js'
import { useAuthSession } from '@/features/authentication'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function Maintenance() {
  const [status, setStatus] = useState({ active: true })
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const { currentUser, logout } = useAuthSession()
  const isLoggedIn = !!currentUser

  useEffect(() => {
    getMaintenanceStatus()
      .then((res) => setStatus(res || { active: true }))
      .catch(() => setStatus({ active: true }))
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader />
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
            <ToolOutlined style={{ fontSize: '48px', color: token.colorTextTertiary, marginBottom: '24px' }} />
            
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
              {status?.message || "We're performing scheduled maintenance to improve our services. Please check back soon."}
            </Paragraph>

            {status?.expectedResumeAt && (
              <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                Expected back: {new Date(status.expectedResumeAt).toLocaleString()}
              </Text>
            )}

            {isLoggedIn && (
              <Button 
                icon={<LogoutOutlined />} 
                onClick={() => logout()}
                size="large"
                style={{ 
                  height: '48px', 
                  padding: '0 32px', 
                  fontSize: '16px', 
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Log Out
              </Button>
            )}
          </div>
        </div>
      </Layout.Content>
      <HomeFooter />
    </Layout>
  )
}
