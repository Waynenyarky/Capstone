import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Card, Tabs, Button, Tag, Drawer, Input, Select, Pagination, Empty, Typography, Row, Col, theme, Space, Tooltip, DatePicker } from 'antd'
import { StopOutlined, ClockCircleOutlined, SearchOutlined, NotificationOutlined, ArrowLeftOutlined, FilterOutlined, DownloadOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import MaintenanceOverviewTab from './MaintenanceOverviewTab'
import MaintenanceRequestDetailPanel from './MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './MaintenanceInfoModal'

const { Text } = Typography
const { Group: ButtonGroup } = Button
const { RangePicker } = DatePicker
const HISTORY_PAGE_SIZE = 20
const REQUEST_EXPIRY_HOURS = 48

const requestedByDisplay = (u) => {
  if (!u) return '—'
  if (typeof u === 'object') {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
    return name || u.email || '—'
  }
  return '—'
}

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'announcements', label: 'Announcements', icon: <NotificationOutlined /> },
  { key: 'requests', label: 'Maintenance' },
]

const REASON_OPTIONS = [
  { value: 'Scheduled maintenance', label: 'Scheduled maintenance' },
  { value: 'Emergency maintenance', label: 'Emergency maintenance' },
  { value: 'System upgrade', label: 'System upgrade' },
  { value: 'Temporary outage', label: 'Temporary outage' },
  { value: '__others__', label: 'Others' },
]

