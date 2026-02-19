import React from 'react'
import { Layout, Typography, Button, Grid, theme } from 'antd'
import { Link } from 'react-router-dom'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import { LayoutPageHeader } from '@/features/shared'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function StaffLayout({
  children,
  title,
  description,
  roleLabel,
  showTopBar = true,
  fullWidth = false,
  hideSidebar = false,
  pageTitle,
  pageIcon,
  headerActions,
  showPageHeader = true,
  headerContent,
  noContentWrap = false,
}) {
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { token } = theme.useToken()

  const displayTitle = roleLabel ? `${roleLabel} Workspace` : 'Staff Workspace'
  const backAction = (
    <Link to="/staff">
      <Button type="default">Back</Button>
    </Link>
  )

  const defaultSidebarHeader = (
    <div style={{ padding: 12 }}>
      <Text strong>{roleLabel || 'Staff'}</Text>
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
  const effectivePageTitle = pageTitle ?? (showTopBar ? displayTitle : undefined)
  const effectiveHeaderActions = headerActions !== undefined ? headerActions : (!hideSidebar ? backAction : undefined)

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {!hideSidebar && (
        <Sidebar headerContent={sidebarHeader} />
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
              pageTitle={effectivePageTitle}
              pageIcon={pageIcon}
              headerActions={effectiveHeaderActions}
              viewNotificationsPath="/notifications"
              showPageHeader={showPageHeader}
            />
            {noContentWrap ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {children}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  padding: isMobile ? 16 : fullWidth ? 24 : 32,
                  overflow: 'auto',
                }}
              >
                <div style={fullWidth ? { width: '100%' } : { maxWidth: 1000, margin: '0 auto' }}>
                  {(title || description) && (
                    <div style={{ marginBottom: 18 }}>
                      {title && <Title level={isMobile ? 4 : 2}>{title}</Title>}
                      {description && <Paragraph type="secondary">{description}</Paragraph>}
                    </div>
                  )}
                  {children}
                </div>
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
