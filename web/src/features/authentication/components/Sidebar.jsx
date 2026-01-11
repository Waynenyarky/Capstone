import React, { useState } from 'react'
import { Layout, Menu, Typography, Grid, Drawer, Button } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { MenuOutlined, DownOutlined } from '@ant-design/icons'
import useSidebar from '@/features/authentication/hooks/useSidebar'
import { useAuthSession } from '@/features/authentication'
import ConfirmLogoutModal from '@/features/authentication/components/ConfirmLogoutModal.jsx'
import { useConfirmLogoutModal } from '@/features/authentication/hooks'

const { Sider } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const SidebarContent = ({ 
  collapsed, 
  items, 
  activeKey, 
  onSelect, 
  handleItemClick, 
  currentUser, 
  role 
}) => {


  return (
    <>
      {/* Brand / Logo */}
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0' : '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.2s'
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', 
          borderRadius: 8, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          flexShrink: 0,
          cursor: 'default',
          boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)'
        }}>
          {import.meta.env.VITE_APP_BRAND_NAME?.[0] || 'B'}
        </div>
        {!collapsed && (
          <span style={{ 
            marginLeft: 12, 
            fontWeight: 700, 
            fontSize: 16, 
            color: '#fff',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
          </span>
        )}
      </div>



      <Menu
        mode="inline"
        theme="dark"
        theme="dark"
        selectedKeys={[activeKey]}
        onClick={({ key }) => {
            const item = items.find(i => i.key === key)
            if (item) {
                onSelect({ key })
                handleItemClick(item)
            }
        }}
        style={{ borderRight: 0, padding: '12px 0' }}
        items={items.map(item => ({
          key: item.key,
          icon: item.icon,
          label: item.label, 
          danger: item.key === 'logout',
          style: { 
            margin: '4px 8px', 
            borderRadius: 6, 
            width: 'auto',
            fontSize: 14 
          }
        }))}
      />
      
      {!collapsed && (
        <div style={{ 
          position: 'absolute', 
          bottom: 48, 
          width: '100%', 
          padding: 16, 
          textAlign: 'center' 
        }}>
          <Text type="secondary" style={{ fontSize: 11 }}>© {new Date().getFullYear()} {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}</Text>
        </div>
      )}
    </>
  )
}

export default function Sidebar({ hiddenKeys = [], renamedKeys = {}, itemOverrides = {}, ...siderProps }) {
  const { items: rawItems, selected, onSelect, role } = useSidebar()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const screens = useBreakpoint()
  
  // Double safety check: ensure items is always an array
  // Also filter out hidden keys and apply renamed labels
  const items = React.useMemo(() => {
    let arr = Array.isArray(rawItems) ? rawItems : []

    // Apply renames
    if (Object.keys(renamedKeys).length > 0) {
      arr = arr.map(item => {
        if (renamedKeys[item.key]) {
          return { ...item, label: renamedKeys[item.key] }
        }
        return item
      })
    }

    // Apply overrides (label, icon, etc)
    if (Object.keys(itemOverrides).length > 0) {
      arr = arr.map(item => {
        if (itemOverrides[item.key]) {
          return { ...item, ...itemOverrides[item.key] }
        }
        return item
      })
    }

    if (hiddenKeys.length > 0) {
      return arr.filter(i => !hiddenKeys.includes(i.key))
    }
    return arr
  }, [rawItems, hiddenKeys, renamedKeys, itemOverrides])
  
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()
  const location = useLocation()

  // derive the active key from the current location so route changes
  // (via Link) immediately reflect as the selected/highlighted item
  const activeKey = React.useMemo(() => {
    // Find all items that match the current path prefix
    const matches = items.filter(i => i.to && location.pathname.startsWith(i.to))
    
    // If multiple matches, pick the one with the longest 'to' path (most specific match)
    // e.g. '/owner/permits' should match 'permit-apps' instead of 'dashboard' ('/owner')
    if (matches.length > 0) {
      matches.sort((a, b) => b.to.length - a.to.length)
      return matches[0].key
    }
    
    return selected
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
      setMobileOpen(false) // Close mobile drawer on navigation
    }
  }

  // Determine if we are on a mobile screen (md breakpoint = 768px)
  // If screens.md is undefined, it might be initial render. Default to desktop (false) or true?
  // Usually Antd defaults to desktop.
  const isMobile = (screens.md === false)

  return (
    <>
      {isMobile ? (
        <>
          <Button 
            icon={<MenuOutlined />} 
            type="text"
            onClick={() => setMobileOpen(true)}
            style={{ 
              position: 'fixed', 
              top: 16, 
              left: 16, 
              zIndex: 1000,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} 
          />
          <Drawer
            placement="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            width={260}
            styles={{ body: { padding: 0 } }}
            closable={false}
          >
            <SidebarContent 
              collapsed={false}
              items={items}
              activeKey={activeKey}
              onSelect={onSelect}
              handleItemClick={handleItemClick}
              currentUser={currentUser}
              role={role}
            />
          </Drawer>
        </>
      ) : (
        <Sider
          width={260}
          theme="dark"
          theme="dark"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          breakpoint="lg"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            background: '#001529',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            background: '#001529',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            zIndex: 10,
            ...siderProps.style
          }}
          {...siderProps}
        >
          <SidebarContent 
            collapsed={collapsed}
            items={items}
            activeKey={activeKey}
            onSelect={onSelect}
            handleItemClick={handleItemClick}
            currentUser={currentUser}
            role={role}
          />
        </Sider>
      )}
      
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </>
  )
}
