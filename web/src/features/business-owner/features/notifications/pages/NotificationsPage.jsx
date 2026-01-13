import React from 'react'
import { List, Typography, Card, Tag, Space, Button, theme } from 'antd'
import { BellOutlined, InfoCircleOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { useDashboardData } from '../../dashboard/hooks/useDashboardData'

const { Title, Paragraph, Text } = Typography

export default function NotificationsPage() {
  const { token } = theme.useToken()
  const { data, loading } = useDashboardData()
  
  const notifications = data?.notifications || []

  // Add some more mock notifications for the full page view if the list is short
  const allNotifications = [
    ...notifications,
    { id: 4, type: 'success', message: 'Payment confirmed for INV-2023-001', time: '2 weeks ago' },
    { id: 5, type: 'info', message: 'Profile updated successfully', time: '3 weeks ago' },
    { id: 6, type: 'critical', message: 'Action required: Update business details', time: '1 month ago' },
  ]

  const getIcon = (type) => {
    switch (type) {
      case 'critical':
      case 'error':
        return <WarningOutlined style={{ color: token.colorError, fontSize: 24 }} />
      case 'warning':
        return <WarningOutlined style={{ color: token.colorWarning, fontSize: 24 }} />
      case 'success':
        return <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 24 }} />
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 24 }} />
    }
  }

  const getBackground = (type) => {
    switch (type) {
      case 'critical':
      case 'error':
        return token.colorErrorBg
      case 'warning':
        return token.colorWarningBg
      case 'success':
        return token.colorSuccessBg
      case 'info':
      default:
        return token.colorInfoBg
    }
  }

  return (
    <BusinessOwnerLayout pageTitle="Notifications">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>Notifications</Title>
            <Paragraph type="secondary">Stay updated with alerts, reminders, and system messages.</Paragraph>
          </div>
          <Button>Mark all as read</Button>
        </div>

        <Card 
          loading={loading} 
          style={{ 
            borderRadius: token.borderRadiusLG, 
            boxShadow: token.boxShadowSecondary 
          }}
          styles={{ body: { padding: 0 } }}
        >
          <List
            itemLayout="horizontal"
            dataSource={allNotifications}
            renderItem={item => (
              <List.Item 
                style={{ 
                  padding: '16px 24px', 
                  borderLeft: item.type === 'critical' ? `4px solid ${token.colorError}` : '4px solid transparent',
                  background: item.type === 'critical' ? token.colorErrorBg : undefined,
                  transition: 'all 0.3s'
                }}
                actions={[<Button type="link" size="small">Dismiss</Button>]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ 
                      background: getBackground(item.type), 
                      padding: 12, 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getIcon(item.type)}
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 16 }}>{item.message}</Text>
                      {item.type === 'critical' && <Tag color="error">Urgent</Tag>}
                      {item.type === 'success' && <Tag color="success">Success</Tag>}
                    </Space>
                  }
                  description={
                    <Space>
                      <ClockCircleOutlined />
                      <Text type="secondary">{item.time}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </BusinessOwnerLayout>
  )
}
