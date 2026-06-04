/**
 * View Component: LGUManagerLayout
 * Layout wrapper for LGU Manager pages
 */
import { Grid } from 'antd'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import BaseSidebarLayout from '@/shared/components/BaseSidebarLayout.jsx'
import SidebarHeader from '@/shared/components/SidebarHeader.jsx'

const { useBreakpoint } = Grid

export default function LGUManagerLayout({
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
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const sidebarHeader = (
    <SidebarHeader roleName="LGU Manager" currentUser={currentUser} onLogout={logout} />
  )

  const sidebar = <Sidebar headerContent={sidebarHeader} />

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
