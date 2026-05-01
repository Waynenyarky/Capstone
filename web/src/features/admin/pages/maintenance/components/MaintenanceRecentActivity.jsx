import React from 'react'
import { Table, Typography, Tag } from 'antd'
import dayjs from 'dayjs'
import { ACTION_LABELS } from '../constants/maintenance.constants.js'
import { requestedByDisplay } from '../utils/maintenance.utils.js'

const { Text } = Typography

export default function MaintenanceRecentActivity({ recentActivitySource, isAuditLog, onRowClick, loading }) {
  const columns = [
    {
      title: 'Date',
      dataIndex: isAuditLog ? 'timestamp' : 'createdAt',
      key: 'date',
      width: 150,
      render: (date) => dayjs(date).format('MMM D, YYYY HH:mm'),
    },
    {
      title: 'Action',
      dataIndex: isAuditLog ? 'eventType' : 'status',
      key: 'action',
      width: 150,
      render: (action) => {
        const label = isAuditLog ? ACTION_LABELS[action] || action : action
        return <Tag>{label}</Tag>
      },
    },
    {
      title: 'Reason',
      dataIndex: isAuditLog ? 'metadata.reason' : 'requestDetails.reason',
      key: 'reason',
      render: (reason) => reason || '—',
    },
    {
      title: 'Requested By',
      dataIndex: isAuditLog ? 'userId' : 'requestedBy',
      key: 'requestedBy',
      render: (user) => requestedByDisplay(user),
    },
  ]

  return (
    <div>
      <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
        Recent Activity
      </Text>
      <Table
        columns={columns}
        dataSource={recentActivitySource}
        rowKey={(record) => record._id || record.approvalId || record.logId}
        pagination={false}
        size="small"
        loading={loading}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record),
          style: { cursor: 'pointer' },
        })}
        scroll={{ y: 300 }}
      />
    </div>
  )
}
