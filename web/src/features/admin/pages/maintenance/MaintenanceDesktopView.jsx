import React, { useState, useMemo, useEffect } from 'react'
import { Typography, theme, Button, Tag, Splitter, Space } from 'antd'
import { StopOutlined, ClockCircleOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import MaintenanceOverviewTab from './components/MaintenanceOverviewTab.jsx'
import MaintenanceRequestDetailPanel from './components/MaintenanceRequestDetailPanel.jsx'
import MaintenanceInfoModal from './components/MaintenanceInfoModal.jsx'
import MaintenanceSidebar from './MaintenanceSidebar.jsx'
import MaintenanceHeader from './MaintenanceHeader.jsx'
import MaintenanceFilterPanel from './MaintenanceFilterPanel.jsx'
import MaintenanceRequestList from './MaintenanceRequestList.jsx'
import MaintenanceExportModal from './MaintenanceExportModal.jsx'
import { NAV_ITEMS, REQUESTS_PAGE_SIZE, PRESET_HISTORY_REASONS } from '../constants/maintenance.constants.js'
import { isDefaultVisible } from '../utils/maintenance.utils.js'
import { useMaintenanceFilters } from '../hooks/useMaintenanceFilters.js'
import { useMaintenancePagination } from '../hooks/useMaintenancePagination.js'
import { useMaintenanceExport } from '../hooks/useMaintenanceExport.js'

const { Text } = Typography

export default function MaintenanceDesktopView({
  tabKey,
  setTabKey,
  current,
  loading,
  approvals,
  onApprove,
  onUndoVote,
  onCancelApproved,
  onOpenRequestModal,
  onRefresh,
  headerActions,
  announcementsTab,
  onBackToMenu,
  infoOpen,
  setInfoOpen,
}) {
  const { token } = theme.useToken()
  const [selectedApproval, setSelectedApproval] = useState(null)

  const {
    historySearch,
    setHistorySearch,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyReasonFilter,
    setHistoryReasonFilter,
    filterOpen,
    setFilterOpen,
    showAllRequests,
    setShowAllRequests,
    clearFilters,
  } = useMaintenanceFilters()

  const scopedApprovals = useMemo(() => {
    const list = approvals || []
    return showAllRequests ? list : list.filter(isDefaultVisible)
  }, [approvals, showAllRequests])

  const filteredHistoryApprovals = useMemo(() => {
    let list = [...scopedApprovals]
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase()
      list = list.filter((a) => {
        const requestedBy = (a.requestedBy?.firstName + ' ' + a.requestedBy?.lastName).toLowerCase()
        const reason = (a.requestDetails?.reason || '').toLowerCase()
        const message = (a.requestDetails?.message || '').toLowerCase()
        const id = (a.approvalId || '').toLowerCase()
        return requestedBy.includes(q) || reason.includes(q) || message.includes(q) || id.includes(q)
      })
    }
    if (historyStatusFilter) {
      if (historyStatusFilter === 'approved_upcoming') {
        list = list.filter((a) => {
          const scheduledStart = a.requestDetails?.scheduledStartAt ? new Date(a.requestDetails.scheduledStartAt) : null
          return a.status === 'approved' && scheduledStart && scheduledStart > new Date()
        })
      } else {
        list = list.filter((a) => a.status === historyStatusFilter)
      }
    }
    if (historyReasonFilter) {
      if (historyReasonFilter === '__others__') {
        list = list.filter((a) => {
          const reason = a.requestDetails?.reason || ''
          return !!reason && !PRESET_HISTORY_REASONS.includes(reason)
        })
      } else {
        list = list.filter((a) => (a.requestDetails?.reason || '') === historyReasonFilter)
      }
    }
    return list
  }, [scopedApprovals, historySearch, historyStatusFilter, historyReasonFilter])

  const { page, setPage, paginatedData, total } = useMaintenancePagination(filteredHistoryApprovals, REQUESTS_PAGE_SIZE)

  const { exportOpen, setExportOpen, exportRange, setExportRange, handleExport, rowCount } = useMaintenanceExport(
    filteredHistoryApprovals,
    onRefresh
  )

  const historyActiveFilterCount = [historyStatusFilter, historyReasonFilter].filter(Boolean).length

  // Update selectedApproval with fresh data when approvals change
  useEffect(() => {
    if (selectedApproval) {
      const updatedApproval = approvals?.find(a => a.approvalId === selectedApproval.approvalId)
      if (updatedApproval) {
        setSelectedApproval(updatedApproval)
      }
    }
  }, [approvals, selectedApproval])

  const handleCardClick = (approval) => {
    setSelectedApproval(approval)
  }

  const statusTableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <MaintenanceFilterPanel
          searchValue={historySearch}
          onSearchChange={setHistorySearch}
          statusFilter={historyStatusFilter}
          onStatusChange={setHistoryStatusFilter}
          reasonFilter={historyReasonFilter}
          onReasonChange={setHistoryReasonFilter}
          showAllRequests={showAllRequests}
          onToggleShowAll={() => setShowAllRequests(prev => !prev)}
          filterOpen={filterOpen}
          onToggleFilter={() => setFilterOpen(prev => !prev)}
          onClearFilters={clearFilters}
          activeFilterCount={historyActiveFilterCount}
          onExport={() => setExportOpen(true)}
          exportDisabled={filteredHistoryApprovals.length === 0}
          token={token}
        />
      </div>

      <MaintenanceRequestList
        requests={filteredHistoryApprovals}
        selectedId={selectedApproval?.approvalId}
        onSelect={handleCardClick}
        paginatedRequests={paginatedData}
        total={total}
        page={page}
        pageSize={REQUESTS_PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        token={token}
      />

      <MaintenanceExportModal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={handleExport}
        exportRange={exportRange}
        onRangeChange={setExportRange}
        rowCount={rowCount}
      />
    </div>
  )

  const statusTabContent = (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {statusTableContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MaintenanceRequestDetailPanel
          approval={selectedApproval}
          allApprovals={approvals}
          onApprove={onApprove}
          onUndoVote={onUndoVote}
          onCancelApproved={onCancelApproved}
          onRefresh={onRefresh}
        />
      </Splitter.Panel>
    </Splitter>
  )

  const tabChildren = {
    overview: (
      <MaintenanceOverviewTab
        current={current}
        approvals={approvals}
        setTabKey={setTabKey}
        onOpenRequestModal={onOpenRequestModal}
      />
    ),
    announcements: announcementsTab || <div style={{ padding: 24 }}>Announcements tab unavailable</div>,
    requests: statusTabContent,
    history: statusTabContent,
  }

  const requestButtonLabel = current?.active ? 'Disable' : 'Schedule'
  const requestButtonIcon = current?.active ? <StopOutlined /> : <ClockCircleOutlined />
  const rightPanelHeaderActions = tabKey === 'requests' ? (
    <Space>
      {setInfoOpen && (
        <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />
      )}
      {current?.active && (
        <Button icon={<ClockCircleOutlined />} onClick={() => onOpenRequestModal({ forceScheduleMode: true })}>
          Schedule
        </Button>
      )}
      <Button type="primary" icon={requestButtonIcon} onClick={onOpenRequestModal}>
        {requestButtonLabel}
      </Button>
    </Space>
  ) : null

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 400, borderRadius: onBackToMenu ? 0 : token.borderRadiusLG, overflow: 'hidden' }}>
      {!onBackToMenu && (
        <MaintenanceSidebar
          selectedKey={tabKey}
          onSelect={setTabKey}
          onBackToMenu={onBackToMenu}
          onInfoClick={() => setInfoOpen(true)}
          token={token}
          headerActions={headerActions}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: token.colorBgContainer, overflow: 'hidden' }}>
        <MaintenanceHeader
          title={NAV_ITEMS.find(i => i.key === tabKey)?.label ?? tabKey}
          statusTag={tabKey === 'requests' && current ? <Tag color={current.active ? 'cyan' : 'default'}>{current.active ? 'Active' : 'Inactive'}</Tag> : null}
          actions={
            <Space>
              {onBackToMenu && <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} />}
              {rightPanelHeaderActions}
            </Space>
          }
          token={token}
        />

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {tabChildren[tabKey]}
        </div>
      </div>

      {setInfoOpen && <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}
    </div>
  )
}
