import React from 'react'
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Badge, Button, Tag } from 'antd'
import { UserOutlined, BellOutlined, LogoutOutlined, ShopOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { Link } from 'react-router-dom'
import { resolveAvatarUrl } from '@/lib/utils'

const { Header } = Layout
const { Text } = Typography

export default function TopBar({ title, businessName }) {
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

  const userMenu = (
    <Menu items={[
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
    ]} />
  )

  const notificationMenu = (
    <Menu items={[
        { key: 'empty', label: <Text type="secondary" style={{ padding: '8px 16px' }}>No new notifications</Text>, disabled: true }
    ]} />
  )

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid #f0f0f0',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18, marginRight: 16, textTransform: 'capitalize' }}>{title}</Text>
        {businessName && (
          <Tag icon={<ShopOutlined />} color="blue">
            {businessName}
          </Tag>
        )}
      </div>

      <Space size={24}>
        <Dropdown menu={{ items: notificationMenu.props.items }} trigger={['click']} placement="bottomRight">
          <Badge count={0} size="small">
            <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 20, color: '#666' }} />} />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenu.props.items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }} className="hover-bg">
            <Avatar 
              src={currentUser?.avatar ? <img src={resolveAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null} 
              style={{ backgroundColor: '#1890ff' }}
            >
              {!currentUser?.avatar && initials}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 14 }}>
                {currentUser?.firstName || currentUser?.name || 'User'}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Business Owner
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
