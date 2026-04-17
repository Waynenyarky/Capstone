import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Typography, theme, Button, Table, Tag, Splitter, Input, Select, Tooltip, Pagination, Empty } from 'antd'
import { DashboardOutlined, ToolOutlined, PlusOutlined, HistoryOutlined, ClockCircleOutlined, SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import MaintenanceStatusCard from './MaintenanceStatusCard'
import MaintenanceOverviewTab from './MaintenanceOverviewTab'
import MaintenanceRequestDetailPanel from './MaintenanceRequestDetailPanel'
import MaintenanceHistoryDetailPanel from './MaintenanceHistoryDetailPanel'

const { Text } = Typography

const HISTORY_PAGE_SIZE = 20

function requestedByDisplay(approval) {
  const u = approval?.requestedBy
  if (!u) return '—'
  if (typeof u === 'object') {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
    return name || u.email || '—'
  }
  return '—'
}

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: DashboardOutlined },
  { key: 'status', label: 'Status', icon: ToolOutlined },
  { key: 'history', label: 'History', icon: HistoryOutlined },
]

export default function MaintenanceDesktopView({
  tabKey,
  setTabKey,
  current,
  loading,
  approvals,
  onApprove,
  onOpenRequestModal,
  onRefresh,
}) {
  const { token } = theme.useToken()
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [selectedHistoryApproval, setSelectedHistoryApproval] = useState(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState(null)
  const [historyActionFilter, setHistoryActionFilter] = useState(null)
  const [historyFilterOpen, setHistoryFilterOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const historyFilterRef = useRef(null)

  const activeApprovals = (approvals || []).filter((a) => a.status === 'pending')
  const historyApprovals = (approvals || []).filter((a) => a.status !== 'pending')

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = () => {
      const first = activeApprovals[0]
      if (first) setSelectedApproval(first)
    }
    window.addEventListener('devtools:maintenance-select-first', handler)
    return () => window.removeEventListener('devtools:maintenance-select-first', handler)
  }, [activeApprovals])

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
    let list = [...historyApprovals]
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase()
      list = list.filter((a) => {
        const requestedBy = requestedByDisplay(a).toLowerCase()
        const message = (a.requestDetails?.message || '').toLowerCase()
        const id = (a.approvalId || '').toLowerCase()
        return requestedBy.includes(q) || message.includes(q) || id.includes(q)
      })
    }
    if (historyStatusFilter) list = list.filter((a) => a.status === historyStatusFilter)
    if (historyActionFilter) list = list.filter((a) => (a.requestDetails?.action || '') === historyActionFilter)
    return list
  }, [historyApprovals, historySearch, historyStatusFilter, historyActionFilter])

  const paginatedHistoryApprovals = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE
    return filteredHistoryApprovals.slice(start, start + HISTORY_PAGE_SIZE)
  }, [filteredHistoryApprovals, historyPage])

  useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyStatusFilter, historyActionFilter])

  const historyActiveFilterCount = [historyStatusFilter, historyActionFilter].filter(Boolean).length

  const statusTableColumns = [
    { title: 'ID', dataIndex: 'approvalId', key: 'approvalId', width: 120, ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => (
        <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, rec) => (rec.requestDetails?.action === 'enable' ? 'Enable' : 'Disable'),
    },
    { title: 'Message', key: 'message', render: (_, rec) => rec.requestDetails?.message || '—', ellipsis: true },
  ]

  const historyTableColumns = [
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_, rec) => (rec.requestDetails?.action === 'enable' ? 'Enable' : 'Disable'),
    },
    {
      title: 'Requested by',
      key: 'requestedBy',
      width: 180,
      render: (_, rec) => requestedByDisplay(rec),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => <Tag color={v === 'approved' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      width: 180,
      render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—'),
    },
  ]

  const statusTableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ['--row-selected-bg']: token.colorPrimaryBg }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <MaintenanceStatusCard current={current} loading={loading} />
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12 }}>
        <Table
          size="small"
          rowKey="approvalId"
          columns={statusTableColumns}
          dataSource={activeApprovals}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No active maintenance requests' }}
          rowClassName={(rec) => rec?.approvalId === selectedApproval?.approvalId ? 'maintenance-row-selected' : ''}
          onRow={(rec) => ({
            onClick: () => setSelectedApproval(rec),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
      <style>{`
        .ant-table-tbody > tr.maintenance-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
      `}</style>
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
          onApprove={onApprove}
          onRefresh={onRefresh}
        />
      </Splitter.Panel>
    </Splitter>
  )

  const historyTableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by requester or message"
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
                  zIndex: 50,
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
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    size="small"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Action</Text>
                  <Select
                    placeholder="All actions"
                    allowClear
                    value={historyActionFilter}
                    onChange={setHistoryActionFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'enable', label: 'Enable' },
                      { value: 'disable', label: 'Disable' },
                    ]}
                    size="small"
                  />
                </div>
                {historyActiveFilterCount > 0 && (
                  <Button size="small" type="link" onClick={() => { setHistoryStatusFilter(null); setHistoryActionFilter(null) }} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="approvalId"
            columns={historyTableColumns}
            dataSource={paginatedHistoryApprovals}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => rec?.approvalId === selectedHistoryApproval?.approvalId ? 'history-row-selected' : ''}
            onRow={(record) => ({
              onClick: () => setSelectedHistoryApproval(record),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <Empty
                  image={<HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  styles={{ image: { height: 60 } }}
                  description={<Text type="secondary">No resolved maintenance requests yet.</Text>}
                />
              ),
            }}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={historyPage}
            total={filteredHistoryApprovals.length}
            pageSize={HISTORY_PAGE_SIZE}
            showSizeChanger={false}
            onChange={setHistoryPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.history-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const historyDetailPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <MaintenanceHistoryDetailPanel approval={selectedHistoryApproval} token={token} />
    </div>
  )

  const historyTabContent = (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {historyTableContent}
      </Splitter.Panel>
      <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {historyDetailPanel}
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
    status: statusTabContent,
    history: historyTabContent,
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
    ? 'Disable maintenance'
    : 'Schedule maintenance'
  const requestButtonIcon = current?.isActive ? <PlusOutlined /> : <ClockCircleOutlined />
  // Match fee config: overview tab = clean header (icon + title only). Primary action only on Status tab.
  const rightPanelHeaderActions =
    tabKey === 'status' ? (
      <Button type="primary" icon={requestButtonIcon} onClick={onOpenRequestModal}>
        {requestButtonLabel}
      </Button>
    ) : null

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 400,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
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
              {SelectedIcon && (
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: token.colorFillTertiary,
                    color: token.colorPrimary,
                  }}
                >
                  <SelectedIcon style={{ fontSize: 18 }} />
                </span>
              )}
              <Text strong style={{ fontSize: 16 }}>
                {selectedLabel}
              </Text>
            </div>
            {rightPanelHeaderActions}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tabChildren[tabKey]}
        </div>
      </div>
    </div>
  )
}
