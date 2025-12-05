import React from 'react'
import { Card, Table, Tag, Button } from 'antd'

export default function ProviderServicesTable({ offerings = [], onSelect, selectedId }) {
  const columns = [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Pricing Mode', dataIndex: 'pricingMode', key: 'pricingMode' },
    { title: 'Fixed Price', dataIndex: 'fixedPrice', key: 'fixedPrice', render: (v) => (typeof v === 'number' ? v : '—') },
    { title: 'Hourly Rate', dataIndex: 'hourlyRate', key: 'hourlyRate', render: (v) => (typeof v === 'number' ? v : '—') },
    { title: 'Emergency', dataIndex: 'emergencyAvailable', key: 'emergencyAvailable', render: (v) => (v ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>) },
    { title: 'Active', dataIndex: 'active', key: 'active', render: (v) => (v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => onSelect && onSelect(record.id)} type={record.id === selectedId ? 'primary' : 'default'}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <Card title="My Services" size="small">
      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={offerings}
        pagination={false}
        size="small"
      />
    </Card>
  )
}