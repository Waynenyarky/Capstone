import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Typography,
  Tooltip,
  Pagination,
  DatePicker,
  Modal,
  Descriptions,
  theme,
  Empty,
  Splitter,
  Grid,
} from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getAllAuditLogsAdmin } from '../../services'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const SECURITY_EVENT_TYPES = new Set([
  'security_event',
  'restricted_field_attempt',
  'account_lockout',
  'account_unlock',
  'account_deletion_requested',
  'account_deletion_approved',
  'account_deletion_denied',
  'account_deletion_scheduled',
  'account_deletion_finalized',
  'account_deletion_undone',
  'admin_deletion_requested',
  'admin_deletion_approved',
  'admin_deletion_denied',
  'admin_approval_request',
  'admin_approval_approved',
  'admin_approval_rejected',
  'account_recovery_initiated',
  'account_recovery_completed',
  'error_critical',
])

const ACTION_LABELS = {
  security_event: 'Security event',
  restricted_field_attempt: 'Restricted field attempt',
  account_lockout: 'Account locked',
  account_unlock: 'Account unlocked',
  account_deletion_requested: 'Deletion requested',
  account_deletion_approved: 'Deletion approved',
  account_deletion_denied: 'Deletion denied',
  account_deletion_scheduled: 'Deletion scheduled',
  account_deletion_finalized: 'Deletion finalized',
  account_deletion_undone: 'Deletion undone',
  admin_deletion_requested: 'Admin deletion requested',
  admin_deletion_approved: 'Admin deletion approved',
  admin_deletion_denied: 'Admin deletion denied',
  admin_approval_request: 'Approval requested',
  admin_approval_approved: 'Approval granted',
  admin_approval_rejected: 'Approval rejected',
  account_recovery_initiated: 'Recovery initiated',
  account_recovery_completed: 'Recovery completed',
  error_critical: 'Critical error',
}

const actionLabel = (eventType) => ACTION_LABELS[eventType] || eventType || '—'

const ACTION_TAG_COLORS = {
  security_event: 'magenta',
  restricted_field_attempt: 'volcano',
  account_lockout: 'red',
  account_unlock: 'green',
  account_deletion_requested: 'red',
  admin_approval_approved: 'green',
  admin_approval_rejected: 'red',
}

const FETCH_LIMIT = 500
const PAGE_SIZE = 20

