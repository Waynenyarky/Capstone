import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Typography, theme, Button, Tag, Splitter, Input, Select, Tooltip, Pagination, Empty, Card, Row, Col, Modal, DatePicker, Space, Grid } from 'antd'
import { DashboardOutlined, ToolOutlined, StopOutlined, ClockCircleOutlined, SearchOutlined, FilterOutlined, CloseOutlined, DownloadOutlined, NotificationOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import MaintenanceOverviewTab from './MaintenanceOverviewTab'
import MaintenanceRequestDetailPanel from './MaintenanceRequestDetailPanel'
import MaintenanceInfoModal from './MaintenanceInfoModal'

const { Text } = Typography
const { RangePicker } = DatePicker

const REQUESTS_PAGE_SIZE = 20
const REQUEST_EXPIRY_HOURS = 48

const requestedByDisplay = (u) => {
  if (!u) return '—'
  if (typeof u === 'object') {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
    return name || u.email || '—'
  }
  return '—'
}

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: DashboardOutlined },
  { key: 'announcements', label: 'Announcements', icon: NotificationOutlined },
  { key: 'requests', label: 'Maintenance', icon: ToolOutlined },
]

const HISTORY_REASON_OPTIONS = [
  { value: 'Scheduled maintenance', label: 'Scheduled maintenance' },
  { value: 'Emergency maintenance', label: 'Emergency maintenance' },
  { value: 'System upgrade', label: 'System upgrade' },
  { value: 'Temporary outage', label: 'Temporary outage' },
  { value: '__others__', label: 'Others' },
]

