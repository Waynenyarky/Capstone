import React from 'react'
import { Layout, Typography, Button } from 'antd'
import { Link } from 'react-router-dom'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import { TopBar } from '@/features/shared'

const { Title, Paragraph } = Typography

export default function StaffLayout({ 
  children, 
  title, 
  description, 
  roleLabel,
  showTopBar = true, // Defaulting to true for consistency
  fullWidth = false // Allow full width layout
}) {
  const { currentUser, logout } = useAuthSession()

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <Layout>
        {showTopBar && (
          <TopBar 
            title={roleLabel ? `${roleLabel} Workspace` : 'Staff Workspace'} 
            roleLabel={roleLabel || 'Staff'} 
            currentUser={currentUser}
            onLogout={logout}
          />
        )}
        <Layout.Content style={{ padding: fullWidth ? 24 : 32 }}>
          <div style={fullWidth ? { width: '100%' } : { maxWidth: 1000, margin: '0 auto' }}>
            {/* Header Section */}
            {(title || description) && (
              <div style={{ marginBottom: 18 }}>
                {title && <Title level={2}>{title}</Title>}
                {description && <Paragraph type="secondary">{description}</Paragraph>}
                <div style={{ marginTop: 12 }}>
                  <Link to="/">
                    <Button type="default">Back</Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Main Content */}
            {children}
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
