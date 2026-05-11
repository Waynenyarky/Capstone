import React, { useState, useMemo, useRef } from 'react'
import { theme, Button, Tag, Splitter, Space, Tooltip } from 'antd'
import { StopOutlined, ClockCircleOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import MaintenanceRequestDetailPanel from './components/MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './components/MaintenanceInfoModal'
import MaintenanceSidebar from './components/MaintenanceSidebar'
import MaintenanceHeader from './components/MaintenanceHeader'
import MaintenanceFilterPanel from './components/MaintenanceFilterPanel'
import MaintenanceRequestList from './components/MaintenanceRequestList'
import MaintenanceExportModal from './components/MaintenanceExportModal'
import RequestMaintenanceModal from './components/RequestMaintenanceModal'
import { NAV_ITEMS, REQUESTS_PAGE_SIZE } from './constants/maintenance.constants'
import { isDefaultVisible, filterApprovalsBySearch, filterApprovalsByStatus, filterApprovalsByReason } from './utils/maintenance.utils'
import { useMaintenanceFilters, useMaintenancePagination, useMaintenanceExport, useMaintenance } from './hooks'


export default function MaintenanceDesktopView({
  onBackToMenu,
}) {
  const [tabKey, setTabKey] = useState('requests')
  const [infoOpen, setInfoOpen] = useState(false)
  const { token } = theme.useToken()
  const [selectedApproval, setSelectedApproval] = useState(null)
  const historyFilterRef = useRef(null)

  const {
    form,
    current,
    approvals,
    loading,
    submitting,
    requestModalOpen,
    setRequestModalOpen,
    requestModalOptions,
    load,
    handleConfirmSubmit,
    handleApprove,
    handleUndoVote,
    handleCancelApproved,
    openRequestModalOrBlock,
    stepUpModal,
  } = useMaintenance()

  const {
    historySearch,
    setHistorySearch,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyReasonFilter,
    setHistoryReasonFilter,
    filterOpen: historyFilterOpen,
    setFilterOpen: setHistoryFilterOpen,
    showAllRequests,
    setShowAllRequests,
  } = useMaintenanceFilters()

  const scopedApprovals = useMemo(() => {
    const list = approvals || []
    return showAllRequests ? list : list.filter(isDefaultVisible)
  }, [approvals, showAllRequests])

  const filteredHistoryApprovals = useMemo(() => {
    let list = [...scopedApprovals]
    list = filterApprovalsBySearch(list, historySearch)
    list = filterApprovalsByStatus(list, historyStatusFilter)
    list = filterApprovalsByReason(list, historyReasonFilter)
    return list
  }, [scopedApprovals, historySearch, historyStatusFilter, historyReasonFilter])

  const { page: statusPage, setPage: setStatusPage, paginatedData: paginatedHistoryApprovals } = useMaintenancePagination(filteredHistoryApprovals, REQUESTS_PAGE_SIZE)

  const { exportOpen: historyExportOpen, setExportOpen: setHistoryExportOpen, exportRange: historyExportRange, setExportRange: setHistoryExportRange, handleExport: handleExportHistory, rowCount: exportRangeRows } = useMaintenanceExport(filteredHistoryApprovals, () => setHistoryExportOpen(false))

  const historyActiveFilterCount = [historyStatusFilter, historyReasonFilter].filter(Boolean).length

  const statusTableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <MaintenanceFilterPanel
            searchValue={historySearch}
            onSearchChange={setHistorySearch}
            statusFilter={historyStatusFilter}
            onStatusChange={setHistoryStatusFilter}
            reasonFilter={historyReasonFilter}
            onReasonChange={setHistoryReasonFilter}
            showAllRequests={showAllRequests}
            onToggleShowAll={() => setShowAllRequests((prev) => !prev)}
            filterOpen={historyFilterOpen}
            onToggleFilter={() => setHistoryFilterOpen((prev) => !prev)}
            onClearFilters={() => { setHistoryStatusFilter(null); setHistoryReasonFilter(null) }}
            activeFilterCount={historyActiveFilterCount}
            onExport={() => setHistoryExportOpen(true)}
            exportDisabled={filteredHistoryApprovals.length === 0}
            token={token}
            filterRef={historyFilterRef}
          />
        </div>
      </div>

      <MaintenanceRequestList
        requests={filteredHistoryApprovals}
        selectedId={selectedApproval?.approvalId}
        onSelect={setSelectedApproval}
        paginatedRequests={paginatedHistoryApprovals}
        total={filteredHistoryApprovals.length}
        page={statusPage}
        pageSize={REQUESTS_PAGE_SIZE}
        onPageChange={setStatusPage}
        loading={loading}
        token={token}
        style={{ marginTop: 12 }}
      />

      <MaintenanceExportModal
        open={historyExportOpen}
        onCancel={() => setHistoryExportOpen(false)}
        onOk={handleExportHistory}
        exportRange={historyExportRange}
        onRangeChange={(value) => setHistoryExportRange(value || [null, null])}
        rowCount={exportRangeRows}
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
          onApprove={handleApprove}
          onUndoVote={handleUndoVote}
          onCancelApproved={handleCancelApproved}
          onRefresh={load}
        />
      </Splitter.Panel>
    </Splitter>
  )

  const tabChildren = {
    requests: statusTabContent,
    history: statusTabContent,
  }

  const selectedLabel = NAV_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey
  const requestButtonLabel = current?.isActive
    ? 'Disable'
    : 'Schedule'
  const requestButtonIcon = current?.isActive ? <StopOutlined /> : <ClockCircleOutlined />
  const rightPanelHeaderActions =
    tabKey === 'requests' ? (
      <Space>
        {setInfoOpen && (
          <Tooltip title="About">
            <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />
          </Tooltip>
        )}
        {current?.isActive && (
          <Button icon={<ClockCircleOutlined />} onClick={() => openRequestModalOrBlock({ forceScheduleMode: true })}>
            Schedule
          </Button>
        )}
        <Button type="primary" icon={requestButtonIcon} onClick={openRequestModalOrBlock}>
          {requestButtonLabel}
        </Button>
      </Space>
    ) : null

  const statusTag = tabKey === 'requests' ? (
    <Tag color={current?.isActive ? 'cyan' : 'default'}>{current?.isActive ? 'Active' : 'Inactive'}</Tag>
  ) : null

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 400,
        borderRadius: onBackToMenu ? 0 : token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {!onBackToMenu && (
        <MaintenanceSidebar
          selectedKey={tabKey}
          onSelect={setTabKey}
          token={token}
        />
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          overflow: 'hidden',
        }}
      >
        <MaintenanceHeader
          title={selectedLabel}
          statusTag={statusTag}
          actions={rightPanelHeaderActions}
          onBackToMenu={onBackToMenu ? <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} /> : null}
          token={token}
        />

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tabChildren[tabKey]}
        </div>
      </div>

      {setInfoOpen && <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}

      <RequestMaintenanceModal
        open={requestModalOpen}
        onCancel={() => setRequestModalOpen(false)}
        form={form}
        forceScheduleMode={requestModalOptions.forceScheduleMode}
        onSubmit={handleConfirmSubmit}
        submitting={submitting}
        maintenanceActive={current?.isActive === true}
        isMobile={false}
      />

      {stepUpModal}
    </div>
  )
}
