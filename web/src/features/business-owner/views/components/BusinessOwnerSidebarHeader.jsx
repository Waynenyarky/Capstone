import React, { useState, useEffect } from 'react'
import { Avatar, Dropdown, Menu, Space, Typography, Badge, Button, Tag, theme, Spin } from 'antd'
import { UserOutlined, BellOutlined, LogoutOutlined, ShopOutlined, DownOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { resolveAvatarUrl } from '@/lib/utils'
import { useConfirmLogoutModal } from '@/features/authentication/hooks/useConfirmLogoutModal'
import ConfirmLogoutModal from '@/features/authentication/views/components/ConfirmLogoutModal'
import { getNotifications, getUnreadCount, markAsRead } from '@/features/user/services/notificationService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const { Text } = Typography

dayjs.extend(relativeTime)

export default function BusinessOwnerSidebarHeader({
  title,
  businessName,
  hideNotifications,
  hideProfileSettings,
  currentUser,
  onLogout,
  viewNotificationsPath = '/owner/notifications'
}) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({
    onConfirm: async () => {
      if (onLogout) await onLogout()
    }
  })

  const initials = React.useMemo(() => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    if (currentUser?.name) {
      return currentUser.name.substring(0, 2).toUpperCase()
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U'
  }, [currentUser])

  const userMenuItems = [
    ...(hideProfileSettings ? [] : [
      { key: 'profile', label: <Link to="/settings-profile">Profile Settings</Link>, icon: <UserOutlined /> },
      { type: 'divider' }
    ]),
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: show }
  ]

  useEffect(() => {
    if (hideNotifications || !currentUser) return
    const fetchNotifications = async () => {
      setLoadingNotifications(true)
      try {
        const [notificationsResponse, count] = await Promise.all([
          getNotifications({ page: 1, limit: 5 }),
          getUnreadCount()
        ])
        const notifications = notificationsResponse?.notifications || notificationsResponse || []
        setNotifications(Array.isArray(notifications) ? notifications : [])
        setUnreadCount(typeof count === 'number' ? count : (count?.count || 0))
      } catch {
        setNotifications([])
        setUnreadCount(0)
      } finally {
        setLoadingNotifications(false)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [hideNotifications, currentUser])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_approved': return <CheckCircleOutlined style={{ color: token.colorSuccess }} />
      case 'application_rejected': return <CloseCircleOutlined style={{ color: token.colorError }} />
      case 'application_needs_revision': return <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
      case 'application_review_started': return <InfoCircleOutlined style={{ color: token.colorInfo }} />
      default: return <InfoCircleOutlined style={{ color: token.colorPrimary }} />
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n))
      }
      if (viewNotificationsPath) navigate(viewNotificationsPath)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const notificationMenuItems = []
  if (loadingNotifications) {
    notificationMenuItems.push({
      key: 'loading',
      label: <div style={{ textAlign: 'center', padding: '16px' }}><Spin size="small" /></div>,
      disabled: true
    })
  } else if (notifications.length === 0) {
    notificationMenuItems.push({
      key: 'empty',
      label: <Text type="secondary" style={{ padding: '8px 16px' }}>No new notifications</Text>,
      disabled: true
    })
  } else {
    notifications.forEach((notification, index) => {
      notificationMenuItems.push({
        key: notification._id || index,
        label: (
          <div
            style={{
              padding: '8px 0',
              cursor: 'pointer',
              backgroundColor: !notification.read ? token.colorInfoBg : 'transparent',
              margin: '0 -8px',
              paddingLeft: '12px',
              paddingRight: '12px'
            }}
            onClick={() => handleNotificationClick(notification)}
          >
            <Space size="small" align="start" style={{ width: '100%' }}>
              {getNotificationIcon(notification.type)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong={!notification.read} style={{ display: 'block', fontSize: '13px' }}>{notification.title}</Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 2 }}>
                  {notification.message?.length > 60 ? `${notification.message.substring(0, 60)}...` : notification.message}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: 4 }}>
                  {dayjs(notification.createdAt).fromNow()}
                </Text>
              </div>
            </Space>
          </div>
        )
      })
    })
  }
  if (viewNotificationsPath) {
    notificationMenuItems.push({ type: 'divider' })
    notificationMenuItems.push({
      key: 'view-all',
      label: <Link to={viewNotificationsPath} style={{ textAlign: 'center', display: 'block', padding: '8px' }}>View all notifications</Link>
    })
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {typeof title === 'string' && (
          <Text strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{title}</Text>
        )}
        {businessName && (
          <Tag icon={<ShopOutlined />} color="gold" style={{ marginRight: 0, width: 'fit-content' }}>
            {businessName.length > 20 ? `${businessName.substring(0, 20)}...` : businessName}
          </Tag>
        )}
        <Space size="middle" wrap>
          {!hideNotifications && (
            <Dropdown menu={{ items: notificationMenuItems }} trigger={['click']} placement="bottomRight">
              <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>
          )}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }} size="small">
              <Avatar
                size="small"
                src={currentUser?.avatar ? <img src={resolveAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                style={{ backgroundColor: token.colorPrimary }}
              >
                {!currentUser?.avatar && initials}
              </Avatar>
              <Text style={{ fontSize: 13 }}>{currentUser?.firstName || currentUser?.name || 'User'}</Text>
              <DownOutlined style={{ fontSize: 10 }} />
            </Space>
          </Dropdown>
        </Space>
      </div>
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </>
  )
}
