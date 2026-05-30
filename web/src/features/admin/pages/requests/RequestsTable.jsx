import { Table, Tag, Typography, Select, Pagination, theme, Empty } from 'antd'
import { getRequestTypeLabel } from '@/features/admin/services/approvalService'

const { Text } = Typography

const STATUS_COLORS = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
}

function userName(user) {
  if (!user) return '—'
  if (typeof user === 'object') {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return name || user.email || '—'
  }
  return '—'
}

export default function RequestsTable({
  approvals,
  loading,
  selectedApproval,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  pagination,
}) {
  const { token } = theme.useToken()
  const columns = [
    {
      title: 'Type',
      key: 'requestType',
      width: 140,
      render: (_, rec) => (
        <Text style={{ fontSize: 12 }}>{getRequestTypeLabel(rec.requestType)}</Text>
      ),
    },
    {
      title: 'Requested by',
      key: 'requestedBy',
      width: 120,
      render: (_, rec) => (
        <Text style={{ fontSize: 12 }} ellipsis title={userName(rec.requestedBy)}>
          {userName(rec.requestedBy)}
        </Text>
      ),
    },
    {
      title: 'Target user',
      key: 'userId',
      width: 120,
      render: (_, rec) => (
        <Text style={{ fontSize: 12 }} ellipsis title={userName(rec.userId)}>
          {userName(rec.userId)}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 90,
      render: (_, rec) => <Tag color={STATUS_COLORS[rec.status]}>{rec.status}</Tag>,
    },
    {
      title: 'Created',
      key: 'createdAt',
      width: 100,
      render: (_, rec) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
        </Text>
      ),
    },
  ]

  const rowKey = (rec) => rec.approvalId || rec._id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ['--row-selected-bg']: token.colorPrimaryBg }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 8 }}>
        <Select
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: 'pending', label: 'Active only' },
            { value: 'all', label: 'Include old' },
          ]}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Table
          size="small"
          rowKey={rowKey}
          columns={columns}
          dataSource={approvals}
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No approval requests" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          scroll={{ x: 'max-content' }}
          rowClassName={(rec) =>
            (selectedApproval?.approvalId || selectedApproval?._id) === rowKey(rec)
              ? 'request-row-selected'
              : ''
          }
          onRow={(rec) => ({
            onClick: () => onSelect(rec),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
      {pagination && (
        <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            showSizeChanger={false}
            onChange={pagination.onChange}
            size="small"
          />
        </div>
      )}
      <style>{`
        .ant-table-tbody > tr.request-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
      `}</style>
    </div>
  )
}
