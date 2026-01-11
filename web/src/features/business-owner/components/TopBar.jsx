import React from 'react'
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Badge, Button, Tag } from 'antd'
import { UserOutlined, BellOutlined, LogoutOutlined, ShopOutlined, DownOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { Link } from 'react-router-dom'
import { resolveAvatarUrl } from '@/lib/utils'

const { Header } = Layout
const { Text } = Typography

export default function TopBar({ title, businessName, hideNotifications, hideProfileSettings, roleLabel }) {
  const { currentUser, logout } = useAuthSession()

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
      onClick: logout
    }
  ]

  // Filter items if hideProfileSettings is true
  const filteredUserItems = hideProfileSettings 
    ? userMenuItems.filter(item => item.key === 'logout') 
    : userMenuItems

  const userMenu = <Menu items={filteredUserItems} />

  const notificationMenu = (
    <Menu items={[
        { key: 'empty', label: <Text type="secondary" style={{ padding: '8px 16px' }}>No new notifications</Text>, disabled: true }
    ]} />
  )

  return (
    <Header style={{ 
      background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)', 
      padding: '0 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      width: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18, marginRight: 16, textTransform: 'capitalize', color: '#fff' }}>{title === 'Business Registration' ? 'BizClear' : title}</Text>
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
              <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 20, color: '#fff' }} />} />
            </Badge>
          </Dropdown>
        )}

        <Dropdown menu={{ items: userMenu.props.items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }} className="hover-bg-dark">
            <Avatar 
              src={currentUser?.avatar ? <img src={resolveAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null} 
              style={{ backgroundColor: '#0050b3', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {!currentUser?.avatar && initials}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 14, color: '#fff' }}>
                {currentUser?.firstName || currentUser?.name || 'User'}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                {displayRole}
              </Text>
            </div>
            <DownOutlined style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginLeft: 4 }} />
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
