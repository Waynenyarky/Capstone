import React from 'react'
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Badge, Button, Tag, theme } from 'antd'
import { UserOutlined, BellOutlined, LogoutOutlined, ShopOutlined, DownOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { resolveAvatarUrl } from '@/lib/utils'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { useConfirmLogoutModal } from '@/features/authentication/hooks/useConfirmLogoutModal'
import ConfirmLogoutModal from '@/features/authentication/views/components/ConfirmLogoutModal'

const { Header } = Layout
const { Text } = Typography

export default function TopBar({ 
  title, 
  businessName, 
  hideNotifications, 
  hideProfileSettings, 
  roleLabel,
  currentUser,
  onLogout,
  viewNotificationsPath
}) {
  const { token } = theme.useToken();
  const { currentTheme, themeOverrides } = useAppTheme();
  
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

  const userMenu = <Menu items={filteredUserItems} />

  const notificationMenu = (
    <Menu items={[
        { key: 'empty', label: <Text type="secondary" style={{ padding: '8px 16px' }}>No new notifications</Text>, disabled: true },
        ...(viewNotificationsPath ? [
          { type: 'divider' },
          { 
            key: 'view-all', 
            label: <Link to={viewNotificationsPath} style={{ textAlign: 'center', display: 'block' }}>View all notifications</Link> 
          }
        ] : [])
    ]} />
  )

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
        <Text strong style={{ fontSize: 18, marginRight: 16, textTransform: 'capitalize', color: textColor }}>{title === 'Business Registration' ? 'BizClear' : title}</Text>
        {businessName && (
          <Tag icon={<ShopOutlined />} color="gold">
            {businessName}
          </Tag>
        )}
      </div>

      <Space size={24}>
        {!hideNotifications && (
          <Dropdown menu={{ items: notificationMenu.props.items }} trigger={['click']} placement="bottomRight">
            <Badge count={0} size="small">
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
    </Header>
  )
}
