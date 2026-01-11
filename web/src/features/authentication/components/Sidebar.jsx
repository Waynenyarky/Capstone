import React, { useState } from 'react'
import { Layout, Menu, Avatar, Typography, Tag, Tooltip, Grid, Drawer, Button } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import useSidebar from '@/features/authentication/hooks/useSidebar'
import { useAuthSession } from '@/features/authentication'
import ConfirmLogoutModal from '@/features/authentication/components/ConfirmLogoutModal.jsx'
import { useConfirmLogoutModal } from '@/features/authentication/hooks'
import { resolveAvatarUrl } from '@/lib/utils'

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
  const displayName = React.useMemo(() => {
    if (currentUser?.firstName || currentUser?.lastName) {
      return `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
    }
    return currentUser?.name || currentUser?.email || 'Guest'
  }, [currentUser])

  const initials = React.useMemo(() => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    if (currentUser?.name) {
      return currentUser.name.substring(0, 2).toUpperCase()
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U'
  }, [currentUser])

  return (
    <>
      {/* Brand / Logo */}
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0' : '0 24px',
        borderBottom: '1px solid #f0f0f0',
        transition: 'all 0.2s'
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          background: '#1890ff', 
          borderRadius: 6, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          flexShrink: 0,
          cursor: 'default'
        }}>
          {import.meta.env.VITE_APP_BRAND_NAME?.[0] || 'B'}
        </div>
        {!collapsed && (
          <span style={{ 
            marginLeft: 12, 
            fontWeight: 700, 
            fontSize: 16, 
            color: '#333',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
          </span>
        )}
      </div>

      {/* User Profile Summary */}
      <div style={{ 
        padding: collapsed ? '24px 8px' : '24px 20px', 
        textAlign: 'center', 
        borderBottom: '1px solid #f0f0f0',
        transition: 'all 0.2s'
      }}>
         <Tooltip title={collapsed ? displayName : ''} placement="right">
           <Avatar 
             size={collapsed ? 40 : 64} 
             src={currentUser?.avatar ? <img src={resolveAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null} 
             style={{ 
              marginBottom: collapsed ? 0 : 12, 
              border: '2px solid #1890ff',
              backgroundColor: '#1890ff',
              transition: 'all 0.2s' 
            }} 
           >
             {!currentUser?.avatar && initials}
           </Avatar>
         </Tooltip>
         
         {!collapsed && (
           <div style={{ animation: 'fadeIn 0.5s' }}>
             <div style={{ marginTop: 8 }}>
               <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.2 }}>{displayName}</Text>
             </div>
             <div style={{ marginTop: 4 }}>
               <Tag color="blue" style={{ margin: 0, textTransform: 'capitalize', border: 'none', background: '#e6f7ff', color: '#1890ff' }}>
                  {role?.replace('_', ' ') ?? 'Visitor'}
               </Tag>
             </div>
           </div>
         )}
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
          theme="light"
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
            borderRight: '1px solid #f0f0f0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
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
