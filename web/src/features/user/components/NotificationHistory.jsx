import React, { useState, useEffect } from 'react'
import { Card, List, Typography, Tag, Empty, Spin, Space } from 'antd'
import { BellOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { getNotificationHistory } from '@/features/user/services/notificationService.js'

const { Title, Text } = Typography

const NOTIFICATION_ICONS = {
  password_change: <LockOutlined />,
  email_change: <MailOutlined />,
  mfa_change: <SafetyCertificateOutlined />,
  profile_update: <UserOutlined />,
  default: <BellOutlined />,
}

const NOTIFICATION_COLORS = {
  password_change: 'red',
  email_change: 'blue',
  mfa_change: 'green',
  profile_update: 'cyan',
  default: 'default',
}

export default function NotificationHistory() {
  const { currentUser, role } = useAuthSession()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [currentUser])

  const loadHistory = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call when backend endpoint is available
      // const data = await getNotificationHistory(currentUser, role)
      // setNotifications(data?.notifications || [])
      
      // Mock data for now
      setNotifications([])
    } catch (err) {
      console.error('Failed to load notification history:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spin />
  }

  if (notifications.length === 0) {
    return (
      <Empty
        description="No notifications yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Recent Notifications</Title>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <div style={{ fontSize: 24 }}>
                  {NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default}
                </div>
              }
              title={
                <Space>
                  <Text strong>{item.title}</Text>
                  <Tag color={NOTIFICATION_COLORS[item.type] || NOTIFICATION_COLORS.default}>
                    {item.type.replace(/_/g, ' ')}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <Text>{item.message}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
