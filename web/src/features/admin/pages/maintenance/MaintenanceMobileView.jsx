import React, { useState, useMemo, useEffect } from 'react'
import { Card, Tabs, Button, Table, Tag, Modal, Input, Select, Pagination, Empty, Typography } from 'antd'
import { PlusOutlined, ClockCircleOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons'
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

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'status', label: 'Status' },
  { key: 'history', label: 'History' },
]

export default function MaintenanceMobileView({
  tabKey,
  setTabKey,
  current,
  loading,
  approvals,
  onApprove,
  onOpenRequestModal,
  onRefresh,
}) {
  const [selectedApproval, setSelectedApproval] = useState(null)
  const activeApprovals = (approvals || []).filter((a) => a.status === 'pending')

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = () => {
      const first = activeApprovals[0]
      if (first) setSelectedApproval(first)
    }
    window.addEventListener('devtools:maintenance-select-first', handler)
    return () => window.removeEventListener('devtools:maintenance-select-first', handler)
  }, [activeApprovals])

  const statusTableColumns = [
    { title: 'ID', dataIndex: 'approvalId', key: 'approvalId' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag>
      ),
    },
    { title: 'Action', key: 'action', render: (_, rec) => rec.requestDetails?.action === 'enable' ? 'Enable' : 'Disable' },
    { title: 'Message', key: 'message', render: (_, rec) => rec.requestDetails?.message || '—', ellipsis: true },
  ]

  const overviewTab = (
    <MaintenanceOverviewTab
      current={current}
      approvals={approvals}
      setTabKey={setTabKey}
      onOpenRequestModal={onOpenRequestModal}
    />
  )

  const statusTab = (
    <div style={{ padding: 16 }}>
      <MaintenanceStatusCard current={current} loading={loading} />
      <Button
        type="primary"
        icon={current?.isActive ? <PlusOutlined /> : <ClockCircleOutlined />}
        onClick={onOpenRequestModal}
        style={{ marginTop: 16 }}
        block
      >
        {current?.isActive ? 'Disable maintenance' : 'Schedule maintenance'}
      </Button>
      <div style={{ marginTop: 24 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>Active requests</strong>
        <Table
          rowKey="approvalId"
          dataSource={activeApprovals}
          columns={statusTableColumns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No active maintenance requests' }}
          onRow={(rec) => ({
            onClick: () => setSelectedApproval(rec),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
      <Modal
        title="Request details"
        open={!!selectedApproval}
        onCancel={() => setSelectedApproval(null)}
        footer={null}
        width="100%"
        style={{ maxWidth: 480 }}
        destroyOnClose
      >
        {selectedApproval && (
          <MaintenanceRequestDetailPanel
            approval={selectedApproval}
            onApprove={async (approvalId, approved, comment) => {
              await onApprove(approvalId, approved, comment)
              onRefresh?.()
              setSelectedApproval(null)
            }}
            onRefresh={onRefresh}
          />
        )}
      </Modal>
    </div>
  )

  const historyApprovals = (approvals || []).filter((a) => a.status !== 'pending')
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState(null)
  const [historyActionFilter, setHistoryActionFilter] = useState(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [selectedHistoryApproval, setSelectedHistoryApproval] = useState(null)

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

  const historyTableColumns = [
    { title: 'Action', key: 'action', render: (_, rec) => (rec.requestDetails?.action === 'enable' ? 'Enable' : 'Disable') },
    { title: 'Requested by', key: 'requestedBy', render: (_, rec) => requestedByDisplay(rec) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'approved' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—') },
  ]

  const historyTab = (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        <Input
          placeholder="Search by requester or message"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            placeholder="Status"
            allowClear
            value={historyStatusFilter}
            onChange={setHistoryStatusFilter}
            style={{ minWidth: 120 }}
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select
            placeholder="Action"
            allowClear
            value={historyActionFilter}
            onChange={setHistoryActionFilter}
            style={{ minWidth: 120 }}
            options={[
              { value: 'enable', label: 'Enable' },
              { value: 'disable', label: 'Disable' },
            ]}
          />
          {(historyStatusFilter || historyActionFilter) && (
            <Button size="small" type="link" onClick={() => { setHistoryStatusFilter(null); setHistoryActionFilter(null) }} style={{ padding: 0 }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
      <Table
        size="small"
        rowKey="approvalId"
        dataSource={paginatedHistoryApprovals}
        columns={historyTableColumns}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={<HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
              styles={{ image: { height: 60 } }}
              description={<Text type="secondary">No resolved maintenance requests yet.</Text>}
            />
          ),
        }}
        onRow={(rec) => ({
          onClick: () => setSelectedHistoryApproval(rec),
          style: { cursor: 'pointer' },
        })}
      />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={historyPage}
          total={filteredHistoryApprovals.length}
          pageSize={HISTORY_PAGE_SIZE}
          showSizeChanger={false}
          onChange={setHistoryPage}
          size="small"
        />
      </div>
      <Modal
        title={selectedHistoryApproval ? (selectedHistoryApproval.requestDetails?.action === 'enable' ? 'Enable maintenance' : 'Disable maintenance') : 'History detail'}
        open={!!selectedHistoryApproval}
        onCancel={() => setSelectedHistoryApproval(null)}
        footer={null}
        width="90%"
        destroyOnClose
      >
        {selectedHistoryApproval && <MaintenanceHistoryDetailPanel approval={selectedHistoryApproval} />}
      </Modal>
    </div>
  )

  const tabChildren = {
    overview: overviewTab,
    status: statusTab,
    history: historyTab,
  }

  return (
    <Card styles={{ body: { background: 'transparent' } }} style={{ background: 'transparent' }}>
      <Tabs
        activeKey={tabKey}
        onChange={setTabKey}
        items={TAB_ITEMS.map(({ key, label }) => ({
          key,
          label,
          children: tabChildren[key],
        }))}
      />
    </Card>
  )
}
