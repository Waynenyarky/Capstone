/**
 * View Page: AppealsOverviewPage
 * Appeals Overview page for LGU Manager
 * Read-only oversight module — correctly maps backend response
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, Typography, theme, Space, Button, Select, Row, Col, Table, Tag, Empty, Alert } from 'antd'
import { AuditOutlined, ReloadOutlined } from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_COLORS = {
  submitted: 'processing', under_review: 'warning', approved: 'success',
  rejected: 'error', resolved: 'success', dismissed: 'default',
}

export default function AppealsOverviewPage() {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (status) qs.set('status', status)
      const res = await get(`/api/lgu-manager/overview/appeals?${qs}`)
      setData(res?.data || res || {})
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchData() }, [fetchData])

  const kpi = data?.kpi || { total: 0, byStatus: {} }
  const items = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { total: 0, pages: 1 }

  const columns = [
    { title: 'Business ID', dataIndex: 'businessId', key: 'businessId', render: (v) => v ? <Text code>{v}</Text> : '—' },
    { title: 'Appeal Type', dataIndex: 'appealType', key: 'appealType', render: (v) => v?.replace(/_/g, ' ') || '—' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s || '—'}</Tag>,
    },
    { title: 'Requester', dataIndex: 'requesterName', key: 'requester', render: (v) => v || '—' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Resolved', dataIndex: 'resolvedAt', key: 'resolvedAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  if (error) {
    return (
      <LGUManagerLayout pageTitle="Appeals - Overview" pageIcon={<AuditOutlined />}>
        <div style={{ padding: 16 }}>
          <Alert message="Error" description={error} type="error" showIcon action={<Button onClick={fetchData}>Retry</Button>} />
        </div>
      </LGUManagerLayout>
    )
  }

  return (
    <LGUManagerLayout pageTitle="Appeals - Overview" pageIcon={<AuditOutlined />}>
      <div style={{ padding: 16 }}>
        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small"><Text type="secondary" style={{ fontSize: 12 }}>Total</Text><div style={{ fontSize: 20, fontWeight: 600 }}>{kpi.total}</div></Card>
          </Col>
          {Object.entries(kpi.byStatus).map(([s, count]) => (
            <Col xs={12} sm={8} md={4} key={s}>
              <Card size="small"><Text type="secondary" style={{ fontSize: 12 }}>{s}</Text><div style={{ fontSize: 20, fontWeight: 600 }}>{count}</div></Card>
            </Col>
          ))}
        </Row>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="Filter by status"
              style={{ width: 180 }}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1) }}
              allowClear
            >
              {Object.keys(kpi.byStatus).map((s) => (
                <Select.Option key={s} value={s}>{s}</Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
          </Space>
        </Card>

        {/* Table */}
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(r) => r._id}
          loading={loading}
          locale={{ emptyText: <Empty description="No appeals found" /> }}
          pagination={{
            current: page, pageSize, total: pagination.total,
            onChange: setPage, showSizeChanger: false,
          }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </div>
    </LGUManagerLayout>
  )
}
