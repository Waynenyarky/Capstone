import { useState, useMemo, useEffect } from 'react'
import { Card, Tabs, Button, Tag, Drawer, Typography, theme, Space, Tooltip, DatePicker } from 'antd'
import { StopOutlined, ClockCircleOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import MaintenanceRequestDetailPanel from './components/MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './components/MaintenanceInfoModal'
import MaintenanceRequestList from './components/MaintenanceRequestList'
import MaintenanceToolbar from './components/MaintenanceToolbar'
import { TAB_ITEMS, HISTORY_PAGE_SIZE } from './constants/maintenance.constants'
import { isDefaultVisible, filterApprovalsBySearch, filterApprovalsByStatus, filterApprovalsByReason } from './utils/maintenance.utils'
import { useMaintenanceFilters, useMaintenancePagination, useMaintenanceExport, useMaintenance } from './hooks'
import MaintenanceRequestModal from './components/MaintenanceRequestModal'

const { Text } = Typography
const { RangePicker } = DatePicker

export default function MaintenanceMobileView({
  onBackToMenu,
}) {
  const [tabKey, setTabKey] = useState('requests')
  const [infoOpen, setInfoOpen] = useState(false)
  const { token } = theme.useToken()
  const [selectedApproval, setSelectedApproval] = useState(null)

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
    filterOpen: filterDrawerOpen,
    setFilterOpen: setFilterDrawerOpen,
    showAllRequests,
    setShowAllRequests,
    clearFilters,
  } = useMaintenanceFilters()

  const scopedApprovals = useMemo(() => {
    const list = approvals || []
    return showAllRequests ? list : list.filter(isDefaultVisible)
  }, [approvals, showAllRequests])

  const filteredApprovals = useMemo(() => {
    let list = [...scopedApprovals]
    list = filterApprovalsBySearch(list, historySearch)
    list = filterApprovalsByStatus(list, historyStatusFilter)
    list = filterApprovalsByReason(list, historyReasonFilter)
    return list
  }, [scopedApprovals, historySearch, historyStatusFilter, historyReasonFilter])

  const { exportOpen: historyExportOpen, setExportOpen: setHistoryExportOpen, exportRange: historyExportRange, setExportRange: setHistoryExportRange, handleExport: handleExportHistory, rowCount: exportRangeRows } = useMaintenanceExport(filteredApprovals, () => setHistoryExportOpen(false))

  const { page: statusPage, setPage: setStatusPage, paginatedData: paginatedApprovals } = useMaintenancePagination(filteredApprovals, HISTORY_PAGE_SIZE)

  const historyActiveFilterCount = (historyStatusFilter ? 1 : 0) + (historyReasonFilter ? 1 : 0)

  // Update selectedApproval with fresh data when approvals change
  useEffect(() => {
    if (selectedApproval) {
      const updatedApproval = approvals?.find(a => a.approvalId === selectedApproval.approvalId)
      if (updatedApproval) setSelectedApproval(updatedApproval)
    }
  }, [approvals, selectedApproval])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = () => {
      const first = scopedApprovals.find((a) => a.status === 'pending') || scopedApprovals[0]
      if (first) setSelectedApproval(first)
    }
    window.addEventListener('devtools:maintenance-select-first', handler)
    return () => window.removeEventListener('devtools:maintenance-select-first', handler)
  }, [scopedApprovals])

  const requestsTab = (
    <div style={{ padding: '0 16px 12px 16px', background: token.colorBgContainer, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <MaintenanceToolbar
          searchValue={historySearch}
          onSearchChange={setHistorySearch}
          statusFilter={historyStatusFilter}
          onStatusChange={setHistoryStatusFilter}
          reasonFilter={historyReasonFilter}
          onReasonChange={setHistoryReasonFilter}
          showAllRequests={showAllRequests}
          onToggleShowAll={() => setShowAllRequests((prev) => !prev)}
          filterOpen={filterDrawerOpen}
          onToggleFilter={() => setFilterDrawerOpen((prev) => !prev)}
          onClearFilters={clearFilters}
          activeFilterCount={historyActiveFilterCount}
          onExport={() => setHistoryExportOpen(true)}
          exportDisabled={paginatedApprovals.length === 0}
          token={token}
          isMobile={true}
        />
      </div>
      <MaintenanceRequestList
        requests={filteredApprovals}
        selectedId={selectedApproval?.approvalId}
        onSelect={setSelectedApproval}
        paginatedRequests={paginatedApprovals}
        total={filteredApprovals.length}
        page={statusPage}
        pageSize={HISTORY_PAGE_SIZE}
        onPageChange={setStatusPage}
        loading={loading}
        token={token}
        style={{ flex: 1, marginTop: 0 }}
      />
    </div>
  )

  const tabChildren = {
    requests: requestsTab,
    history: requestsTab,
  }

  return (
    <Card styles={{ body: { background: 'transparent', padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }} style={{ background: 'transparent', border: 'none', height: '100%' }}>
      {onBackToMenu && (
        <div
          style={{
            padding: '12px 16px',
            background: token.colorBgContainer,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} />
              <Text strong style={{ fontSize: 16 }}>
                Maintenance
              </Text>
              {tabKey === 'requests' && (
                <Tag color={current?.isActive ? 'cyan' : 'default'}>{current?.isActive ? 'Active' : 'Inactive'}</Tag>
              )}
            </div>
            {tabKey === 'requests' && (
              <Space>
                {setInfoOpen && (
                  <Tooltip title="About">
                    <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />
                  </Tooltip>
                )}
                {current?.isActive && (
                  <Tooltip title="Schedule">
                    <Button icon={<ClockCircleOutlined />} onClick={() => openRequestModalOrBlock({ forceScheduleMode: true })} />
                  </Tooltip>
                )}
                <Tooltip title={current?.isActive ? 'Disable' : 'Schedule'}>
                  <Button type="primary" icon={current?.isActive ? <StopOutlined /> : <ClockCircleOutlined />} onClick={openRequestModalOrBlock}>
                    {current?.isActive ? 'Disable' : 'Schedule'}
                  </Button>
                </Tooltip>
              </Space>
            )}
          </div>
        </div>
      )}
      {!onBackToMenu && (
        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={TAB_ITEMS.map(({ key, label }) => ({
            key,
            label,
            children: tabChildren[key],
          }))}
        />
      )}
      {onBackToMenu && <div style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{tabChildren[tabKey]}</div>}
      <Drawer
        title="Request details"
        open={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        placement="bottom"
        height="100%"
        styles={{ body: { padding: 0 } }}
      >
        {selectedApproval && (
          <MaintenanceRequestDetailPanel
            approval={selectedApproval}
            allApprovals={approvals}
            onApprove={async (approvalId, approved, comment) => {
              await handleApprove(approvalId, approved, comment)
            }}
            onUndoVote={handleUndoVote}
            onCancelApproved={async (approvalId) => {
              await handleCancelApproved(approvalId)
              setSelectedApproval(null)
            }}
            onRefresh={load}
          />
        )}
      </Drawer>

      <Drawer
        title="Download requests"
        open={historyExportOpen}
        onClose={() => setHistoryExportOpen(false)}
        placement="bottom"
        height="50%"
        styles={{ body: { padding: 16 } }}
        extra={
          <Button type="primary" onClick={handleExportHistory} disabled={exportRangeRows === 0}>
            Download CSV
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text type="secondary">Select start and end date for exported records (based on request date).</Text>
          <RangePicker
            value={historyExportRange}
            onChange={(value) => setHistoryExportRange(value || [null, null])}
            style={{ width: '100%' }}
            format="MMM D, YYYY"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {historyExportRange?.[0] && historyExportRange?.[1]
              ? `${exportRangeRows} record${exportRangeRows === 1 ? '' : 's'} ready to export`
              : 'Choose a date range to enable download'}
          </Text>
        </div>
      </Drawer>

      {setInfoOpen && <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}

      <MaintenanceRequestModal
        open={requestModalOpen}
        onCancel={() => setRequestModalOpen(false)}
        form={form}
        forceScheduleMode={requestModalOptions.forceScheduleMode}
        onSubmit={handleConfirmSubmit}
        submitting={submitting}
        maintenanceActive={current?.isActive === true}
        isMobile={true}
      />

      {stepUpModal}
    </Card>
  )
}