function LogDetailPanel({ log, token }) {
  if (!log) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a log to view details</Text>}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
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
            flexShrink: 0,
          }}
        >
          <FileTextOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {actionLabel(log.eventType)}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {log.user || '—'} {log.userEmail && log.userEmail !== '—' ? `(${log.userEmail})` : ''}
          </Text>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { color: token.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
            content: { fontSize: 13, paddingBottom: 12 },
          }}
        >
          <Descriptions.Item label="Action">
            <Tag color={ACTION_TAG_COLORS[log.eventType] || 'default'}>{actionLabel(log.eventType)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="User">
            {log.user || '—'}
            {log.userEmail && log.userEmail !== '—' && (
              <Text type="secondary" style={{ marginLeft: 8 }}>({log.userEmail})</Text>
            )}
          </Descriptions.Item>
          {log.userRole && log.userRole !== '—' && (
            <Descriptions.Item label="User role">
              <Tag>{log.userRole}</Tag>
            </Descriptions.Item>
          )}
          {log.fieldChanged && (
            <Descriptions.Item label="Field changed">{log.fieldChanged}</Descriptions.Item>
          )}
          {log.oldValue != null && log.oldValue !== '' && (
            <Descriptions.Item label="Previous value">
              <Text type="secondary" style={{ fontFamily: 'monospace' }}>{log.oldValue}</Text>
            </Descriptions.Item>
          )}
          {log.newValue != null && log.newValue !== '' && (
            <Descriptions.Item label="New value">
              <Text style={{ fontFamily: 'monospace' }}>{log.newValue}</Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Performed by">
            {log.performedBy ? <Text>{log.performedBy}</Text> : <Tag>{log.role || '—'}</Tag>}
          </Descriptions.Item>
          {log.metadata?.reason && (
            <Descriptions.Item label="Reason">{log.metadata.reason}</Descriptions.Item>
          )}
          {log.metadata?.ip && (
            <Descriptions.Item label="IP address">{log.metadata.ip}</Descriptions.Item>
          )}
          <Descriptions.Item label="Timestamp">
            {dayjs(log.createdAt).format('MMMM D, YYYY HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  )
}

export default function SecurityHistoryTab() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [allLogs, setAllLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [actionFilter, setActionFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const filterRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        const isDropdown = e.target.closest('.ant-select-dropdown') || e.target.closest('.ant-picker-dropdown')
        if (!isDropdown) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const params = { limit: FETCH_LIMIT }
      if (dateRange?.[0] && dateRange?.[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      const res = await getAllAuditLogsAdmin(params)
      const fetched = res?.logs || []
      const securityOnly = fetched.filter((log) => SECURITY_EVENT_TYPES.has(log.eventType))
      setAllLogs(securityOnly)
    } catch (err) {
      const msg = err?.message || ''
      const is404 = msg.includes('404') || err?.status === 404
      setLoadError(
        is404
          ? 'Audit history API not available (404). Ensure the auth service is running and up to date.'
          : msg || 'Failed to load history'
      )
      setAllLogs([])
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, actionFilter, dateRange])

  const filteredLogs = useMemo(() => {
    let list = [...allLogs]
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.user && r.user.toLowerCase().includes(q)) ||
          (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
          actionLabel(r.eventType).toLowerCase().includes(q)
      )
    }
    if (actionFilter) list = list.filter((r) => r.eventType === actionFilter)
    return list
  }, [allLogs, debouncedSearch, actionFilter])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, currentPage])

  const activeFilterCount = [actionFilter, dateRange].filter(Boolean).length

  const actionTypeOptions = useMemo(
    () =>
      Array.from(SECURITY_EVENT_TYPES).map((value) => ({
        value,
        label: actionLabel(value),
      })),
    []
  )

  const columns = useMemo(
    () => [
      {
        title: 'Action',
        dataIndex: 'eventType',
        key: 'action',
        width: 200,
        render: (v) => actionLabel(v),
      },
      {
        title: 'User',
        dataIndex: 'user',
        key: 'user',
        width: 180,
        render: (v) => v || '—',
      },
      {
        title: 'Performed by',
        key: 'performedBy',
        width: 160,
        render: (_, rec) => rec.performedBy || rec.role || '—',
      },
      {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'date',
        width: 180,
        render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—'),
      },
    ],
    []
  )

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: 12,
          paddingBottom: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by user or action"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={filterRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen((prev) => !prev)}
                aria-label="Toggle filters"
              />
            </Tooltip>
            {filterOpen && (
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
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Date range</Text>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    style={{ width: '100%' }}
                    size="small"
                    allowClear
                    format="MMM D, YYYY"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Action type</Text>
                  <Select
                    placeholder="All actions"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={actionFilter}
                    onChange={setActionFilter}
                    style={{ width: '100%' }}
                    options={actionTypeOptions}
                    size="small"
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setActionFilter(null)
                      setDateRange(null)
                    }}
                    style={{ alignSelf: 'flex-start', padding: 0 }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div
          style={{
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Table
            size="small"
            rowKey={(rec) => rec.id || rec._id || rec.createdAt}
            columns={columns}
            dataSource={paginatedLogs}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => (rec?.id === selectedLog?.id ? 'log-row-selected' : '')}
            onRow={(record) => ({
              onClick: () => setSelectedLog(record),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <Empty
                  image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  styles={{ image: { height: 60 } }}
                  description={
                    loadError ? (
                      <Text type="danger">{loadError}</Text>
                    ) : (
                      <Text type="secondary">No security-related logs in this range</Text>
                    )
                  }
                />
              ),
            }}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredLogs.length}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.log-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const detailPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <LogDetailPanel log={selectedLog} token={token} />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {tableContent}
        <Modal
          title={selectedLog ? actionLabel(selectedLog.eventType) : 'Log Detail'}
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={null}
          destroyOnHidden
          width="90%"
        >
          {selectedLog && <LogDetailPanel log={selectedLog} token={token} />}
        </Modal>
      </>
    )
  }

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {tableContent}
      </Splitter.Panel>
      <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {detailPanel}
      </Splitter.Panel>
    </Splitter>
  )
}
