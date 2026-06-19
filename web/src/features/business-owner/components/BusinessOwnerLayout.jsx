import { Layout, Typography, Grid, theme } from 'antd'
import { Link } from 'react-router-dom'
import { LayoutPageHeader } from '@/features/shared'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'

const { Content } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

function BrandHeader() {
  const { token } = theme.useToken()
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
      <div style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 8
      }}>
        <BizClearLogo width={24} />
      </div>
      <span style={{
        fontWeight: 700,
        fontSize: 16,
        color: token.colorTextBase,
        whiteSpace: 'nowrap'
      }}>
        {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
      </span>
    </Link>
  )
}

export default function BusinessOwnerLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  showPageHeader = true,
  showBusinessSidebar = false, // New prop to control business sidebar
  sidebarContent = null, // Custom sidebar content
  onSettingsClick, // Pass through to LayoutPageHeader
}) {
  const { token } = theme.useToken()
  const leftContent = <BrandHeader />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, overflow: 'hidden' }}>
      <LayoutPageHeader
        pageTitle={pageTitle}
        pageIcon={pageIcon}
        headerActions={headerActions}
        viewNotificationsPath="/notifications"
        showPageHeader={showPageHeader}
        onSettingsClick={onSettingsClick}
        leftContent={leftContent}
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
