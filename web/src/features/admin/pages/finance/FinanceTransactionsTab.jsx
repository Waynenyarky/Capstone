import React, { useState } from 'react'
import { Table, Typography, DatePicker, Space, theme } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'

const { Text } = Typography
const { RangePicker } = DatePicker

const columns = [
  { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
  { title: 'Reference', dataIndex: 'reference', key: 'reference' },
  { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    render: (val) => (val != null ? `₱${Number(val).toFixed(2)}` : '—'),
  },
  { title: 'Method', dataIndex: 'method', key: 'method', width: 100 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
]

export default function FinanceTransactionsTab() {
  const { token } = theme.useToken()
  const [dateRange, setDateRange] = useState(null)

  const dataSource = []

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Space>
          <Text type="secondary">Date range:</Text>
          <RangePicker value={dateRange} onChange={setDateRange} />
        </Space>
      </div>
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{
          emptyText: (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <UnorderedListOutlined style={{ fontSize: 32, color: token.colorTextQuaternary, marginBottom: 8 }} />
              <div>
                <Text type="secondary">No payment transactions yet.</Text>
              </div>
              <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                Connect GET /api/business/admin/payments to list all payments.
              </Text>
            </div>
          ),
        }}
      />
    </div>
  )
}
