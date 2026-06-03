import { useMemo, useState, useRef, useEffect } from 'react'
import { Table, Tag, Input, Select, Typography, theme, Tooltip, Button } from 'antd'
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const EVENT_TYPE_CONFIG = {
  // Officer work actions
  permit_review: { color: 'blue', label: 'Application Reviewed' },
  permit_review_started: { color: 'processing', label: 'Review Started' },
  application_claimed: { color: 'cyan', label: 'Application Claimed' },
  application_released: { color: 'default', label: 'Application Released' },
  application_transferred: { color: 'orange', label: 'Application Transferred' },
  decision_revoked: { color: 'red', label: 'Decision Revoked' },
  // Account & security events
  login: { color: 'green', label: 'Login' },
  logout: { color: 'default', label: 'Logout' },
  password_change: { color: 'orange', label: 'Password Change' },
  email_change: { color: 'orange', label: 'Email Change' },
  profile_update: { color: 'cyan', label: 'Profile Update' },
  contact_update: { color: 'cyan', label: 'Contact Update' },
  name_update: { color: 'cyan', label: 'Name Update' },
  mfa_enabled: { color: 'green', label: 'MFA Enabled' },
  mfa_disabled: { color: 'red', label: 'MFA Disabled' },
  mfa_verified: { color: 'green', label: 'MFA Verified' },
  mfa_setup_started: { color: 'processing', label: 'MFA Setup' },
  mfa_fingerprint_registered: { color: 'green', label: 'Fingerprint Registered' },
  mfa_fingerprint_removed: { color: 'red', label: 'Fingerprint Removed' },
  webauthn_registered: { color: 'green', label: 'Passkey Registered' },
  webauthn_removed: { color: 'red', label: 'Passkey Removed' },
  first_login_credentials_changed: { color: 'orange', label: 'First Login' },
  avatar_uploaded: { color: 'cyan', label: 'Avatar Uploaded' },
  avatar_deleted: { color: 'default', label: 'Avatar Deleted' },
}

export default function LogsTable({ logs = [], loading = false, selectedLog, onSelectLog }) {
  const { token } = theme.useToken()
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterWrapperRef = useRef(null)

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(e.target)) {
        const isSelectDropdown = e.target.closest('.ant-select-dropdown')
        if (!isSelectDropdown) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    
    if (eventTypeFilter) {
      result = result.filter(log => log.eventType === eventTypeFilter)
    }
    
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(log => {
        const eventType = (log.eventType || '').toLowerCase()
        const fieldChanged = (log.fieldChanged || '').toLowerCase()
        const businessName = (log.metadata?.businessName || '').toLowerCase()
        const label = (EVENT_TYPE_CONFIG[log.eventType]?.label || '').toLowerCase()
        return eventType.includes(q) || fieldChanged.includes(q) || businessName.includes(q) || label.includes(q)
      })
    }
    
    return result
  }, [logs, search, eventTypeFilter])

  const eventTypeOptions = useMemo(() => {
    const types = [...new Set(logs.map(l => l.eventType).filter(Boolean))]
    return types.map(t => ({
      value: t,
      label: EVENT_TYPE_CONFIG[t]?.label || t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }))
  }, [logs])

  const columns = [
    {
      title: 'Action',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 200,
      render: (eventType, record) => {
        const cfg = EVENT_TYPE_CONFIG[eventType] || { color: 'default', label: eventType }
        const label = cfg.label || eventType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
        const businessName = record.metadata?.businessName || record.metadata?.applicationReferenceNumber || ''
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tag color={cfg.color} style={{ width: 'fit-content' }}>{label}</Tag>
            {businessName && <Text type="secondary" style={{ fontSize: 11 }}>{businessName}</Text>}
          </div>
        )
      },
      sorter: (a, b) => (a.eventType || '').localeCompare(b.eventType || ''),
    },
    {
      title: 'Verified',
      dataIndex: 'verified',
      key: 'verified',
      width: 80,
      align: 'center',
      render: (verified, record) => {
        if (record.txHash) {
          return (
            <Tooltip title={`TX: ${record.txHash.slice(0, 10)}...`}>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />
            </Tooltip>
          )
        }
        return <CloseCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 16 }} />
      },
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => date ? (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).format('MMM D, h:mm A')}</Text>
        </Tooltip>
      ) : '—',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      defaultSortOrder: 'descend',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ 
        flexShrink: 0, 
        padding: '12px 16px', 
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', gap: 8, alignItems: 'center' }} ref={filterWrapperRef}>
          <Input
            placeholder="Search logs..."
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Tooltip title="Filter">
            <Button
              icon={<FilterOutlined />}
              type={eventTypeFilter ? 'primary' : 'default'}
              ghost={eventTypeFilter}
              onClick={() => setFilterOpen(prev => !prev)}
            />
          </Tooltip>

          {/* Floating filter panel */}
          {filterOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
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
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Event Type</Text>
                <Select
                  placeholder="All events"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={eventTypeFilter}
                  onChange={setEventTypeFilter}
                  style={{ width: '100%' }}
                  options={eventTypeOptions}
                  size="small"
                />
              </div>
              {eventTypeFilter && (
                <Button size="small" type="link" onClick={() => setEventTypeFilter(null)} style={{ alignSelf: 'flex-start', padding: 0 }}>
                  Clear filter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey={(record) => record._id || record.id}
          size="small"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }}
          rowClassName={(record) => {
            const recordId = record._id || record.id
            const selectedId = selectedLog?._id || selectedLog?.id || selectedLog?._itemId
            return recordId === selectedId ? 'log-row-selected' : ''
          }}
          onRow={(record) => ({
            onClick: () => onSelectLog?.(record),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 'max-content' }}
        />
        <style>{`
          .ant-table-tbody > tr.log-row-selected > td {
            background: var(--row-selected-bg) !important;
          }
          .ant-table-tbody > tr:hover > td {
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  )
}
