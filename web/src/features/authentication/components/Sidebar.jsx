import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import useSidebar from '@/features/authentication/hooks/useSidebar'
import { useAuthSession } from '@/features/authentication'

const { Text } = Typography

export default function Sidebar() {
  const { items, selected, onSelect, role } = useSidebar()
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()

  const handleItemClick = (item) => {
    if (item.type === 'action' && item.key === 'logout') {
      logout()
      navigate('/login')
      return
    }
    // default: selection handled by Menu onClick; navigation via Link
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Avatar size={56} src={currentUser?.avatar} />
        <div style={{ marginTop: 8 }}>
          <Text strong>{currentUser?.name ?? currentUser?.email ?? 'Guest'}</Text>
        </div>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{role ?? 'visitor'}</Text>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selected]}
        onClick={({ key }) => onSelect({ key })}
        style={{ borderRight: 0, flex: 1 }}
      >
        {items.map(item => (
          <Menu.Item key={item.key} onClick={() => handleItemClick(item)}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
          </Menu.Item>
        ))}
      </Menu>
    </div>
  )
}
