import React, { useEffect, useState } from 'react'
import { List, Typography, Card, Tag, Space, Button, theme, Empty, Modal, App, Spin } from 'antd'
import { ArrowLeftOutlined, InfoCircleOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '@/features/user/services/notificationService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const { Title, Paragraph, Text } = Typography
dayjs.extend(relativeTime)

export default function NotificationsPage() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)

  const getIcon = (type) => {
    switch (type) {
      case 'application_rejected':
        return <WarningOutlined style={{ color: token.colorError, fontSize: 24 }} />
      case 'application_needs_revision':
        return <WarningOutlined style={{ color: token.colorWarning, fontSize: 24 }} />
      case 'application_approved':
        return <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 24 }} />
      default:
        return <InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 24 }} />
    }
  }

  const getBackground = (type) => {
    switch (type) {
      case 'application_rejected':
        return token.colorErrorBg
      case 'application_needs_revision':
        return token.colorWarningBg
      case 'application_approved':
        return token.colorSuccessBg
      default:
        return token.colorInfoBg
    }
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const [notificationsResponse, count] = await Promise.all([
        getNotifications({ page: 1, limit: 50 }),
        getUnreadCount()
      ])
      const items = notificationsResponse?.notifications || notificationsResponse || []
      setNotifications(Array.isArray(items) ? items : [])
      const unreadCountValue = typeof count === 'number' ? count : (count?.count || 0)
      setUnreadCount(unreadCountValue)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
      setUnreadCount(0)
      message.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      message.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      message.error('Failed to mark all as read')
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        )
      }
      setSelectedNotification(notification)
      setNotificationModalVisible(true)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <BusinessOwnerLayout pageTitle="Notifications">
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || loading}>
            Mark all as read
          </Button>
        </div>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>Notifications</Title>
          <Paragraph type="secondary">Stay updated with alerts, reminders, and system messages.</Paragraph>
        </div>

        <Card 
          loading={loading} 
          style={{ 
            borderRadius: token.borderRadiusLG, 
            boxShadow: token.boxShadowSecondary 
          }}
          styles={{ body: { padding: 0 } }}
        >
          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : notifications.length === 0 ? (
            <Empty description="No notifications yet" style={{ padding: '24px 0' }} />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={item => (
                <List.Item 
                  style={{ 
                    padding: '16px 24px', 
                    borderLeft: item.type === 'application_rejected'
                      ? `4px solid ${token.colorError}`
                      : item.type === 'application_needs_revision'
                        ? `4px solid ${token.colorWarning}`
                      : '4px solid transparent',
                    background: !item.read ? token.colorInfoBg : undefined,
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNotificationClick(item)}
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
                        <Text strong style={{ fontSize: 16 }}>{item.title || 'Notification'}</Text>
                        {!item.read && <Tag color="processing">New</Tag>}
                        {item.type === 'application_rejected' && <Tag color="error">Rejected</Tag>}
                        {item.type === 'application_approved' && <Tag color="success">Approved</Tag>}
                        {item.type === 'application_needs_revision' && <Tag color="warning">Needs Revision</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">
                          {item.createdAt ? dayjs(item.createdAt).fromNow() : 'Just now'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
      <Modal
        title={selectedNotification?.title || 'Notification'}
        open={notificationModalVisible}
        onCancel={() => {
          setNotificationModalVisible(false)
          setSelectedNotification(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setNotificationModalVisible(false)
              setSelectedNotification(null)
            }}
          >
            Close
          </Button>
        ]}
      >
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">
            {selectedNotification?.createdAt ? dayjs(selectedNotification.createdAt).fromNow() : ''}
          </Text>
        </div>
        <div>
          <Text>
            {selectedNotification?.message || 'No details available.'}
          </Text>
        </div>
      </Modal>
    </BusinessOwnerLayout>
  )
}
