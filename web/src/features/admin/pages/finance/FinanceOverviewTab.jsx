import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, theme, Table } from 'antd'
import { DollarOutlined, TransactionOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { get } from '@/lib/http.js'

const { Text } = Typography

export default function FinanceOverviewTab() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [recentActivity, setRecentActivity] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    get('/api/admin/finance/recent-activity?limit=10')
      .then((res) => {
        if (!cancelled) {
          const list = res?.data ?? res ?? []
          setRecentActivity(Array.isArray(list) ? list : [])
        }
      })
      .catch(() => {
        if (!cancelled) setRecentActivity([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
        Summary
      </Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Total collections (this month)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorPrimaryBg,
                    color: token.colorPrimary,
                  }}
                >
                  <DollarOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connect revenue API to show data
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Transactions (this month)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorSuccessBg,
                    color: token.colorSuccess,
                  }}
                >
                  <TransactionOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connect payments API to show count
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Pending collections
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorWarningBg,
                    color: token.colorWarning,
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Unpaid or overdue items
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 15 }}>
            Recent activity
          </Text>
          <Link to="/admin/finance?tab=transactions">View all</Link>
        </div>
        <Card size="small">
          <Table
            size="small"
            dataSource={recentActivity}
            rowKey={(r, i) => r.id || r._id || String(i)}
            loading={recentLoading}
            pagination={false}
            onRow={(record) => ({
              onClick: () => navigate('/admin/finance?tab=transactions'),
              style: { cursor: 'pointer' },
            })}
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (v) => v || '—' },
              { title: 'Description', dataIndex: 'description', key: 'description', render: (v) => v || '—' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => (v != null ? `₱${Number(v).toLocaleString()}` : '—') },
              { title: 'Date', dataIndex: 'date', key: 'date', width: 160, render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—') },
            ]}
            locale={{ emptyText: 'No recent activity. Connect payments API to show data.' }}
          />
        </Card>
      </div>
    </div>
  )
}
