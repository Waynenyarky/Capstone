import React, { useState, useEffect, useCallback } from 'react'
import { Typography, Card, Statistic, Select, Table, Empty, Spin, Grid, theme, Space, Button } from 'antd'
import { BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons'
import { StaffLayout } from '../../components'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function StaffReportsPage() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    get(`/api/admin/my-activity?period=${period}`)
      .then(res => setData(res?.data || res || {}))
      .catch(() => setData({ totalReviews: 0, approved: 0, rejected: 0, pending: 0, recentActivity: [] }))
      .finally(() => setLoading(false))
  }, [period])

  const activityColumns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'date', width: 140, render: v => v ? dayjs(v).format('MMM D, h:mm A') : 'N/A' },
    { title: 'Action', dataIndex: 'eventType', key: 'action', render: (v, r) => v || r.action || 'Activity' },
    { title: 'Details', dataIndex: 'metadata', key: 'details', render: v => v?.businessName || v?.description || '-' },
  ]

  return (
    <StaffLayout pageTitle="My Activity Report" pageIcon={<BarChartOutlined />}>
      <div style={{ padding: 24, maxWidth: 960 }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space align="center">
            <Text strong>Period:</Text>
            <Select value={period} onChange={setPeriod} style={{ width: 160 }} options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' },
            ]} />
          </Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              if (!data) return
              const rows = [['Date', 'Action', 'Details']]
              ;(data.recentActivity || []).forEach(r => {
                rows.push([r.createdAt || '', r.eventType || r.action || '', r.metadata?.businessName || r.metadata?.description || ''])
              })
              const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `activity_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            disabled={!data}
          >
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: screens.md ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              <Card>
                <Statistic title="Total Reviews" value={data?.totalReviews || 0} prefix={<FileTextOutlined />} />
              </Card>
              <Card>
                <Statistic title="Approved" value={data?.approved || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: token.colorSuccess }} />
              </Card>
              <Card>
                <Statistic title="Rejected" value={data?.rejected || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: token.colorError }} />
              </Card>
              <Card>
                <Statistic title="Pending" value={data?.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: token.colorWarning }} />
              </Card>
            </div>

            <Title level={5}>Recent Activity</Title>
            <Table
              size="small"
              rowKey={(r, i) => r._id || i}
              columns={activityColumns}
              dataSource={data?.recentActivity || []}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: <Empty description="No activity recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </>
        )}
      </div>
    </StaffLayout>
  )
}
