import { Layout, Typography, Grid, theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'
import AnimatedBrandLogo from '@/shared/components/AnimatedBrandLogo.jsx'

const { Content } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

export default function BusinessOwnerLayout({
  children,
  pageTitle,
  pageIcon,
  showPageHeader = true,
  showBusinessSidebar = false, // New prop to control business sidebar
  sidebarContent = null, // Custom sidebar content
  onSettingsClick, // Pass through to LayoutPageHeader
  onRefresh,
  lastUpdated,
  socketConnected,
  loading,
}) {
  const { token } = theme.useToken()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, overflow: 'hidden' }}>
      <LayoutPageHeader
        pageTitle={pageTitle}
        pageIcon={pageIcon}
        viewNotificationsPath="/notifications"
        showPageHeader={showPageHeader}
        onSettingsClick={onSettingsClick}
        onRefresh={onRefresh}
        lastUpdated={lastUpdated}
        socketConnected={socketConnected}
        loading={loading}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: token.colorBgContainer }}>
        {showBusinessSidebar ? (
          <>
            {/* Business Sidebar */}
            <div
              style={{
                width: '30%',
                minWidth: 280,
                maxWidth: 400,
                flexShrink: 0,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                paddingRight: 24,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                background: token.colorBgContainer,
                padding: '24px 24px 24px 16px',
              }}
            >
              {sidebarContent}
            </div>
            
            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
