import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Table, Input, Select, Button, Tag, Typography, Tooltip, Pagination, DatePicker, Modal, Descriptions, theme, Empty, Splitter, Grid } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getFormDefinitionsAuditLog } from '@/features/admin/services/formDefinitionService'
import { ACTION_LABELS, FORM_TYPE_LABELS, INDUSTRY_LABELS } from '../constants'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const actionLabel = (action) => ACTION_LABELS[action] || action || '—'

const ACTION_TYPE_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))

const ACTION_TAG_COLORS = {
  created: 'green',
  updated: 'blue',
  submitted_for_approval: 'orange',
  published: 'green',
  archived: 'default',
  rejected: 'red',
}

const PAGE_SIZE = 20
const FETCH_LIMIT = 200

function formatUser(entry) {
  if (entry?.user) {
    const name = [entry.user.firstName, entry.user.lastName].filter(Boolean).join(' ')
    return name || entry.user.email || '—'
  }
  if (entry?.system) return entry.system
  return '—'
}

function formDescription(rec) {
  if (!rec) return '—'
  const typeLabel = FORM_TYPE_LABELS[rec.formType] || rec.formType || '—'
  const industryLabel = INDUSTRY_LABELS[rec.industryScope] || rec.industryScope || 'All'
  const base = `${typeLabel} – ${industryLabel}`
  const versionSuffix = rec.version != null ? ` v${rec.version}` : ''
  return (rec.name ? `${rec.name} (${typeLabel})` : base) + versionSuffix
}

function FormLogDetailPanel({ log, token }) {
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

  const formLabel = `${FORM_TYPE_LABELS[log.formType] || log.formType || '—'} – ${INDUSTRY_LABELS[log.industryScope] || log.industryScope || 'All'}`

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
            {actionLabel(log.action)}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {log.name || formLabel} {log.version != null ? `v${log.version}` : ''}
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
            <Tag color={ACTION_TAG_COLORS[log.action] || 'default'}>
              {actionLabel(log.action)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Form">
            {formLabel}
            {log.version != null && <Text type="secondary" style={{ marginLeft: 8 }}>v{log.version}</Text>}
          </Descriptions.Item>
          {log.name && (
            <Descriptions.Item label="Name">{log.name}</Descriptions.Item>
          )}
          <Descriptions.Item label="Author">{formatUser(log)}</Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            {log.at ? dayjs(log.at).format('MMMM D, YYYY HH:mm:ss') : '—'}
          </Descriptions.Item>
          {log.comment && (
            <Descriptions.Item label="Comment">{log.comment}</Descriptions.Item>
          )}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <Descriptions.Item label="Changes">
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  background: token.colorFillTertiary,
                  padding: 8,
                  borderRadius: token.borderRadius,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </div>
  )
}

export default function FormDefinitionsLogsTab() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [entries, setEntries] = useState([])
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
      const res = await getFormDefinitionsAuditLog({ limit: FETCH_LIMIT })
      const list = res?.entries || []
      setEntries(list)
    } catch (err) {
      const msg = err?.message || ''
      setLoadError(msg || 'Failed to load form definition history')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filteredEntries = useMemo(() => {
    let list = [...entries]
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      list = list.filter((e) => {
        const formType = (FORM_TYPE_LABELS[e.formType] || e.formType || '').toLowerCase()
        const name = (e.name || '').toLowerCase()
        const user = formatUser(e).toLowerCase()
        const industry = (INDUSTRY_LABELS[e.industryScope] || e.industryScope || '').toLowerCase()
        return formType.includes(q) || name.includes(q) || user.includes(q) || industry.includes(q)
      })
    }
    if (actionFilter) list = list.filter((e) => e.action === actionFilter)
    if (dateRange?.[0] && dateRange?.[1]) {
      const start = dateRange[0].startOf('day')
      const end = dateRange[1].endOf('day')
      list = list.filter((e) => {
        const at = e.at ? dayjs(e.at) : null
        return at && at.isAfter(start) && at.isBefore(end)
      })
    }
    return list
  }, [entries, debouncedSearch, actionFilter, dateRange])

  const total = filteredEntries.length
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredEntries.slice(start, start + PAGE_SIZE)
  }, [filteredEntries, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, actionFilter, dateRange])

  const activeFilterCount = [actionFilter, dateRange].filter(Boolean).length

  const columns = useMemo(() => [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 280,
      render: (v, rec) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text>{actionLabel(v)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{formDescription(rec)}</Text>
        </div>
      ),
    },
    {
      title: 'Performed by',
      key: 'performedBy',
      width: 160,
      render: (_, rec) => formatUser(rec) || 'Admin',
    },
    {
      title: 'Date',
      dataIndex: 'at',
      key: 'date',
      width: 180,
      render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—'),
    },
  ], [])

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by form name, type, or user"
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
                  <Button type="text" size="small" icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={() => setFilterOpen(false)} aria-label="Close filters" />
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
                    options={ACTION_TYPE_OPTIONS}
                    size="small"
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={() => { setActionFilter(null); setDateRange(null) }} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey={(rec) => rec._id ?? `${rec.definitionId}-${rec.at}`}
            columns={columns}
            dataSource={paginatedEntries}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => (rec === selectedLog ? 'log-row-selected' : '')}
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
                      <Text type="secondary">No form definition history found</Text>
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
            total={total}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.log-row-selected > td {
          background: #e6f4ff !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const detailPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <FormLogDetailPanel log={selectedLog} token={token} />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {tableContent}
        <Modal
          title={selectedLog ? actionLabel(selectedLog.action) : 'History detail'}
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={null}
          destroyOnHidden
          width="90%"
        >
          {selectedLog && <FormLogDetailPanel log={selectedLog} token={token} />}
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
