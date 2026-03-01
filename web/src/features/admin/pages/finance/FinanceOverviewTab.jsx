import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, theme, Table, Statistic, Spin } from 'antd'
import { DollarOutlined, TransactionOutlined, ClockCircleOutlined, BankOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { get } from '@/lib/http.js'

const { Text } = Typography

function formatPeso(value) {
  if (value == null) return '—'
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function FinanceOverviewTab() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentPayments, setRecentPayments] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    get('/api/business/admin/payments/summary')
      .then(res => setSummary(res?.data ?? res ?? {}))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))

    get('/api/business/admin/payments?page=1&limit=10')
      .then(res => {
        const list = res?.data?.payments ?? res?.payments ?? []
        setRecentPayments(Array.isArray(list) ? list : [])
      })
      .catch(() => setRecentPayments([]))
      .finally(() => setRecentLoading(false))
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>Summary</Text>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Total Collections"
                value={summary?.totalCollections || 0}
                prefix="₱"
                precision={2}
                valueStyle={{ color: token.colorSuccess }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="This Month"
                value={summary?.revenueThisMonth || 0}
                prefix="₱"
                precision={2}
                valueStyle={{ color: token.colorPrimary }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Pending Payments"
                value={summary?.pendingPayments || 0}
                valueStyle={{ color: token.colorWarning }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Total Transactions"
                value={summary?.totalTransactions || 0}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 15 }}>Recent Transactions</Text>
          <Link to="/admin/finance?tab=transactions">View all</Link>
        </div>
        <Card size="small">
          <Table
            size="small"
            dataSource={recentPayments}
            rowKey={r => r._id || r.paymentId}
            loading={recentLoading}
            pagination={false}
            onRow={() => ({ onClick: () => navigate('/admin/finance?tab=transactions'), style: { cursor: 'pointer' } })}
            columns={[
              { title: 'Type', dataIndex: 'paymentType', key: 'type', width: 140, render: v => v?.replace(/_/g, ' ') || '—' },
              { title: 'Description', dataIndex: 'description', key: 'desc', render: v => v || '—' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: v => formatPeso(v) },
              { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => v || '—' },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', width: 140, render: v => v ? dayjs(v).format('MMM D, HH:mm') : '—' },
            ]}
            locale={{ emptyText: 'No transactions yet' }}
          />
        </Card>
      </div>
    </div>
  )
}
