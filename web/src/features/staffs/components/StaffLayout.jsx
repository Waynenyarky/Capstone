import { AppSidebar as Sidebar } from '@/features/authentication'
import BaseSidebarLayout from '@/shared/components/BaseSidebarLayout.jsx'

export default function StaffLayout({
  children,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  showPageHeader = true,
  _noContentWrap = false,
  onRefresh,
  lastUpdated,
  socketConnected,
  loading,
  infoSlotId,
  infoModalTitle,
  pageTitle,
  pageIcon,
}) {
  const sidebar = !hideSidebar ? (
    <Sidebar itemOverrides={sidebarOverrides} hiddenKeys={hiddenSidebarKeys} />
  ) : null

  return (
    <BaseSidebarLayout
      sidebar={sidebar}
      showPageHeader={showPageHeader}
      onRefresh={onRefresh}
      lastUpdated={lastUpdated}
      socketConnected={socketConnected}
      loading={loading}
      infoSlotId={infoSlotId}
      infoModalTitle={infoModalTitle}
      contentPadding={_noContentWrap ? 0 : undefined}
      pageTitle={pageTitle}
      pageIcon={pageIcon}
    >
      {children}
    </BaseSidebarLayout>
  )
}
