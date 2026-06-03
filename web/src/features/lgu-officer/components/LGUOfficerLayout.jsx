/**
 * View Component: LGUOfficerLayout
 * Layout wrapper for LGU Officer pages
 */
import { Layout, Grid, Typography, Button, theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'

const { Content } = Layout
const { useBreakpoint } = Grid
const { Text } = Typography

export default function LGUOfficerLayout({
  children,
  pageTitle = 'LGU Officer',
  pageIcon,
  headerActions,
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
      <Text strong>LGU Officer</Text>
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar headerContent={defaultSidebarHeader} />
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
