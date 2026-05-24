import { Grid, theme } from 'antd'
import AdminLayout from '../components/AdminLayout'
import { useAnnouncements, AnnouncementDesktopView, AnnouncementMobileView, AnnouncementModals } from './announcements'

export default function AdminAnnouncements({ embedded = false }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const announcementsState = useAnnouncements()

  const viewProps = {
    ...announcementsState,
    isMobile,
    onSelect: announcementsState.handleSelect,
    onBack: () => announcementsState.setSelected(null),
    onCreateDraft: announcementsState.handleCreateDraft,
    onRefresh: announcementsState.fetchAnnouncements,
    onOpenInfo: () => announcementsState.setInfoOpen(true),
    onToggleFilter: (value) => announcementsState.setFilterOpen(value),
    onSearchChange: (value) => announcementsState.setSearch(value),
    onStatusChange: announcementsState.setStatusFilter,
    onPriorityChange: announcementsState.setPriorityFilter,
    onClearFilters: announcementsState.clearFilters,
    onPageChange: announcementsState.setCurrentPage,
    onKeyDown: announcementsState.handleKeyDown,
    onFillTestData: announcementsState.handleFillTestData,
    onSaveDraft: (publish = false) => announcementsState.handleSave(publish),
    onPublish: (publish = true) => announcementsState.handleSave(publish),
    onDelete: () => announcementsState.setDeleteModalVisible(true),
    onUnpublish: () => announcementsState.setUnpublishModalVisible(true),
    onAuditSearchChange: announcementsState.setAuditSearch,
    onAuditPageChange: (page) => {
      announcementsState.setAuditLogsPage(page)
      announcementsState.fetchAuditLogs(page, announcementsState.selected?._id)
    },
    onOpenAuditLog: announcementsState.openAuditLog,
    onExportAuditLogs: announcementsState.handleExportAuditLogs,
    onAuditTabChange: announcementsState.setActiveAuditTab,
  }

  const modals = (
    <AnnouncementModals
      unpublishModalVisible={announcementsState.unpublishModalVisible}
      onCloseUnpublish={() => announcementsState.setUnpublishModalVisible(false)}
      onConfirmUnpublish={announcementsState.handleUnpublish}
      saving={announcementsState.saving}
      selected={announcementsState.selected}
      deleteModalVisible={announcementsState.deleteModalVisible}
      onCloseDelete={() => announcementsState.setDeleteModalVisible(false)}
      onConfirmDelete={announcementsState.handleDelete}
      auditLogModalVisible={announcementsState.auditLogModalVisible}
      onCloseAuditLog={() => announcementsState.setAuditLogModalVisible(false)}
      selectedAuditLog={announcementsState.selectedAuditLog}
      infoOpen={announcementsState.infoOpen}
      onCloseInfo={() => announcementsState.setInfoOpen(false)}
      token={token}
    />
  )

  const body = isMobile ? <AnnouncementMobileView {...viewProps} /> : <AnnouncementDesktopView {...viewProps} />

  if (embedded) {
    return (
      <>
        {body}
        {modals}
      </>
    )
  }

  return (
    <>
      <AdminLayout showPageHeader={false}>
        {body}
      </AdminLayout>
      {modals}
    </>
  )
}

