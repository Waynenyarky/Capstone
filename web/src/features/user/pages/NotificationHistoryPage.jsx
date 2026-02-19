import React, { useState, useEffect, useCallback } from 'react'
import { List, Typography, Card, Tag, Space, Button, theme, Empty, Dropdown, Divider, message, Select, Grid } from 'antd'
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, MoreOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService'
import dayjs from 'dayjs'
import { useAuthSession } from '@/features/authentication'
import AdminLayout from '@/features/admin/components/AdminLayout'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'

const { Text } = Typography
const { Option } = Select
const { useBreakpoint } = Grid

export default function NotificationHistoryPage() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const navigate = useNavigate()
  const { role } = useAuthSession()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [filterType, setFilterType] = useState('all') // 'all', 'unread', 'read'

  const fetchNotifications = useCallback(async () => {
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
  }, [page, filterType])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

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
        navigate('/owner/permits')
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const headerActions = (
    <Space wrap>
      <Select
        value={filterType}
        onChange={setFilterType}
        style={{ width: 120 }}
      >
        <Option value="all">All</Option>
        <Option value="unread">Unread</Option>
      </Select>
      {unreadCount > 0 && (
        <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
          Mark all read
        </Button>
      )}
    </Space>
  )

  const content = (
    <div
      style={
        isMobile
          ? { overflow: 'auto', flex: 1 }
          : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      }
    >
      <Card
        loading={loading}
        style={{
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowSecondary,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
        styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}
      >
        {notifications.length === 0 && !loading ? (
          <Empty description="No notifications" style={{ padding: 48 }} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            style={{ flex: 1, overflow: 'auto' }}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '16px 24px',
                  backgroundColor: !item.read ? token.colorInfoBg : 'transparent',
                  borderLeft: !item.read ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => handleNotificationClick(item)}
                actions={[
                  <Button
                    key="discard"
                    type="text"
                    icon={<DeleteOutlined />}
                    title="Discard"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item._id)
                    }}
                    aria-label="Discard notification"
                  />,
                  <Dropdown
                    key="more"
                    menu={{
                      items: [
                        !item.read
                          ? {
                              key: 'mark-read',
                              label: 'Mark as Read',
                              icon: <CheckOutlined />,
                              onClick: () => handleMarkAsRead(item._id)
                            }
                          : null,
                        {
                          key: 'discard',
                          label: 'Discard',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDelete(item._id)
                        }
                      ].filter(Boolean)
                    }}
                    trigger={['click']}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} aria-label="More actions" />
                  </Dropdown>
                ]}
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
              </List.Item>
            )}
            pagination={{
              current: page,
              total,
              pageSize: limit,
              onChange: (newPage) => setPage(newPage),
              showSizeChanger: false,
              showTotal: (t) => `Total ${t} notifications`
            }}
          />
        )}
      </Card>
    </div>
  )

  const layoutProps = {
    pageTitle: 'Notifications',
    pageIcon: <BellOutlined />,
    headerActions
  }

  if (role === 'admin') {
    return (
      <AdminLayout {...layoutProps}>
        {content}
      </AdminLayout>
    )
  }

  if (role === 'business_owner') {
    return (
      <BusinessOwnerLayout {...layoutProps}>
        {content}
      </BusinessOwnerLayout>
    )
  }

  return (
    <AdminLayout {...layoutProps}>
      {content}
    </AdminLayout>
  )
}
