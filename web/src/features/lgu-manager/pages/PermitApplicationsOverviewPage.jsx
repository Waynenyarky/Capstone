/**
 * View Page: PermitApplicationsOverviewPage
 * Permit Applications Overview page for LGU Manager
 * Read-only oversight module — correctly maps backend response
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, Typography, theme, Space, Button, Select, Input, Row, Col, Table, Tag, Empty, Spin, Alert } from 'antd'
import { FileTextOutlined, ReloadOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS_COLORS = {
  submitted: 'processing', under_review: 'warning', approved: 'success',
  rejected: 'error', for_correction: 'orange', draft: 'default', closed: 'default',
}

export default function PermitApplicationsOverviewPage() {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(undefined)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (status) qs.set('status', status)
      if (search.trim()) qs.set('search', search.trim())
      const res = await get(`/api/lgu-manager/overview/permits?${qs}`)
      setData(res?.data || res || {})
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { fetchData() }, [fetchData])

  const kpi = data?.kpi || { total: 0, byStatus: {} }
  const items = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { total: 0, pages: 1 }

  const columns = [
    { title: 'Business Name', dataIndex: 'businessName', key: 'businessName', ellipsis: true },
    { title: 'Reference #', dataIndex: 'applicationReferenceNumber', key: 'ref', render: (v) => v ? <Text code>{v}</Text> : '—' },
    {
      title: 'Status', dataIndex: 'applicationStatus', key: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{s || '—'}</Tag>,
    },
    { title: 'Submitted', dataIndex: 'submittedAt', key: 'submittedAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Reviewed', dataIndex: 'reviewedAt', key: 'reviewedAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  const handleExport = useCallback(() => {
    const headers = ['Business Name', 'Reference #', 'Status', 'Submitted', 'Reviewed']
    const rows = items.map((i) => [i.businessName, i.applicationReferenceNumber, i.applicationStatus, i.submittedAt, i.reviewedAt])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `permit-applications-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [items])

  if (error) {
    return (
      <LGUManagerLayout pageTitle="Permit Applications - Overview" pageIcon={<FileTextOutlined />}>
        <div style={{ padding: 16 }}>
          <Alert message="Error" description={error} type="error" showIcon action={<Button onClick={fetchData}>Retry</Button>} />
        </div>
      </LGUManagerLayout>
    )
  }

  return (
    <LGUManagerLayout pageTitle="Permit Applications - Overview" pageIcon={<FileTextOutlined />}>
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
            <Input
              placeholder="Search business name or ref#"
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => { setPage(1); fetchData() }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={items.length === 0}>Export CSV</Button>
          </Space>
        </Card>

        {/* Table */}
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(r) => r.businessId || r._id}
          loading={loading}
          locale={{ emptyText: <Empty description="No permit applications found" /> }}
          pagination={{
            current: page,
            pageSize,
            total: pagination.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </div>
    </LGUManagerLayout>
  )
}
