import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout, Grid, Space, Typography, Button, Dropdown, Avatar, Badge, Spin, theme } from 'antd'
import {
  EllipsisOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import { getNotifications, getUnreadCount, markAsRead } from '@/features/user/services/notificationService'

dayjs.extend(relativeTime)

const { Content } = Layout
const { useBreakpoint } = Grid
const { Text } = Typography

const NOTIFICATIONS_POLL_MS = 30000
const NOTIFICATIONS_PAGE_SIZE = 5
const ADMIN_VIEW_ALL_NOTIFICATIONS_PATH = '/notifications'

/** Initials from currentUser (firstName + lastName, or email, or fallback) */
function getAvatarInitials(currentUser) {
  if (!currentUser) return 'U'
  const first = (currentUser.firstName || '').trim()
  const last = (currentUser.lastName || '').trim()
  if (first || last) return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'U'
  const email = (currentUser.email || currentUser.name || '').trim()
  if (email.length >= 2) return email.slice(0, 2).toUpperCase()
  return email[0]?.toUpperCase() || 'U'
}

/** Flatten headerActions so Space-wrapped buttons become individual items for vertical stacking */
function flattenActionChildren(node) {
  const arr = React.Children.toArray(node)
  if (arr.length === 1 && arr[0]?.props?.children != null) {
    const inner = React.Children.toArray(arr[0].props.children)
    // Only unwrap when parent has multiple element children (e.g. Space with multiple buttons)
    if (inner.length > 1 && inner.every(React.isValidElement)) {
      return inner
    }
  }
  return arr
}

function getNotificationIcon(type, token) {
  switch (type) {
    case 'application_approved':
      return <CheckCircleOutlined style={{ color: token.colorSuccess }} />
    case 'application_rejected':
      return <CloseCircleOutlined style={{ color: token.colorError }} />
    case 'application_needs_revision':
      return <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
    case 'application_review_started':
      return <InfoCircleOutlined style={{ color: token.colorInfo }} />
    case 'approval_request_pending':
      return <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
    case 'approval_resolved':
      return <CheckCircleOutlined style={{ color: token.colorSuccess }} />
    case 'restricted_field_attempt':
    case 'security_alert':
      return <ExclamationCircleOutlined style={{ color: token.colorError }} />
    case 'tamper_incident':
    case 'system_alert':
      return <ExclamationCircleOutlined style={{ color: token.colorError }} />
    case 'recovery_request_pending':
    case 'deletion_request_pending':
      return <InfoCircleOutlined style={{ color: token.colorWarning }} />
    default:
      return <InfoCircleOutlined style={{ color: token.colorPrimary }} />
  }
}

export default function AdminLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  showPageHeader = true,
  headerContent,
}) {
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md
  const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false)

  const profileMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'View settings',
      onClick: () => navigate('/settings-profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => logout(),
    },
  ]

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const fetchNotifications = React.useCallback(async () => {
    if (!currentUser) return
    setLoadingNotifications(true)
    try {
      const [notificationsResponse, count] = await Promise.all([
        getNotifications({ page: 1, limit: NOTIFICATIONS_PAGE_SIZE }),
        getUnreadCount(),
      ])
      const list = notificationsResponse?.notifications ?? notificationsResponse ?? []
      setNotifications(Array.isArray(list) ? list : [])
      setUnreadCount(typeof count === 'number' ? count : count?.count ?? 0)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, NOTIFICATIONS_POLL_MS)
    return () => clearInterval(interval)
  }, [currentUser, fetchNotifications])

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id)
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        )
      }
      setNotificationsOpen(false)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const notificationPanelContent = (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        minWidth: 320,
        maxWidth: 400,
        maxHeight: 400,
        overflow: 'auto',
      }}
    >
      <div style={{ padding: 12, borderBottom: `1px solid ${token.colorBorder}` }}>
        <Text strong>Notifications</Text>
      </div>
      <div style={{ padding: 8 }}>
        {loadingNotifications ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Text type="secondary">No new notifications</Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            {notifications.map((n, i) => (
              <div
                key={n._id || i}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(n)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  borderRadius: token.borderRadius,
                  backgroundColor: !n.read ? token.colorInfoBg : 'transparent',
                }}
              >
                <Space size="small" align="start" style={{ width: '100%' }}>
                  {getNotificationIcon(n.type, token)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong={!n.read} style={{ display: 'block', fontSize: 13 }}>
                      {n.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                      {(n.message || '').length > 60
                        ? `${(n.message || '').slice(0, 60)}...`
                        : n.message || ''}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      {n.createdAt ? dayjs(n.createdAt).fromNow() : ''}
                    </Text>
                  </div>
                </Space>
              </div>
            ))}
          </Space>
        )}
      </div>
      <div
        style={{
          padding: 8,
          borderTop: `1px solid ${token.colorBorder}`,
          textAlign: 'center',
        }}
      >
        <Link
          to={ADMIN_VIEW_ALL_NOTIFICATIONS_PATH}
          onClick={() => setNotificationsOpen(false)}
          style={{ fontSize: 13 }}
        >
          View all notifications
        </Link>
      </div>
    </div>
  )

  // Optional: allow callers to override sidebar header content.
  // Defaults to a simple Admin header.
  const defaultSidebarHeader = (
    <div style={{ padding: 12 }}>
      <Text strong>Admin</Text>
      {currentUser?.email && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {currentUser.email}
        </Text>
      )}
      <div style={{ marginTop: 8 }}>
        <Button size="small" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )

  const sidebarHeader = headerContent ?? defaultSidebarHeader

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar
          itemOverrides={sidebarOverrides}
          hiddenKeys={hiddenSidebarKeys}
          headerContent={sidebarHeader}
        />
      )}
      <Layout>
        <Content
          style={{
            background: token.colorBgLayout,
            overflow: 'hidden',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {showPageHeader && (pageTitle || headerActions || currentUser) && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  flexWrap: 'wrap',
                  gap: 12,
                  borderBottom: `1px solid ${token.colorBorder}`,
                }}
              >
                <Space size={10} align="center">
                  {pageIcon && (
                    <span
                      style={{
                        fontSize: 16,
                        color: '#fff',
                        background: token.colorPrimary,
                        padding: 6,
                        height: 32,
                        width: 32,
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {pageIcon}
                    </span>
                  )}
                  {pageTitle && (
                    <Text strong style={{ fontSize: isMobile ? 16 : 18 }}>
                      {pageTitle}
                    </Text>
                  )}
                </Space>

                <Space size="middle" wrap>
                  {headerActions &&
                    (isMobile ? (
                      <Dropdown
                        open={actionsMenuOpen}
                        onOpenChange={setActionsMenuOpen}
                        trigger={['click']}
                        placement="bottomRight"
                        popupRender={() => {
                          const actions = flattenActionChildren(headerActions)
                          return (
                            <div
                              style={{
                                background: token.colorBgContainer,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowSecondary,
                                padding: 8,
                                minWidth: 180,
                              }}
                            >
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                {actions.map((child, i) => {
                                  if (!React.isValidElement(child)) return null
                                  const origOnClick = child.props?.onClick
                                  return (
                                    <div key={i} style={{ width: '100%' }}>
                                      {React.cloneElement(child, {
                                        style: { ...child.props?.style, width: '100%' },
                                        onClick: (...args) => {
                                          origOnClick?.(...args)
                                          setActionsMenuOpen(false)
                                        },
                                      })}
                                    </div>
                                  )
                                })}
                              </Space>
                            </div>
                          )
                        }}
                      >
                        <Button icon={<EllipsisOutlined />} />
                      </Dropdown>
                    ) : (
                      headerActions
                    ))}
                  {currentUser && (
                    <Dropdown
                      open={notificationsOpen}
                      onOpenChange={setNotificationsOpen}
                      trigger={['click']}
                      placement="bottomRight"
                      popupRender={() => notificationPanelContent}
                    >
                      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                        <Button
                          icon={<BellOutlined style={{ fontSize: 18 }} />}
                          aria-label="Notifications"
                        />
                      </Badge>
                    </Dropdown>
                  )}
                  {currentUser && (
                    <Dropdown
                      menu={{ items: profileMenuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button
                        type="button"
                        aria-label="Profile menu"
                        style={{
                          padding: 0,
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Avatar
                          src={currentUser.avatar}
                          style={{ backgroundColor: token.colorPrimary }}
                        >
                          {!currentUser.avatar ? getAvatarInitials(currentUser) : null}
                        </Avatar>
                      </button>
                    </Dropdown>
                  )}
                </Space>
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

