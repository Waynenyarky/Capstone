import { useState, useEffect, useCallback } from 'react'
import { Table, Typography, Select, Input, Space, Tag, theme } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { get } from '@/lib/http.js'

const { Text } = Typography

export default function FinanceTransactionsTab() {
  const { token } = theme.useToken()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const pageSize = 20

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: pageSize })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search.trim()) params.append('search', search.trim())

      const res = await get(`/api/business/admin/payments?${params}`)
      const data = res?.data ?? res ?? {}
      setPayments(Array.isArray(data.payments) ? data.payments : [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { setPage(1) }, [statusFilter, search])

  const statusColors = { paid: 'success', pending: 'processing', failed: 'error', refunded: 'warning', cancelled: 'default' }

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'date', width: 140, render: v => v ? dayjs(v).format('MMM D, YYYY') : '—' },
    { title: 'Reference', dataIndex: 'paymentId', key: 'ref', render: v => v || '—' },
    { title: 'Type', dataIndex: 'paymentType', key: 'type', width: 150, render: v => v?.replace(/_/g, ' ') || '—' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: v => v != null ? `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—' },
    { title: 'Method', dataIndex: 'paymentMethod', key: 'method', width: 100, render: v => v || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={statusColors[v] || 'default'}>{v || '—'}</Tag> },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Space>
          <Text type="secondary">Status:</Text>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} options={[
            { value: 'all', label: 'All' },
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
          ]} />
        </Space>
        <Input
          placeholder="Search reference or description"
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>
      <Table
        size="small"
        columns={columns}
        dataSource={payments}
        rowKey={r => r._id || r.paymentId}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize,
          onChange: setPage,
          showTotal: t => `${t} transactions`,
        }}
      />
    </div>
  )
}
