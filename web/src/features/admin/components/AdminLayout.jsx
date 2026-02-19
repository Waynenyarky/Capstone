import React from 'react'
import { Layout, Typography, Button, theme } from 'antd'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import { LayoutPageHeader } from '@/features/shared'

const { Content } = Layout
const { Text } = Typography

export default function AdminLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  showPageHeader = true,
  headerContent,
}) {
  const { currentUser, logout } = useAuthSession()
  const { token } = theme.useToken()

  const defaultSidebarHeader = (
    <div style={{ padding: 12 }}>
      <Text strong>Admin</Text>
      {currentUser?.email && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {currentUser.email}
        </Text>
      )}
      <div style={{ marginTop: 8 }}>
        <Button size="small" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )

  const sidebarHeader = headerContent ?? defaultSidebarHeader

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar
          itemOverrides={sidebarOverrides}
          hiddenKeys={hiddenSidebarKeys}
          headerContent={sidebarHeader}
        />
      )}
      <Layout>
        <Content
          style={{
            background: token.colorBgLayout,
            overflow: 'hidden',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <LayoutPageHeader
              pageTitle={pageTitle}
              pageIcon={pageIcon}
              headerActions={headerActions}
              viewNotificationsPath="/notifications"
              showPageHeader={showPageHeader}
            />
            <div style={{ flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
