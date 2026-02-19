import React from 'react'
import { Layout, Grid, Typography, Button, Tag, theme } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import { LayoutPageHeader } from '@/features/shared'

const { Content } = Layout
const { useBreakpoint } = Grid
const { Text } = Typography

export default function BusinessOwnerLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  businessName,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  hideNotifications = false,
  hideProfileSettings = false,
  showPageHeader = true,
}) {
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md

  const defaultSidebarHeader = (
    <div style={{ padding: 12 }}>
      <Text strong>Business Owner</Text>
      {currentUser?.email && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {currentUser.email}
        </Text>
      )}
      {businessName && (
        <Tag icon={<ShopOutlined />} color="gold" style={{ marginTop: 6, marginRight: 0 }}>
          {businessName.length > 20 ? `${businessName.slice(0, 20)}...` : businessName}
        </Tag>
      )}
      <div style={{ marginTop: 8 }}>
        <Button size="small" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar
          itemOverrides={sidebarOverrides}
          hiddenKeys={hiddenSidebarKeys}
          headerContent={defaultSidebarHeader}
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
              viewNotificationsPath="/owner/notifications"
              hideNotifications={hideNotifications}
              hideProfileSettings={hideProfileSettings}
              showPageHeader={showPageHeader}
            />
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: isMobile ? 16 : 24,
                overflow: 'auto',
              }}
            >
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
