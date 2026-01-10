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
  hiddenSidebarKeys = [] 
}) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        itemOverrides={sidebarOverrides} 
        hiddenKeys={hiddenSidebarKeys} 
      />
      <Layout>
        <TopBar title={pageTitle} businessName={businessName} />
        <Content style={{ 
          padding: '24px 40px', 
          background: '#f5f7fb',
          overflowY: 'auto',
          height: 'calc(100vh - 64px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
