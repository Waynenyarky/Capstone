import React from 'react'
import { Typography, Card, Button, Grid } from 'antd'
import { theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import NotificationPreferences from '@/features/user/components/NotificationPreferences.jsx'
import NotificationHistory from '@/features/user/components/NotificationHistory.jsx'
import AuditHistory from '@/features/user/components/AuditHistory.jsx'

const { Title } = Typography
const { Paragraph } = Typography

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
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 4 }}>Notifications</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Manage notification preferences, view history, and audit activity.
        </Paragraph>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Card style={cardStyle(token)} styles={{ body: { padding } }}>
          <NotificationPreferences />
        </Card>
        <Card style={cardStyle(token)} styles={{ body: { padding } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>Notification History</Title>
            <Button type="link" onClick={() => navigate('/notifications')}>
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
      </div>
    </div>
  )
}
