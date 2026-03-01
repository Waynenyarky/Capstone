import React from 'react'
import { Layout, Typography, Grid, theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'

const { Content } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

function BrandHeader() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BizClearLogo width={screens.sm ? 36 : 28} />
      <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: token.colorPrimary, fontSize: screens.sm ? '18px' : '16px' }}>
        BizClear
      </Title>
    </div>
  )
}

export default function BusinessOwnerLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  showPageHeader = true,
}) {
  const { token } = theme.useToken()
  const leftContent = pageTitle || pageIcon ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <BrandHeader />
      {(pageIcon || pageTitle) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16, borderLeft: `1px solid ${token.colorBorder}` }}>
          {pageIcon}
          {pageTitle && <span style={{ fontWeight: 600, fontSize: 16 }}>{pageTitle}</span>}
        </div>
      )}
    </div>
  ) : (
    <BrandHeader />
  )

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
              leftContent={leftContent}
              headerActions={headerActions}
              viewNotificationsPath="/notifications"
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
