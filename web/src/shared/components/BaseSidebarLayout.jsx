import { Layout, theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'
import { useSidebar } from '@/features/authentication'
import { usePageRefresh } from '@/hooks/usePageRefresh'

const { Content } = Layout

export default function BaseSidebarLayout({
  children,
  sidebar,
  viewNotificationsPath = '/notifications',
  hideNotifications = false,
  hideProfileSettings = false,
  showPageHeader = true,
  showBrandLogo = false,
  onRefresh,
  lastUpdated,
  socketConnected,
  loading,
  infoSlotId,
  infoModalTitle,
  statusText,
  contentPadding = 24,
  background = 'colorBgContainer',
  pageTitle: pageTitleProp,
  pageIcon: pageIconProp,
}) {
  const { token } = theme.useToken()
  const { getPageInfo } = useSidebar()
  const { pageTitle: sidebarTitle, pageIcon: sidebarIcon } = getPageInfo
  const pageTitle = pageTitleProp || sidebarTitle
  const pageIcon = pageIconProp || sidebarIcon

  // Use centralized refresh hook by default, but allow override via props
  const pageRefresh = usePageRefresh({ onRefresh })
  const finalOnRefresh = onRefresh || pageRefresh.onRefresh
  const finalLastUpdated = lastUpdated || pageRefresh.lastUpdated
  const finalSocketConnected = socketConnected !== undefined ? socketConnected : pageRefresh.socketConnected

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {sidebar}
      <Layout>
        <Content
          style={{
            background: token[background],
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
              viewNotificationsPath={viewNotificationsPath}
              hideNotifications={hideNotifications}
              hideProfileSettings={hideProfileSettings}
              showPageHeader={showPageHeader}
              showBrandLogo={showBrandLogo}
              onRefresh={finalOnRefresh}
              lastUpdated={finalLastUpdated}
              socketConnected={finalSocketConnected}
              loading={loading}
              infoSlotId={infoSlotId}
              infoModalTitle={infoModalTitle}
              statusText={statusText}
            />
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: contentPadding,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
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
