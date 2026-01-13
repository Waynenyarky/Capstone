import React from 'react'
import { Layout, Grid, theme } from 'antd'
import { TopBar } from '@/features/shared'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'

const { Content } = Layout
const { useBreakpoint } = Grid

export default function BusinessOwnerLayout({ 
  children, 
  pageTitle, 
  businessName,
  sidebarOverrides = {}, 
  hiddenSidebarKeys = [],
  hideSidebar = false,
  hideNotifications = false,
  hideProfileSettings = false
}) {
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar 
          itemOverrides={sidebarOverrides} 
          hiddenKeys={hiddenSidebarKeys} 
        />
      )}
      <Layout>
        <TopBar 
          title={pageTitle} 
          businessName={businessName} 
          hideNotifications={hideNotifications}
          hideProfileSettings={hideProfileSettings}
          currentUser={currentUser}
          onLogout={logout}
          viewNotificationsPath="/owner/notifications"
        />
        <Content style={{  
          padding: isMobile ? '16px' : '24px', 
          background: token.colorBgLayout,
          overflowY: 'auto',
          height: 'calc(100vh - 64px)'
        }}>
          <div style={{ minHeight: '100%' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
