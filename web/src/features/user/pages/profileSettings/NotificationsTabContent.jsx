import React from 'react'
import { Typography, Card, Button, Grid } from 'antd'
import { theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import NotificationPreferences from '@/features/user/components/NotificationPreferences.jsx'
import NotificationHistory from '@/features/user/components/NotificationHistory.jsx'
import AuditHistory from '@/features/user/components/AuditHistory.jsx'

const { Title } = Typography

const cardStyle = (token) => ({
  marginBottom: 24,
  border: `1px solid ${token.colorBorderSecondary}`,
  borderRadius: token.borderRadiusLG,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
})

export default function NotificationsTabContent() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const padding = screens.xs ? 16 : 24

  return (
    <>
      <Card style={cardStyle(token)} styles={{ body: { padding } }}>
        <NotificationPreferences />
      </Card>
      <Card style={cardStyle(token)} styles={{ body: { padding } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>Notification History</Title>
          <Button type="link" onClick={() => navigate('/owner/notifications')}>
            View All Notifications
          </Button>
        </div>
        <NotificationHistory />
      </Card>
      <Card
        style={{
          ...cardStyle(token),
          marginBottom: 0,
        }}
        styles={{ body: { padding } }}
      >
        <AuditHistory />
      </Card>
    </>
  )
}
