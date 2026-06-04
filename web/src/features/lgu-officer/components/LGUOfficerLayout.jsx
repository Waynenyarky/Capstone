/**
 * View Component: LGUOfficerLayout
 * Layout wrapper for LGU Officer pages
 */
import { Grid } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import BaseSidebarLayout from '@/shared/components/BaseSidebarLayout.jsx'

const { useBreakpoint } = Grid

export default function LGUOfficerLayout({
  children,
  hideNotifications = false,
  hideProfileSettings = false,
  showPageHeader = true,
  onRefresh,
  lastUpdated,
  socketConnected,
  loading,
  infoSlotId,
  infoModalTitle,
}) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const sidebar = <Sidebar />

  return (
    <BaseSidebarLayout
      sidebar={sidebar}
      hideNotifications={hideNotifications}
      hideProfileSettings={hideProfileSettings}
      showPageHeader={showPageHeader}
      onRefresh={onRefresh}
      lastUpdated={lastUpdated}
      socketConnected={socketConnected}
      loading={loading}
      infoSlotId={infoSlotId}
      infoModalTitle={infoModalTitle}
      contentPadding={isMobile ? 16 : 24}
    >
      {children}
    </BaseSidebarLayout>
  )
}
