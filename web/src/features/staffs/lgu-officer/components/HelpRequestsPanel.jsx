import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Typography, Tag, Input, Empty, theme, Grid, Button, Tooltip, Select, Card, Pagination } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'

const { Text } = Typography
const { useBreakpoint } = Grid

const PAGE_SIZE = 20

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'gold', label: 'In Progress' },
  needs_response: { color: 'volcano', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'cyan', label: 'Waiting for Owner' },
  closed: { color: 'green', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
}

const PRIORITY_CONFIG = {
  high: { color: 'red', label: 'High Priority' },
  normal: { color: 'blue', label: 'Normal Priority' },
  low: { color: 'default', label: 'Low Priority' },
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_response', label: 'Needs Response' },
  { value: 'waiting_for_business_owner', label: 'Waiting for Owner' },
  { value: 'closed', label: 'Closed' },
  { value: 'invalid', label: 'Invalid' },
]

export default function HelpRequestsPanel({ helpRequests = [], onSelectRequest, isLoading, selectedId }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0 })
  const filterButtonRef = useRef(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (filterOpen && filterButtonRef.current && !screens.xs) {
      const rect = filterButtonRef.current.getBoundingClientRect()
      setFilterPosition({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      })
    }
  }, [filterOpen, screens.xs])

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0

  const filteredRequests = useMemo(() => {
    let list = [...helpRequests]

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) =>
        (r.subject || '').toLowerCase().includes(q) ||
        (r.requestId || '').toLowerCase().includes(q) ||
        (r.contactEmail || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [helpRequests, statusFilter, search])

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return filteredRequests.slice(start, end)
  }, [filteredRequests, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
        <Select
          placeholder="All statuses"
          allowClear
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(val) => setStatusFilter(val || 'all')}
          style={{ width: '100%' }}
          options={STATUS_OPTIONS.filter(opt => opt.value !== 'all')}
        />
      </div>
      {activeFilterCount > 0 && (
        <Button size="small" type="link" onClick={() => setStatusFilter('all')} style={{ alignSelf: 'flex-start', padding: 0 }}>
          Clear all filters
        </Button>
      )}
    </div>
  )

  const filterDropdown = filterOpen ? (
    <div
      style={{
        position: 'fixed',
        top: filterPosition.top,
        right: filterPosition.right,
        padding: '16px 20px',
        background: token.colorBgElevated,
        borderRadius: 10,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowSecondary,
        zIndex: 1050,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 13 }}>Filters</Text>
        <Button type="text" size="small" icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={() => setFilterOpen(false)} aria-label="Close filters" />
      </div>
      {filterContent}
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search requests..."
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <div style={{ position: 'relative' }}>
          <Tooltip title="Filter by status">
            <Button
              ref={filterButtonRef}
              icon={<FilterOutlined />}
              type={activeFilterCount > 0 ? 'primary' : 'default'}
              ghost={activeFilterCount > 0}
              onClick={() => setFilterOpen(!filterOpen)}
              aria-label="Toggle filters"
            />
          </Tooltip>
          {filterDropdown && createPortal(filterDropdown, document.body)}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
        {filteredRequests.length === 0 ? (
          <Empty
            description={isLoading ? 'Loading...' : 'No help requests found'}
            style={{ marginTop: 48 }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginatedRequests.map((request) => {
              const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG.open
              const priorityConf = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.low

              return (
                <Card
                  key={request._id || request.requestId}
                  size="small"
                  hoverable
                  onClick={() => onSelectRequest(request)}
                  title={request.subject}
                  style={{
                    cursor: 'pointer',
                    border: selectedId === request.requestId ? `1px solid ${token.colorPrimary}` : undefined,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: '1.3em',
                      maxHeight: '2.6em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 12,
                      color: token.colorTextSecondary,
                    }}
                  >
                    {request.message}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Last updated: {formatDate(request.updatedAt)}
                    </Text>
                    {request.claimedByName && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Claimed by: {request.claimedByName}
                      </Text>
                    )}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={statusConf.color} style={{ margin: 0, fontSize: 11, textTransform: 'capitalize' }}>
                      {statusConf.label}
                    </Tag>
                    <Tag color={priorityConf.color} style={{ margin: 0, fontSize: 11 }}>
                      {priorityConf.label}
                    </Tag>
                    <Tag style={{ margin: 0, fontSize: 11 }}>
                      {request.requestId}
                    </Tag>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
          Showing {paginatedRequests.length} out of {filteredRequests.length}
        </Text>
        <Pagination
          current={page}
          total={filteredRequests.length}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          onChange={setPage}
          size="small"
        />
      </div>
    </div>
  )
}
