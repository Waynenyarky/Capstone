import { Table, Tag } from 'antd'

export default function SecurityEventsTable({ events = [], loading }) {
  const columns = [
    { title: 'Event', dataIndex: 'eventType', key: 'eventType' },
    { title: 'User', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
    { title: 'When', dataIndex: 'timestamp', key: 'timestamp', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (v) => <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'orange' : 'blue'}>{v || 'info'}</Tag> },
  ]

  return (
    <Table
      rowKey={(rec, idx) => rec.id || idx}
      dataSource={events}
      columns={columns}
      loading={loading}
      pagination={false}
      size="small"
    />
  )
}
