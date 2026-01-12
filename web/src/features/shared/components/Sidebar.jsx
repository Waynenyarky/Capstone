import React, { useState } from 'react'
import { Layout, Menu, Typography, Grid, Drawer, Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'

const { Sider } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const SidebarContent = ({ 
  collapsed, 
  items, 
  activeKey, 
  handleItemClick, 
  currentUser,
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
        transition: 'all 0.2s'
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          background: 'linear-gradient(135deg, #003a70 0%, #001529 100%)', 
          borderRadius: 8, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          flexShrink: 0,
          cursor: 'default',
          boxShadow: '0 2px 6px rgba(0, 58, 112, 0.3)'
        }}>
          {import.meta.env.VITE_APP_BRAND_NAME?.[0] || 'B'}
        </div>
        {!collapsed && (
          <span style={{ 
            marginLeft: 12, 
            fontWeight: 700, 
            fontSize: 16, 
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
        selectedKeys={[activeKey]}
        onClick={({ key }) => {
            const item = items.find(i => i.key === key)
            if (item) {
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

/**
 * Pure Sidebar Component (UI Only)
 * @param {object[]} items - Menu items
 * @param {string} activeKey - Currently selected key
 * @param {function} onItemClick - Callback when item is clicked
 * @param {object} currentUser - Current user object
 * @param {object} siderProps - Props passed to Antd Sider
 */
export default function Sidebar({ items = [], activeKey, onItemClick, currentUser, ...siderProps }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const screens = useBreakpoint()
  
  // Determine if we are on a mobile screen (md breakpoint = 768px)
  const isMobile = (screens.md === false)

  const handleMobileClick = (item) => {
    setMobileOpen(false)
    if (onItemClick) onItemClick(item)
  }

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
              handleItemClick={handleMobileClick}
              currentUser={currentUser}
            />
          </Drawer>
        </>
      ) : (
        <Sider
          width={260}
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
            zIndex: 10,
            ...siderProps.style
          }}
          {...siderProps}
        >
          <SidebarContent 
            collapsed={collapsed}
            items={items}
            activeKey={activeKey}
            handleItemClick={onItemClick}
            currentUser={currentUser}
          />
        </Sider>
      )}
    </>
  )
}
