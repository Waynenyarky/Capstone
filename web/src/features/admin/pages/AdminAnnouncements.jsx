import { Grid, Button, Typography, theme } from 'antd'
import { InfoCircleOutlined, NotificationOutlined, ReloadOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { useAnnouncements, AnnouncementDesktopView, AnnouncementMobileView, AnnouncementModals } from './announcements'

const { Text } = Typography

export default function AdminAnnouncements({ embedded = false }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const announcementsState = useAnnouncements()

  const viewProps = {
    ...announcementsState,
    isMobile,
    onSelect: announcementsState.handleSelect,
    onCreateDraft: announcementsState.handleCreateDraft,
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
    settings: {
      refreshLabel: 'Refresh',
    },
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
      <AdminLayout
        pageTitle="Announcements"
        pageIcon={<NotificationOutlined />}
        headerActions={
          <>
            {announcementsState.lastUpdated && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last updated: {announcementsState.lastUpdated.toLocaleTimeString()}
              </Text>
            )}
            <Button icon={<ReloadOutlined />} onClick={announcementsState.fetchAnnouncements} aria-label="Refresh" />
            <Button icon={<InfoCircleOutlined />} onClick={() => announcementsState.setInfoOpen(true)} aria-label="About" />
          </>
        }
      >
        {body}
      </AdminLayout>
      {modals}
    </>
  )
}

