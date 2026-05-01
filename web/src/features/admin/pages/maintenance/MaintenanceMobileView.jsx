import React, { useState, useMemo, useEffect } from 'react'
import { Typography, theme, Button, Tag, Drawer, Tabs, Space } from 'antd'
import { ToolOutlined, ClockCircleOutlined, InfoCircleOutlined, NotificationOutlined } from '@ant-design/icons'
import MaintenanceOverviewTab from './MaintenanceOverviewTab'
import MaintenanceRequestDetailPanel from './MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './MaintenanceInfoModal'
import MaintenanceFilterPanel from './components/MaintenanceFilterPanel.jsx'
import MaintenanceRequestList from './components/MaintenanceRequestList.jsx'
import MaintenanceExportModal from './components/MaintenanceExportModal.jsx'
import { HISTORY_REASON_OPTIONS, PRESET_HISTORY_REASONS, HISTORY_PAGE_SIZE } from './constants/maintenance.constants.js'
import { isDefaultVisible } from './utils/maintenance.utils.js'
import { useMaintenanceFilters } from './hooks/useMaintenanceFilters.js'
import { useMaintenancePagination } from './hooks/useMaintenancePagination.js'
import { useMaintenanceExport } from './hooks/useMaintenanceExport.js'

const { Text } = Typography

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'announcements', label: 'Announcements', icon: <NotificationOutlined /> },
  { key: 'requests', label: 'Maintenance' },
]

export default function MaintenanceMobileView({
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
  announcementsTab,
  onBackToMenu,
  infoOpen,
  setInfoOpen,
}) {
  const { token } = theme.useToken()
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

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

  const { page, setPage, paginatedData, total } = useMaintenancePagination(filteredHistoryApprovals, HISTORY_PAGE_SIZE)

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
    setDetailDrawerOpen(true)
  }

  const overviewTab = (
    <MaintenanceOverviewTab
      current={current}
      approvals={approvals}
      setTabKey={setTabKey}
      onOpenRequestModal={onOpenRequestModal}
    />
  )

  const requestsTab = (
    <div style={{ padding: '0 16px 12px 16px', background: token.colorBgContainer, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
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
        pageSize={HISTORY_PAGE_SIZE}
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

  const tabChildren = {
    overview: overviewTab,
    announcements: announcementsTab || <div style={{ padding: 24 }}>Announcements tab unavailable</div>,
    requests: requestsTab,
    history: requestsTab,
  }

  const selectedLabel = TAB_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {onBackToMenu && (
        <div style={{ padding: '12px 16px', background: token.colorBgContainer, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} />
              <Text strong style={{ fontSize: 16 }}>{selectedLabel}</Text>
              {tabKey === 'requests' && (
                <Tag color={current?.active ? 'cyan' : 'default'}>{current?.active ? 'Active' : 'Inactive'}</Tag>
              )}
            </div>
            {tabKey === 'requests' && (
              <Space>
                {setInfoOpen && <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />}
                {current?.active && <Button icon={<ClockCircleOutlined />} onClick={() => onOpenRequestModal({ forceScheduleMode: true })} />}
                <Button type="primary" icon={current?.active ? <StopOutlined /> : <ClockCircleOutlined />} onClick={onOpenRequestModal}>
                  {current?.active ? 'Disable' : 'Schedule'}
                </Button>
              </Space>
            )}
          </div>
        </div>
      )}

      {!onBackToMenu ? (
        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={TAB_ITEMS.map(({ key, label }) => ({ key, label, children: tabChildren[key] }))}
          style={{ flex: 1 }}
        />
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>{tabChildren[tabKey]}</div>
      )}

      <Drawer
        title="Request details"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        placement="bottom"
        height="100%"
        styles={{ body: { padding: 0 } }}
      >
        {selectedApproval && (
          <MaintenanceRequestDetailPanel
            approval={selectedApproval}
            allApprovals={approvals}
            onApprove={onApprove}
            onUndoVote={onUndoVote}
            onCancelApproved={onCancelApproved}
            onRefresh={onRefresh}
          />
        )}
      </Drawer>

      <Drawer
        title="Filters"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        placement="bottom"
        height="50%"
        styles={{ body: { padding: 16 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <Select
              placeholder="All statuses"
              allowClear
              value={historyStatusFilter}
              onChange={setHistoryStatusFilter}
              style={{ width: '100%' }}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved_upcoming', label: 'Approved - upcoming' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Reason</Text>
            <Select
              placeholder="All reasons"
              allowClear
              value={historyReasonFilter}
              onChange={setHistoryReasonFilter}
              style={{ width: '100%' }}
              options={HISTORY_REASON_OPTIONS}
            />
          </div>
          <Button onClick={() => setShowAllRequests(prev => !prev)}>
            {showAllRequests ? 'Show default view' : 'Show all'}
          </Button>
          {historyActiveFilterCount > 0 && (
            <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
              Clear all filters
            </Button>
          )}
        </div>
      </Drawer>

      {setInfoOpen && <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}
    </div>
  )
}