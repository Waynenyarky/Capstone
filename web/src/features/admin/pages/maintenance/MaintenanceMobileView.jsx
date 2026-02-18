import React from 'react'
import { Card, Tabs, Button, Table, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import MaintenanceStatusCard from './MaintenanceStatusCard'

const TAB_ITEMS = [
  { key: 'status', label: 'Status' },
  { key: 'requests', label: 'Requests' },
]

export default function MaintenanceMobileView({
  tabKey,
  setTabKey,
  current,
  loading,
  approvals,
  onApprove,
  onOpenRequestModal,
}) {
  const columns = [
    { title: 'ID', dataIndex: 'approvalId', key: 'approvalId' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag>
      ),
    },
    { title: 'Action', key: 'action', render: (_, rec) => rec.requestDetails?.action || '-' },
    { title: 'Message', key: 'message', render: (_, rec) => rec.requestDetails?.message || '-' },
    {
      title: 'Approve',
      key: 'approve',
      render: (_, rec) =>
        rec.status === 'pending' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => onApprove(rec.approvalId, true)}>
              Approve
            </Button>
            <Button size="small" danger onClick={() => onApprove(rec.approvalId, false)}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  const statusTab = (
    <div style={{ padding: 16 }}>
      <MaintenanceStatusCard current={current} loading={loading} />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onOpenRequestModal}
        style={{ marginTop: 16 }}
        block
      >
        {current?.isActive ? 'Disable maintenance' : 'Enable maintenance'}
      </Button>
    </div>
  )

  const requestsTab = (
    <div style={{ padding: 16 }}>
      <Table
        rowKey="approvalId"
        dataSource={approvals}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )

  const tabChildren = {
    status: statusTab,
    requests: requestsTab,
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
