import React from 'react'
import { Layout } from 'antd'
import Sidebar from '@/features/authentication/components/Sidebar'
import TopBar from './TopBar'

const { Content } = Layout

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
        />
        <Content style={{ 
          padding: '40px', 
          background: '#f0f2f5',
          overflowY: 'auto',
          height: 'calc(100vh - 64px)'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
