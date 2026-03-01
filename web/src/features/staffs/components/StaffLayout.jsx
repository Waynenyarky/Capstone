import React from 'react'
import { Layout, theme } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { LayoutPageHeader } from '@/features/shared'

const { Content } = Layout

export default function StaffLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  showPageHeader = true,
  noContentWrap = false,
}) {
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar
          itemOverrides={sidebarOverrides}
          hiddenKeys={hiddenSidebarKeys}
        />
      )}
      <Layout>
        <Content
          style={{
            background: token.colorBgContainer,
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
