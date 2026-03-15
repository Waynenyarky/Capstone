/**
 * View Page: ViolationsInspectionsOverviewPage
 * Violations & Inspections Overview page for LGU Manager
 * Read-only oversight module — correctly maps backend response
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, Typography, theme, Space, Button, Select, Row, Col, Table, Tag, Empty, Alert, Tabs } from 'antd'
import { SolutionOutlined, ReloadOutlined, WarningOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text } = Typography

const VIOLATION_STATUS_COLORS = {
  pending: 'processing', resolved: 'success', escalated: 'error', acknowledged: 'warning',
}
const INSPECTION_STATUS_COLORS = {
  pending: 'processing', scheduled: 'warning', in_progress: 'blue',
  completed: 'success', cancelled: 'default', missed: 'error',
}

export default function ViolationsInspectionsOverviewPage() {
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [type, setType] = useState('both')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = new URLSearchParams({ page: String(page), limit: String(pageSize), type })
      const res = await get(`/api/lgu-manager/overview/violations-inspections?${qs}`)
      setData(res?.data || res || {})
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, type])

  useEffect(() => { fetchData() }, [fetchData])

  const kpi = data?.kpi || { violations: { total: 0, byStatus: {} }, inspections: { total: 0, byStatus: {}, overdue: 0 } }
  const items = useMemo(() => data?.items || [], [data])
  const pagination = data?.pagination || { total: 0, pages: 1 }

  const violationColumns = [
    { title: 'Violation ID', dataIndex: 'violationId', key: 'violationId', render: (v) => v ? <Text code>{v}</Text> : '—' },
    { title: 'Type', dataIndex: 'violationType', key: 'violationType' },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (v) => <Tag color={v === 'critical' ? 'red' : v === 'major' ? 'orange' : 'default'}>{v || '—'}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={VIOLATION_STATUS_COLORS[s] || 'default'}>{s || '—'}</Tag> },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v) => v || '—' },
    { title: 'Issued', dataIndex: 'issuedAt', key: 'issuedAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  const inspectionColumns = [
    { title: 'Business', dataIndex: 'businessName', key: 'businessName', ellipsis: true },
    { title: 'Type', dataIndex: 'inspectionType', key: 'inspectionType' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={INSPECTION_STATUS_COLORS[s] || 'default'}>{s || '—'}</Tag> },
    { title: 'Result', dataIndex: 'overallResult', key: 'result', render: (v) => v || '—' },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v) => v || '—' },
    { title: 'Scheduled', dataIndex: 'scheduledDate', key: 'scheduledDate', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  const bothColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'violation' ? 'red' : 'blue'}>{v}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s || '—'}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  const columns = type === 'violations' ? violationColumns : type === 'inspections' ? inspectionColumns : bothColumns

  if (error) {
    return (
      <LGUManagerLayout pageTitle="Violations / Inspections - Overview" pageIcon={<SolutionOutlined />}>
        <div style={{ padding: 16 }}>
          <Alert message="Error" description={error} type="error" showIcon action={<Button onClick={fetchData}>Retry</Button>} />
        </div>
      </LGUManagerLayout>
    )
  }

  return (
    <LGUManagerLayout pageTitle="Violations / Inspections - Overview" pageIcon={<SolutionOutlined />}>
      <div style={{ padding: 16 }}>
        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Text type="secondary" style={{ fontSize: 12 }}><WarningOutlined /> Violations</Text>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{kpi.violations.total}</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Text type="secondary" style={{ fontSize: 12 }}><SafetyCertificateOutlined /> Inspections</Text>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{kpi.inspections.total}</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={kpi.inspections.overdue > 0 ? { borderColor: token.colorError } : {}}>
              <Text type="secondary" style={{ fontSize: 12 }}>Overdue</Text>
              <div style={{ fontSize: 20, fontWeight: 600, color: kpi.inspections.overdue > 0 ? token.colorError : undefined }}>{kpi.inspections.overdue}</div>
            </Card>
          </Col>
          {Object.entries(kpi.violations.byStatus).map(([s, count]) => (
            <Col xs={12} sm={8} md={4} key={`v-${s}`}>
              <Card size="small"><Text type="secondary" style={{ fontSize: 12 }}>V: {s}</Text><div style={{ fontSize: 18, fontWeight: 600 }}>{count}</div></Card>
            </Col>
          ))}
          {Object.entries(kpi.inspections.byStatus).map(([s, count]) => (
            <Col xs={12} sm={8} md={4} key={`i-${s}`}>
              <Card size="small"><Text type="secondary" style={{ fontSize: 12 }}>I: {s}</Text><div style={{ fontSize: 18, fontWeight: 600 }}>{count}</div></Card>
            </Col>
          ))}
        </Row>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select value={type} onChange={(v) => { setType(v); setPage(1) }} style={{ width: 180 }}>
              <Select.Option value="both">Both</Select.Option>
              <Select.Option value="violations">Violations Only</Select.Option>
              <Select.Option value="inspections">Inspections Only</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
          </Space>
        </Card>

        {/* Table */}
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(r) => r._id || r.violationId || r.businessId}
          loading={loading}
          locale={{ emptyText: <Empty description="No records found" /> }}
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
