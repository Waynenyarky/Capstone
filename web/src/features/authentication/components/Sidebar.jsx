import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
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
        // Navigate for immediate feedback, but logout() will also trigger a redirect
        // handled gracefully by ProtectedRoute's isLoggingOut check.
        navigate('/login')
        logout()
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
    
    // Programmatic navigation for better click handling
    if (item.to) {
      navigate(item.to)
    }
  }

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #f0f0f0', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Avatar size={64} src={currentUser?.avatar} style={{ marginBottom: 12, border: '2px solid #1890ff' }} icon={<UserOutlined />} />
        <div style={{ marginTop: 8 }}>
          <Text strong style={{ fontSize: 16 }}>{currentUser?.name ?? currentUser?.email ?? 'Guest'}</Text>
        </div>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>{role?.replace('_', ' ') ?? 'Visitor'}</Text>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        onClick={({ key }) => {
            const item = items.find(i => i.key === key)
            if (item) {
                onSelect({ key })
                handleItemClick(item)
            }
        }}
        style={{ borderRight: 0, flex: 1, padding: '12px 0' }}
        items={items.map(item => ({
          key: item.key,
          icon: item.icon,
          label: item.label, // Removed Link wrapper to rely on onClick
          style: { margin: '4px 8px', borderRadius: 6, width: 'auto' }
        }))}
      />
      
      <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>© {new Date().getFullYear()} {import.meta.env.VITE_APP_BRAND_NAME || 'Capstone'}</Text>
      </div>
      
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </div>
  )
}
