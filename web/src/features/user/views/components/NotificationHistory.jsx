import React, { useState, useEffect } from 'react'
import { List, Typography, Tag, Empty, Spin, Space, theme, Timeline, Badge, Button } from 'antd'
import { BellOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const NOTIFICATION_ICONS = {
  password_change: <LockOutlined />,
  email_change: <MailOutlined />,
  mfa_change: <SafetyCertificateOutlined />,
  profile_update: <UserOutlined />,
  default: <BellOutlined />,
}

const NOTIFICATION_COLORS = {
  password_change: '#ff4d4f',
  email_change: '#1890ff',
  mfa_change: '#52c41a',
  profile_update: '#722ed1',
  default: '#8c8c8c',
}

const NOTIFICATION_TAGS = {
  password_change: { color: 'red', text: 'Password' },
  email_change: { color: 'blue', text: 'Email' },
  mfa_change: { color: 'green', text: 'MFA' },
  profile_update: { color: 'purple', text: 'Profile' },
  default: { color: 'default', text: 'General' },
}

const formatTimeAgo = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now - time) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return time.toLocaleDateString()
}

export default function NotificationHistory() {
  const { token } = theme.useToken()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
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
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading notification history...</Text>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: token.colorPrimary }} />
            Notification History
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            View your recent account activity and security notifications
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadHistory(true)}
          loading={refreshing}
          size="middle"
        >
          Refresh
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 8 }}>
                No notifications yet
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Your notification history will appear here once you receive account activity notifications.
              </Text>
            </div>
          }
          style={{ padding: '60px 20px' }}
        />
      ) : (
        <div
          style={{
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
            backgroundColor: token.colorBgContainer
          }}
        >
          <Timeline
            mode="left"
            items={notifications.map((item, index) => {
              const iconColor = NOTIFICATION_COLORS[item.type] || NOTIFICATION_COLORS.default
              const tagInfo = NOTIFICATION_TAGS[item.type] || NOTIFICATION_TAGS.default
              const IconComponent = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default

              return {
                key: index,
                dot: (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: `${iconColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: iconColor,
                      border: `2px solid ${iconColor}40`
                    }}
                  >
                    {IconComponent}
                  </div>
                ),
                children: (
                  <div
                    style={{
                      marginLeft: 16,
                      padding: '16px 20px',
                      borderRadius: token.borderRadius,
                      backgroundColor: token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = iconColor
                      e.currentTarget.style.boxShadow = `0 2px 8px ${iconColor}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = token.colorBorderSecondary
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Space size="small" style={{ marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 15 }}>
                            {item.title}
                          </Text>
                          <Tag color={tagInfo.color} style={{ margin: 0 }}>
                            {tagInfo.text}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                          {item.message}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTimeAgo(item.timestamp)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                ),
              }
            })}
          />
        </div>
      )}
    </div>
  )
}
