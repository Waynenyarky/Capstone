import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useSidebar from '@/features/authentication/hooks/useSidebar'
import { useAuthSession } from '@/features/authentication'
import ConfirmLogoutModal from '@/features/authentication/components/ConfirmLogoutModal.jsx'
import { useConfirmLogoutModal } from '@/features/authentication/hooks'

const { Text } = Typography

export default function Sidebar() {
  const { items, selected, onSelect, role } = useSidebar()
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()
  const location = useLocation()

  // derive the active key from the current location so route changes
  // (via Link) immediately reflect as the selected/highlighted item
  const activeKey = React.useMemo(() => {
    const match = items.find(i => i.to && location.pathname.startsWith(i.to))
    return match ? match.key : selected
  }, [items, location.pathname, selected])

  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({
    onConfirm: async () => {
      // perform logout and navigate
      try {
        logout()
        navigate('/login')
      } catch (err) {
        void err
      }
    }
  })

  const handleItemClick = (item) => {
    if (item.type === 'action' && item.key === 'logout') {
      show()
      return
    }
    // default: selection handled by Menu onClick; navigation via Link
  }

  return (
    <div style={{ position: 'sticky', top: 0, height: '98 vh', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'auto' }}>
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
        selectedKeys={[activeKey]}
        onClick={({ key }) => onSelect({ key })}
        style={{ borderRight: 0, flex: 1 }}
      >
        {items.map(item => (
          <Menu.Item
            key={item.key}
            onClick={() => handleItemClick(item)}
            style={item.key === activeKey ? { background: '#e6f7ff' } : undefined}
          >
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
          </Menu.Item>
        ))}
      </Menu>
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </div>
  )
}