const PRESET_REASONS = [
  'Scheduled maintenance',
  'Emergency maintenance',
  'System upgrade',
  'Temporary outage',
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
  const [showAllRequests, setShowAllRequests] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState(null)
  const [historyReasonFilter, setHistoryReasonFilter] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [historyExportOpen, setHistoryExportOpen] = useState(false)
  const [historyExportRange, setHistoryExportRange] = useState([null, null])
  const [statusPage, setStatusPage] = useState(1)

  const isApprovedUpcoming = (approval) => {
    const scheduled = approval?.requestDetails?.scheduledStartAt
    if (!scheduled || approval?.status !== 'approved') return false
    const ts = dayjs(scheduled)
    return ts.isValid() && ts.isAfter(dayjs())
  }

  const isDefaultVisible = (approval) => {
    if (!approval) return false
    // Show all pending requests
    if (approval.status === 'pending') return true
    // Show approved upcoming requests
    if (isApprovedUpcoming(approval)) return true
    // Show active maintenance (approved and currently ongoing)
    if (approval.status === 'approved' && approval.requestDetails?.action === 'enable') {
      const details = approval.requestDetails
      const startAt = details.scheduledStartAt ? dayjs(details.scheduledStartAt) : null
      const endAt = details.expectedResumeAt ? dayjs(details.expectedResumeAt) : null
      const now = dayjs()
      // Active if: start time has passed (or is null for start now) and end time is in the future
      const hasStarted = !startAt || startAt.isBefore(now)
      const hasEnded = endAt && endAt.isBefore(now)
      if (hasStarted && !hasEnded) return true
    }
    // Show rejected requests less than 48 hours old
    if (approval?.status === 'rejected' && approval?.createdAt) {
      const hoursSinceCreation = dayjs().diff(dayjs(approval.createdAt), 'hour')
      return hoursSinceCreation < REQUEST_EXPIRY_HOURS
    }
    return false
  }

  const getDisplayStatus = (approval) => {
    if (isApprovedUpcoming(approval)) return 'approved - upcoming'
    if (approval?.status === 'approved' && approval.requestDetails?.action === 'enable') {
      const details = approval.requestDetails
      const startAt = details.scheduledStartAt ? dayjs(details.scheduledStartAt) : null
      const endAt = details.expectedResumeAt ? dayjs(details.expectedResumeAt) : null
      const now = dayjs()
      const hasStarted = !startAt || startAt.isBefore(now)
      const hasEnded = endAt && endAt.isBefore(now)
      if (hasStarted && !hasEnded) return 'active'
    }
    return approval?.status || 'unknown'
  }

  const getDisplayTagColor = (approval) => {
    const displayStatus = getDisplayStatus(approval)
    if (displayStatus === 'active') return 'cyan'
    if (displayStatus === 'approved - upcoming') return 'blue'
    if (approval?.status === 'pending') return 'gold'
    if (approval?.status === 'approved') return 'green'
    if (approval?.status === 'rejected') return 'red'
    if (approval?.status === 'cancelled') return 'orange'
    return 'default'
  }

  const getRequestExpiryText = (approval) => {
    if (!approval?.createdAt) return null
    if (approval?.status !== 'pending' && approval?.status !== 'expired') return null
    const expiryDate = dayjs(approval.createdAt).add(REQUEST_EXPIRY_HOURS, 'hour')
    if (!expiryDate.isValid()) return null
    return approval?.status === 'expired'
      ? `Request expired on ${expiryDate.format('MMM D, YYYY HH:mm')}`
      : `Request expires on ${expiryDate.format('MMM D, YYYY HH:mm')}`
  }

  const scopedApprovals = useMemo(() => {
    const list = approvals || []
    return showAllRequests ? list : list.filter(isDefaultVisible)
  }, [approvals, showAllRequests])

  const historyActiveFilterCount = (historyStatusFilter ? 1 : 0) + (historyReasonFilter ? 1 : 0)

  const filteredApprovals = useMemo(() => {
    let list = [...approvals]
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase()
      list = list.filter((a) => {
        const requestedBy = requestedByDisplay(a.requestedBy).toLowerCase()
        const reason = (a.requestDetails?.reason || '').toLowerCase()
        const message = (a.requestDetails?.message || '').toLowerCase()
        const id = (a.approvalId || '').toLowerCase()
        return (
          requestedBy.includes(q) ||
          reason.includes(q) ||
          message.includes(q) ||
          id.includes(q)
        )
      })
    }
    if (historyStatusFilter) {
      if (historyStatusFilter === 'approved_upcoming') {
        list = list.filter((a) => isApprovedUpcoming(a))
      } else {
        list = list.filter((a) => a.status === historyStatusFilter)
      }
    }
    if (historyReasonFilter) {
      if (historyReasonFilter === '__others__') {
        const presetReasons = PRESET_REASONS.map((r) => r.toLowerCase())
        list = list.filter((a) => {
          const reason = (a.requestDetails?.reason || '').toLowerCase()
          return !presetReasons.some((pr) => reason.includes(pr))
        })
      } else {
        list = list.filter((a) => {
          const reason = (a.requestDetails?.reason || '').toLowerCase()
          return reason.includes(historyReasonFilter.toLowerCase())
        })
      }
    }
    return list
  }, [approvals, historySearch, historyStatusFilter, historyReasonFilter])

  const scopedApprovalsForHistory = showAllRequests ? filteredApprovals : filteredApprovals.filter((a) => isDefaultVisible(a))

  const paginatedApprovals = useMemo(() => {
    const start = (statusPage - 1) * HISTORY_PAGE_SIZE
    return scopedApprovalsForHistory.slice(start, start + HISTORY_PAGE_SIZE)
  }, [scopedApprovalsForHistory, statusPage])

  const getRangeFilteredHistory = () => {
    if (!historyExportRange?.[0] || !historyExportRange?.[1]) return []
    const [start, end] = historyExportRange
    return filteredApprovals.filter((a) => {
      const requestDate = dayjs(a.createdAt)
      return requestDate.isAfter(start.startOf('day')) && requestDate.isBefore(end.endOf('day'))
    })
  }

  const handleExportHistory = () => {
    const rows = getRangeFilteredHistory()
    const headers = ['Approval ID', 'Requester', 'Reason', 'Message', 'Status', 'Requested At', 'Scheduled Start', 'Expected Resume']
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => [
        r.approvalId,
        requestedByDisplay(r.requestedBy),
        r.requestDetails?.reason || '',
        r.requestDetails?.message || '',
        r.status,
        dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        r.requestDetails?.scheduledStartAt ? dayjs(r.requestDetails.scheduledStartAt).format('YYYY-MM-DD HH:mm:ss') : '',
        r.requestDetails?.expectedResumeAt ? dayjs(r.requestDetails.expectedResumeAt).format('YYYY-MM-DD HH:mm:ss') : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `maintenance-requests-${dayjs().format('YYYYMMDD-HHmmss')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setHistoryExportOpen(false)
  }

  const exportRangeRows = getRangeFilteredHistory().length

  // Update selectedApproval with fresh data when approvals change
  useEffect(() => {
    if (selectedApproval) {
      const updatedApproval = approvals?.find(a => a.approvalId === selectedApproval.approvalId)
      if (updatedApproval) setSelectedApproval(updatedApproval)
    }
  }, [approvals, selectedApproval])

  useEffect(() => {
    setStatusPage(1)
  }, [filteredApprovals.length])

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
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {paginatedApprovals.length === 0 ? (
          <Empty description="No matching maintenance requests" style={{ marginTop: 24 }} />
        ) : (
          <Row gutter={[12, 12]}>
            {paginatedApprovals.map((rec) => (
              <Col key={rec.approvalId} span={24}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => setSelectedApproval(rec)}
                  title={rec.requestDetails?.reason || 'No reason provided'}
                  extra={<Tag color={getDisplayTagColor(rec)} style={{ textTransform: 'capitalize' }}>{getDisplayStatus(rec)}</Tag>}
                  style={{
                    cursor: 'pointer',
                    border: rec?.approvalId === selectedApproval?.approvalId ? `1px solid ${token.colorPrimary}` : undefined,
                  }}
                >
                  {rec.requestDetails?.message && rec.requestDetails?.message !== rec.requestDetails?.reason && (
                    <Text style={{ fontSize: 13 }}>
                      {rec.requestDetails.message}
                    </Text>
                  )}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rec.requestDetails?.scheduledStartAt ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Starts {dayjs(rec.requestDetails.scheduledStartAt).format('MMM D, YYYY HH:mm')}
                      </Text>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Starts immediately after approval
                      </Text>
                    )}
                    {rec.requestDetails?.expectedResumeAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Resumes {dayjs(rec.requestDetails.expectedResumeAt).format('MMM D, YYYY HH:mm')}
                      </Text>
                    )}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Requested by {requestedByDisplay(rec.requestedBy)}
                    </Text>
                    {getRequestExpiryText(rec) && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        {getRequestExpiryText(rec)}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
          Showing {paginatedApprovals.length} out of {filteredApprovals.length}
        </Text>
        <Pagination
          current={statusPage}
          total={filteredApprovals.length}
          pageSize={HISTORY_PAGE_SIZE}
          showSizeChanger={false}
          onChange={setStatusPage}
          size="small"
        />
      </div>
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
              options={REASON_OPTIONS}
            />
          </div>
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