const PRESET_HISTORY_REASONS = [
  'Scheduled maintenance',
  'Emergency maintenance',
  'System upgrade',
  'Temporary outage',
]

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
  const screens = Grid.useBreakpoint()
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState(null)
  const [historyReasonFilter, setHistoryReasonFilter] = useState(null)
  const [historyFilterOpen, setHistoryFilterOpen] = useState(false)
  const [showAllRequests, setShowAllRequests] = useState(false)
  const [statusPage, setStatusPage] = useState(1)
  const [historyExportOpen, setHistoryExportOpen] = useState(false)
  const [historyExportRange, setHistoryExportRange] = useState([null, null])
  const historyFilterRef = useRef(null)

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

  // Update selectedApproval with fresh data when approvals change
  useEffect(() => {
    if (selectedApproval) {
      const updatedApproval = approvals?.find(a => a.approvalId === selectedApproval.approvalId)
      if (updatedApproval) {
        setSelectedApproval(updatedApproval)
      }
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

  useEffect(() => {
    if (!historyFilterOpen) return
    const handleClickOutside = (e) => {
      if (historyFilterRef.current && !historyFilterRef.current.contains(e.target)) {
        const isDropdown = e.target.closest('.ant-select-dropdown')
        if (!isDropdown) setHistoryFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [historyFilterOpen])

  const filteredHistoryApprovals = useMemo(() => {
    let list = [...scopedApprovals]
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase()
      list = list.filter((a) => {
        const requestedBy = requestedByDisplay(a.requestedBy).toLowerCase()
        const reason = (a.requestDetails?.reason || '').toLowerCase()
        const message = (a.requestDetails?.message || '').toLowerCase()
        const id = (a.approvalId || '').toLowerCase()
        return requestedBy.includes(q) || reason.includes(q) || message.includes(q) || id.includes(q)
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

  const paginatedHistoryApprovals = useMemo(() => {
    const start = (statusPage - 1) * REQUESTS_PAGE_SIZE
    return filteredHistoryApprovals.slice(start, start + REQUESTS_PAGE_SIZE)
  }, [filteredHistoryApprovals, statusPage])

  useEffect(() => {
    setStatusPage(1)
  }, [filteredHistoryApprovals.length])

  const historyActiveFilterCount = [historyStatusFilter, historyReasonFilter].filter(Boolean).length

  const getRangeFilteredHistory = () => {
    const [start, end] = historyExportRange || []
    if (!start || !end) return []

    const startTime = start.startOf('day').valueOf()
    const endTime = end.endOf('day').valueOf()

    return filteredHistoryApprovals.filter((rec) => {
      if (!rec.createdAt) return false
      const createdAt = dayjs(rec.createdAt)
      if (!createdAt.isValid()) return false
      const ts = createdAt.valueOf()
      return ts >= startTime && ts <= endTime
    })
  }

  const handleExportHistory = () => {
    const rows = getRangeFilteredHistory().map((rec) => {
      const requestDetails = rec.requestDetails || {}
      const approvedVotes = (rec.approvals || []).filter((a) => a.approved === true).length
      const rejectedVotes = (rec.approvals || []).filter((a) => a.approved === false).length
      return {
        id: rec.approvalId || '',
        action: requestDetails.action === 'enable' ? 'Enable' : 'Disable',
        status: rec.status || '',
        reason: requestDetails.reason || '',
        message: requestDetails.message || '',
        requestedBy: requestedByDisplay(rec.requestedBy),
        requestedAt: rec.createdAt ? dayjs(rec.createdAt).format('MMM D, YYYY HH:mm') : '',
        startsAt: requestDetails.scheduledStartAt ? dayjs(requestDetails.scheduledStartAt).format('MMM D, YYYY HH:mm') : 'Immediately after approval',
        resumesAt: requestDetails.expectedResumeAt ? dayjs(requestDetails.expectedResumeAt).format('MMM D, YYYY HH:mm') : '',
        approvals: approvedVotes,
        rejections: rejectedVotes,
      }
    })

    const headers = [
      'Approval ID',
      'Action',
      'Status',
      'Reason',
      'Message',
      'Requested By',
      'Requested At',
      'Starts At',
      'Resumes At',
      'Approvals',
      'Rejections',
    ]

    const escapeCsv = (value) => {
      const text = String(value ?? '')
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => [
        row.id,
        row.action,
        row.status,
        row.reason,
        row.message,
        row.requestedBy,
        row.requestedAt,
        row.startsAt,
        row.resumesAt,
        row.approvals,
        row.rejections,
      ].map(escapeCsv).join(',')),
    ]

    const csv = csvLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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

  const statusTableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by requester, reason, message, or ID"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={historyFilterRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={historyActiveFilterCount > 0 ? 'primary' : 'default'}
                ghost={historyActiveFilterCount > 0}
                onClick={() => setHistoryFilterOpen((prev) => !prev)}
                aria-label="Toggle filters"
              />
            </Tooltip>
            {historyFilterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: '16px 20px',
                  background: token.colorBgElevated,
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: token.boxShadowSecondary,
                  zIndex: 1000,
                  minWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Filters</Text>
                  <Button type="text" size="small" icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={() => setHistoryFilterOpen(false)} aria-label="Close filters" />
                </div>
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
                  <Button size="small" type="link" onClick={() => { setHistoryStatusFilter(null); setHistoryReasonFilter(null) }} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
          <Tooltip title="Download filtered requests">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => setHistoryExportOpen(true)}
              disabled={filteredHistoryApprovals.length === 0}
              aria-label="Download requests"
            />
          </Tooltip>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0, padding: 12 }}>
          {loading ? null : paginatedHistoryApprovals.length === 0 ? (
            <Empty description="No matching maintenance requests" style={{ marginTop: 24 }} />
          ) : (
            <Row gutter={[12, 12]}>
              {paginatedHistoryApprovals.map((rec) => (
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
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
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
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
            Showing {paginatedHistoryApprovals.length} out of {filteredHistoryApprovals.length}
          </Text>
          <Pagination
            current={statusPage}
            total={filteredHistoryApprovals.length}
            pageSize={REQUESTS_PAGE_SIZE}
            showSizeChanger={false}
            onChange={setStatusPage}
            size="small"
          />
        </div>
      </div>

      <Modal
        title="Download requests"
        open={historyExportOpen}
        onCancel={() => setHistoryExportOpen(false)}
        onOk={handleExportHistory}
        okText="Download CSV"
        okButtonProps={{ disabled: exportRangeRows === 0 }}
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
      </Modal>
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
    announcements: announcementsTab || <Empty description="Announcements tab unavailable" style={{ marginTop: 24 }} />,
    requests: statusTabContent,
    history: statusTabContent,
  }

  const renderNavItem = ({ key, label, icon: Icon }, isSelected) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => setTabKey(key)}
      onKeyDown={(e) => e.key === 'Enter' && setTabKey(key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {Icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text
        strong={isSelected}
        type={isSelected ? undefined : 'secondary'}
        style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}
      >
        {label}
      </Text>
    </div>
  )

  const selectedLabel = NAV_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey
  const SelectedIcon = NAV_ITEMS.find((i) => i.key === tabKey)?.icon
  const requestButtonLabel = current?.isActive
    ? 'Disable'
    : 'Schedule'
  const requestButtonIcon = current?.isActive ? <StopOutlined /> : <ClockCircleOutlined />
  // Match fee config: overview tab = clean header (icon + title only). Primary action only on Status tab.
  const rightPanelHeaderActions =
    tabKey === 'requests' ? (
      <Space>
        {setInfoOpen && (
          <Tooltip title="About">
            <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />
          </Tooltip>
        )}
        {current?.isActive && (
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
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: `1px solid ${token.colorBorder}`,
            padding: 12,
            overflowY: 'auto',
            background: token.colorBgLayout,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => renderNavItem(item, tabKey === item.key))}
          </div>
        </div>
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
        <div
          style={{
            flexShrink: 0,
            padding: '16px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {onBackToMenu && (
                <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} />
              )}
              <Text strong style={{ fontSize: 16 }}>
                {selectedLabel}
              </Text>
              {tabKey === 'requests' && (
                <Tag color={current?.isActive ? 'cyan' : 'default'}>{current?.isActive ? 'Active' : 'Inactive'}</Tag>
              )}
            </div>
            {rightPanelHeaderActions}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tabChildren[tabKey]}
        </div>
      </div>

      {setInfoOpen && <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}
    </div>
  )
}
