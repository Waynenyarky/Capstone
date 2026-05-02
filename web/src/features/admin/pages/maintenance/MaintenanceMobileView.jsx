import { useState, useMemo, useEffect } from 'react'
import { Card, Tabs, Button, Tag, Drawer, Select, Empty, Typography, theme, Space, Tooltip, DatePicker, Input } from 'antd'
import { StopOutlined, ClockCircleOutlined, ArrowLeftOutlined, FilterOutlined, DownloadOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons'
import MaintenanceOverviewTab from './components/MaintenanceOverviewTab.jsx'
import MaintenanceRequestDetailPanel from './components/MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './components/MaintenanceInfoModal'
import MaintenanceRequestList from './components/MaintenanceRequestList'
import { TAB_ITEMS, HISTORY_PAGE_SIZE, HISTORY_REASON_OPTIONS } from './constants/maintenance.constants'
import { isDefaultVisible, filterApprovalsBySearch, filterApprovalsByStatus, filterApprovalsByReason } from './utils/maintenance.utils'
import { useMaintenanceFilters, useMaintenancePagination, useMaintenanceExport } from './hooks'

const { Text } = Typography
const { RangePicker } = DatePicker

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
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by requester, reason, message, or ID"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        <div>
          <Tooltip title="Filter">
            <Button
              icon={<FilterOutlined />}
              type={historyActiveFilterCount > 0 ? 'primary' : 'default'}
              ghost={historyActiveFilterCount > 0}
              onClick={() => setFilterDrawerOpen(true)}
              aria-label="Toggle filters"
            />
          </Tooltip>
        </div>
        <Tooltip title="Download filtered requests">
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setHistoryExportOpen(true)}
            disabled={paginatedApprovals.length === 0}
            aria-label="Download requests"
          />
        </Tooltip>
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
    overview: overviewTab,
    announcements: announcementsTab || <Empty description="Announcements tab unavailable" style={{ marginTop: 24 }} />,
    requests: requestsTab,
    history: requestsTab,
  }

  const selectedLabel = TAB_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey

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
                {selectedLabel}
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
                    <Button icon={<ClockCircleOutlined />} onClick={() => onOpenRequestModal({ forceScheduleMode: true })} />
                  </Tooltip>
                )}
                <Tooltip title={current?.isActive ? 'Disable' : 'Schedule'}>
                  <Button type="primary" icon={current?.isActive ? <StopOutlined /> : <ClockCircleOutlined />} onClick={onOpenRequestModal}>
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
              await onApprove(approvalId, approved, comment)
              onRefresh?.()
            }}
            onUndoVote={onUndoVote}
            onCancelApproved={async (approvalId) => {
              await onCancelApproved?.(approvalId)
              onRefresh?.()
              setSelectedApproval(null)
            }}
            onRefresh={onRefresh}
          />
        )}
      </Drawer>

      <Drawer
        title="Filters"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
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
          <Button onClick={() => setShowAllRequests((prev) => !prev)}>
            {showAllRequests ? 'Show default view' : 'Show all'}
          </Button>
          {historyActiveFilterCount > 0 && (
            <Button size="small" type="link" onClick={() => clearFilters()} style={{ alignSelf: 'flex-start', padding: 0 }}>
              Clear all filters
            </Button>
          )}
        </div>
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
    </Card>
  )
}