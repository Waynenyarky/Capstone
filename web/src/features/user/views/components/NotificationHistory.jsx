import React, { useState, useEffect } from 'react'
import { Typography, Tag, Empty, Spin, Space, theme, Timeline, Button } from 'antd'
import { BellOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined, ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { getNotifications } from '@/features/user/services/notificationService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const { Title, Text } = Typography
dayjs.extend(relativeTime)

const NOTIFICATION_ICONS = {
  password_change: <LockOutlined />,
  email_change: <MailOutlined />,
  mfa_change: <SafetyCertificateOutlined />,
  profile_update: <UserOutlined />,
  application_approved: <CheckCircleOutlined />,
  application_rejected: <CloseCircleOutlined />,
  application_needs_revision: <CloseCircleOutlined />,
  application_review_started: <InfoCircleOutlined />,
  default: <BellOutlined />,
}

const NOTIFICATION_COLORS = {
  password_change: '#ff4d4f',
  email_change: '#1890ff',
  mfa_change: '#52c41a',
  profile_update: '#722ed1',
  application_approved: '#52c41a',
  application_rejected: '#ff4d4f',
  application_needs_revision: '#faad14',
  application_review_started: '#1890ff',
  default: '#8c8c8c',
}

const NOTIFICATION_TAGS = {
  password_change: { color: 'red', text: 'Password' },
  email_change: { color: 'blue', text: 'Email' },
  mfa_change: { color: 'green', text: 'MFA' },
  profile_update: { color: 'purple', text: 'Profile' },
  application_approved: { color: 'success', text: 'Approved' },
  application_rejected: { color: 'error', text: 'Rejected' },
  application_needs_revision: { color: 'warning', text: 'Needs Revision' },
  application_review_started: { color: 'processing', text: 'Under Review' },
  default: { color: 'default', text: 'General' },
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now'
  return dayjs(timestamp).fromNow()
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
      
      const response = await getNotifications({ page: 1, limit: 20 })
      const items = response?.notifications || response || []
      setNotifications(Array.isArray(items) ? items : [])
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 15 }} />
            Notification History
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            View your recent account activity and security notifications
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadHistory(true)}
          loading={refreshing}
          size="small"
          type="default"
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
        <div style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
          backgroundColor: token.colorBgContainer
        }}>
          <Timeline
            mode="left"
            items={notifications.map((item, index) => {
              const iconColor = NOTIFICATION_COLORS[item.type] || NOTIFICATION_COLORS.default
              const tagInfo = NOTIFICATION_TAGS[item.type] || NOTIFICATION_TAGS.default
              const IconComponent = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default
              const isUnread = item.read === false

              return {
                key: index,
                dot: (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: `${iconColor}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: iconColor,
                      border: `1px solid ${iconColor}40`
                    }}
                  >
                    {IconComponent}
                  </div>
                ),
                children: (
                  <div
                    style={{
                      marginLeft: 16,
                      padding: '10px 12px',
                      borderRadius: token.borderRadius,
                      backgroundColor: isUnread ? token.colorInfoBg : token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = iconColor
                      e.currentTarget.style.boxShadow = `0 2px 6px ${iconColor}1f`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = token.colorBorderSecondary
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <Space size="small" style={{ marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {item.title || 'Notification'}
                          </Text>
                          <Tag color={tagInfo.color} style={{ margin: 0, fontSize: 11, lineHeight: '16px' }}>
                            {tagInfo.text}
                          </Tag>
                          {isUnread && <Tag color="processing" style={{ margin: 0, fontSize: 11, lineHeight: '16px' }}>New</Tag>}
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.45, display: 'block' }}>
                          {item.message || 'No details available.'}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
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
