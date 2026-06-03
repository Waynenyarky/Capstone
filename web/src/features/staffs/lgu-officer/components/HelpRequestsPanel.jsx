import { useState, useMemo } from 'react'
import { Typography, Tag, Input, Select, Empty, theme, Grid } from 'antd'
import { SearchOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text } = Typography
const { useBreakpoint } = Grid

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'processing', label: 'In Progress' },
  needs_response: { color: 'orange', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'purple', label: 'Waiting for Owner' },
  closed: { color: 'success', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
}

const PRIORITY_CONFIG = {
  high: { color: '#ff4d4f', label: 'High' },
  normal: { color: '#1677ff', label: 'Normal' },
  low: { color: '#8c8c8c', label: 'Low' },
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

export default function HelpRequestsPanel({ helpRequests = [], onSelectRequest, isLoading }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search requests..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          style={{ width: 160 }}
          size="middle"
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {filteredRequests.length === 0 ? (
          <Empty
            description={isLoading ? 'Loading...' : 'No help requests found'}
            style={{ marginTop: 48 }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRequests.map((request) => {
              const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG.open
              const priorityConf = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.low

              return (
                <div
                  key={request._id || request.requestId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectRequest(request)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectRequest(request)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: token.colorBgContainer,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = token.colorPrimary }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = token.colorBorderSecondary }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }} ellipsis>
                      {request.subject}
                    </Text>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: priorityConf.color,
                      flexShrink: 0, marginLeft: 8, marginTop: 4,
                    }} title={`Priority: ${priorityConf.label}`} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={statusConf.color} style={{ margin: 0, fontSize: 11 }}>
                      {statusConf.label}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {request.requestId}
                    </Text>
                    {request.messageCount > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {request.messageCount} msg{request.messageCount > 1 ? 's' : ''}
                      </Text>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{request.contactEmail}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatDate(request.createdAt)}
                    </Text>
                  </div>
                  {request.claimedByName && (
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      Claimed by: {request.claimedByName}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
