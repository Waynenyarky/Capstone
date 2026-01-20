import React, { useState, useEffect } from 'react'
import { List, Typography, Card, Tag, Space, Button, theme, Empty, Spin, Dropdown, Menu, Divider, Popconfirm, message, Select } from 'antd'
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, MoreOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService'
import dayjs from 'dayjs'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

export default function NotificationHistoryPage() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [filterType, setFilterType] = useState('all') // 'all', 'unread', 'read'

  useEffect(() => {
    fetchNotifications()
  }, [page, filterType])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const result = await getNotifications({
        page,
        limit,
        unreadOnly: filterType === 'unread'
      })
      setNotifications(result.notifications || [])
      setTotal(result.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      message.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      )
      message.success('Notification marked as read')
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      message.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })))
      message.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      message.error('Failed to mark all notifications as read')
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      setTotal(prev => prev - 1)
      message.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      message.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_approved':
        return <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
      case 'application_rejected':
      case 'application_needs_revision':
        return <CloseCircleOutlined style={{ color: token.colorError, fontSize: 20 }} />
      case 'application_review_started':
        return <InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 20 }} />
      default:
        return <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await handleMarkAsRead(notification._id)
      }
      
      // Navigate based on notification type
      if (notification.relatedEntityType === 'business_application' && notification.relatedEntityId) {
        navigate('/owner/permit-applications')
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <BusinessOwnerLayout pageTitle="Notification History">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>Notifications</Title>
          <Paragraph type="secondary">View and manage all your notifications</Paragraph>
        </div>
        <Space>
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
          >
            <Option value="all">All</Option>
            <Option value="unread">Unread</Option>
            <Option value="read">Read</Option>
          </Select>
          {unreadCount > 0 && (
            <Button 
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Space>
      </div>

      <Card 
        loading={loading}
        style={{ 
          borderRadius: token.borderRadiusLG, 
          boxShadow: token.boxShadowSecondary 
        }}
        styles={{ body: { padding: 0 } }}
      >
        {notifications.length === 0 && !loading ? (
          <Empty 
            description="No notifications found"
            style={{ padding: 48 }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item 
                style={{ 
                  padding: '16px 24px',
                  backgroundColor: !item.read ? token.colorInfoBg : 'transparent',
                  borderLeft: !item.read ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => handleNotificationClick(item)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <Space>
                      <Text strong={!item.read}>{item.title}</Text>
                      {!item.read && <Tag color="blue" size="small">New</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text>{item.message}</Text>
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                        </Text>
                        {item.relatedEntityType && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.relatedEntityType.replace('_', ' ')}
                          </Text>
                        )}
                      </Space>
                    </Space>
                  }
                />
                <Dropdown
                  menu={{
                    items: [
                      !item.read ? {
                        key: 'mark-read',
                        label: 'Mark as Read',
                        icon: <CheckOutlined />,
                        onClick: () => handleMarkAsRead(item._id)
                      } : null,
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => handleDelete(item._id)
                      }
                    ].filter(Boolean)
                  }}
                  trigger={['click']}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    type="text" 
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </List.Item>
            )}
            pagination={{
              current: page,
              total,
              pageSize: limit,
              onChange: (newPage) => setPage(newPage),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} notifications`
            }}
          />
        )}
      </Card>
    </BusinessOwnerLayout>
  )
}
