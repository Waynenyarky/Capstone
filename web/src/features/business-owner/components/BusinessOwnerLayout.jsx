import React from 'react'
import { Layout, theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'

const { Content } = Layout

export default function BusinessOwnerLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  showPageHeader = true,
}) {
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
              showPageHeader={showPageHeader}
            />
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
