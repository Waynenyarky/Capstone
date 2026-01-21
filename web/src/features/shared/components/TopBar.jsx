import React, { useState, useEffect } from 'react'
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Badge, Button, Tag, theme, Spin, Empty, Modal } from 'antd'
import { UserOutlined, BellOutlined, LogoutOutlined, ShopOutlined, DownOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { resolveAvatarUrl } from '@/lib/utils'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { useConfirmLogoutModal } from '@/features/authentication/hooks/useConfirmLogoutModal'
import ConfirmLogoutModal from '@/features/authentication/views/components/ConfirmLogoutModal'
import { getNotifications, getUnreadCount, markAsRead } from '@/features/user/services/notificationService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const { Header } = Layout
const { Text } = Typography

dayjs.extend(relativeTime)

export default function TopBar({ 
  title, 
  businessName, 
  hideNotifications, 
  hideProfileSettings, 
  roleLabel,
  currentUser,
  onLogout,
  viewNotificationsPath = '/notifications'
}) {
  const { token } = theme.useToken();
  const { currentTheme, themeOverrides } = useAppTheme();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  
  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({
    onConfirm: async () => {
      if (onLogout) {
        await onLogout()
      }
    }
  })
  
  const handleLogoutClick = () => {
    show()
  }
  
  // Logic to determine header background
  // If we are in Default theme AND have no overrides, use the signature Navy gradient
  // Otherwise, use the layout/sidebar background color from the theme
  const isDefaultNavy = currentTheme === THEMES.DEFAULT && !themeOverrides.colorPrimary;
  
  // For Dark theme, we want to match the dark sidebar (usually #141414 or #001529 depending on config)
  // For other themes, we want to match the sidebar background
  // Logic mirrored from Sidebar.jsx to ensure consistency
  let themeSidebarBg = '#001529'; // Default Blue
  if (currentTheme === THEMES.DOCUMENT || currentTheme === THEMES.SUNSET || currentTheme === THEMES.ROYAL) {
     themeSidebarBg = token.colorBgLayout;
  } else if (currentTheme === THEMES.BLOSSOM) {
     themeSidebarBg = token.colorBgContainer;
  } else if (currentTheme === THEMES.DARK) {
     // In Sidebar.jsx, this is explicitly set to #141414 for Dark theme
     themeSidebarBg = '#141414';
  } else if (themeOverrides.colorPrimary) {
     // If user customized the primary color in Default theme, use that gradient or color
     // But wait, if we are here, isDefaultNavy is false.
     // So we fall through to headerBackground assignment.
     // We should probably use the primary color if it's an override on Default theme.
     themeSidebarBg = `linear-gradient(135deg, ${token.colorPrimaryActive || token.colorPrimary} 0%, ${token.colorPrimary} 100%)`;
  }
  
  const headerBackground = isDefaultNavy 
    ? 'linear-gradient(135deg, #001529 0%, #003a70 100%)' 
    : themeSidebarBg;
    
  // Since we are matching the sidebar, we need to handle text color carefully
  // If it's a light theme (like Document/Blossom/Sunset) where sidebar might be light, we need dark text
  // If it's a dark theme or Default Navy, we need light text
  const isLightTheme = [THEMES.DOCUMENT, THEMES.BLOSSOM, THEMES.SUNSET, THEMES.ROYAL].includes(currentTheme);
  const textColor = isLightTheme ? token.colorText : '#fff';
  const iconColor = isLightTheme ? token.colorTextSecondary : '#fff';
  const secondaryTextColor = isLightTheme ? token.colorTextSecondary : 'rgba(255, 255, 255, 0.75)';

  const initials = React.useMemo(() => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    if (currentUser?.name) {
      return currentUser.name.substring(0, 2).toUpperCase()
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U'
  }, [currentUser])

  // Derive role label if not provided
  const displayRole = React.useMemo(() => {
    if (roleLabel) return roleLabel
    if (currentUser?.role?.name) return currentUser.role.name
    // Fallback for business owner (default behavior)
    return 'Business Owner'
  }, [roleLabel, currentUser])

  const isLguOfficerRole = React.useMemo(() => {
    const roleSlug = currentUser?.role?.slug || ''
    if (['lgu_officer', 'lgu_manager', 'staff'].includes(roleSlug)) return true
    return typeof roleLabel === 'string' && roleLabel.toLowerCase().includes('lgu')
  }, [currentUser, roleLabel])

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/settings-profile">Profile Settings</Link>,
      icon: <UserOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogoutClick
    }
  ]

  // Filter items if hideProfileSettings is true
  const filteredUserItems = hideProfileSettings 
    ? userMenuItems.filter(item => item.key === 'logout') 
    : userMenuItems

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (hideNotifications || !currentUser) return
    
    const fetchNotifications = async () => {
      setLoadingNotifications(true)
      try {
        const [notificationsResponse, count] = await Promise.all([
          getNotifications({ page: 1, limit: 5 }),
          getUnreadCount()
        ])
        
        // Handle response structure: { ok: true, notifications: [...], pagination: {...} }
        const notifications = notificationsResponse?.notifications || notificationsResponse || []
        setNotifications(Array.isArray(notifications) ? notifications : [])
        
        // Ensure count is a number
        const unreadCountValue = typeof count === 'number' ? count : (count?.count || 0)
        setUnreadCount(unreadCountValue)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        // Set empty array on error to prevent UI issues
        setNotifications([])
        setUnreadCount(0)
      } finally {
        setLoadingNotifications(false)
      }
    }
    
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [hideNotifications, currentUser])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_approved':
        return <CheckCircleOutlined style={{ color: token.colorSuccess }} />
      case 'application_rejected':
        return <CloseCircleOutlined style={{ color: token.colorError }} />
      case 'application_needs_revision':
        return <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
      case 'application_review_started':
        return <InfoCircleOutlined style={{ color: token.colorInfo }} />
      default:
        return <InfoCircleOutlined style={{ color: token.colorPrimary }} />
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
      if (isLguOfficerRole) {
        setSelectedNotification(notification)
        setNotificationModalVisible(true)
      } else if (viewNotificationsPath) {
        navigate(viewNotificationsPath)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const userMenu = <Menu items={filteredUserItems} />

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
                <Text strong={!notification.read} style={{ display: 'block', fontSize: '13px' }}>
                  {notification.title}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 2 }}>
                  {notification.message.length > 60 
                    ? `${notification.message.substring(0, 60)}...` 
                    : notification.message}
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

  const notificationMenu = <Menu items={notificationMenuItems} />

  return (
    <Header style={{ 
      background: headerBackground, 
      padding: '0 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      width: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderBottom: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18, marginRight: 16, textTransform: 'capitalize', color: textColor }}>{title}</Text>
        {businessName && (
          <Tag icon={<ShopOutlined />} color="gold">
            {businessName}
          </Tag>
        )}
      </div>

      <Space size={24}>
        {!hideNotifications && (
          <Dropdown menu={{ items: notificationMenu.props.items }} trigger={['click']} placement="bottomRight">
            <Badge count={unreadCount} size="small" offset={[-5, 5]}>
              <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 20, color: iconColor }} />} />
            </Badge>
          </Dropdown>
        )}

        <Dropdown menu={{ items: userMenu.props.items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }} className="hover-bg-dark">
            <Avatar 
              src={currentUser?.avatar ? <img src={resolveAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null} 
              style={{ backgroundColor: token.colorPrimary, border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {!currentUser?.avatar && initials}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 14, color: textColor }}>
                {currentUser?.firstName || currentUser?.name || 'User'}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, color: secondaryTextColor }}>
                {displayRole}
              </Text>
            </div>
            <DownOutlined style={{ fontSize: 12, color: secondaryTextColor, marginLeft: 4 }} />
          </Space>
        </Dropdown>
      </Space>
      <ConfirmLogoutModal 
        open={open} 
        onConfirm={handleConfirm} 
        onCancel={hide} 
        confirmLoading={confirming} 
      />
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
    </Header>
  )
}
