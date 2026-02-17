import React, { useState, useEffect, useCallback } from 'react'
import { Table, Select, DatePicker, Button, Spin, Alert, Typography, Space, Empty, Tag } from 'antd'
import { HistoryOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import AdminLayout from '../components/AdminLayout.jsx'
import { get } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'

const { RangePicker } = DatePicker
const { Text } = Typography

const ACTION_COLORS = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  approve: 'cyan',
  reject: 'orange',
  login: 'purple',
}

export default function AdminActivityDashboard() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [adminFilter, setAdminFilter] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [error, setError] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const { error: notifyError } = useNotifier()

  useEffect(() => {
    let cancelled = false
    async function fetchAdminUsers() {
      try {
        const res = await get('/api/admin/users')
        if (!cancelled) {
          const users = res?.data || res || []
          setAdminUsers(
            users.map((u) => ({
              value: u._id || u.id,
              label: u.email || u.name || u._id || u.id,
            }))
          )
        }
      } catch {
        // Fail silently – the filter will simply have no options
      }
    }
    fetchAdminUsers()
    return () => { cancelled = true }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page, limit })
      if (adminFilter) params.append('adminId', adminFilter)
      if (dateRange?.[0]) params.append('dateFrom', dateRange[0].toISOString())
      if (dateRange?.[1]) params.append('dateTo', dateRange[1].toISOString())

      const res = await get(`/api/admin/monitoring/audit-logs?${params.toString()}`)
      setLogs(res?.data?.logs || res?.data || [])
      setTotal(res?.meta?.total || res?.data?.length || 0)
    } catch (err) {
      setError(err?.message || 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }, [page, limit, adminFilter, dateRange])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleExport = useCallback(() => {
    // Simple CSV export
    const headers = ['Admin', 'Action', 'Resource', 'Timestamp', 'Details']
    const rows = logs.map((log) => [
      log.userEmail || log.userId || '',
      log.action || '',
      log.resource || log.resourceType || '',
      log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
      log.details || log.description || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-activity-${dayjs().format('YYYY-MM-DD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [logs])

  const columns = [
    {
      title: 'Admin',
      dataIndex: 'userEmail',
      key: 'admin',
      render: (email, record) => email || record.userId || '-',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={ACTION_COLORS[action?.toLowerCase()] || 'default'}>
          {action || '-'}
        </Tag>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource, record) => resource || record.resourceType || '-',
    },
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'timestamp',
      render: (date) => date ? dayjs(date).format('MMM D, YYYY h:mm A') : '-',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details, record) => details || record.description || '-',
    },
  ]

  const headerActions = (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={logs.length === 0}>
        Export
      </Button>
    </Space>
  )

  return (
    <AdminLayout
      pageTitle="Admin Activity"
      pageIcon={<HistoryOutlined />}
      headerActions={headerActions}
    >
      <div style={{ padding: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            showSearch
            placeholder="Filter by admin"
            value={adminFilter}
            onChange={setAdminFilter}
            options={adminUsers}
            optionFilterProp="label"
            style={{ minWidth: 200 }}
          />
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            allowClear
          />
        </Space>

        {error ? (
          <Alert
            type="error"
            message="Failed to load activity logs"
            description={error}
            action={<Button onClick={fetchLogs}>Retry</Button>}
          />
        ) : (
          <Table
            aria-label="Admin activity logs"
            dataSource={logs}
            columns={columns}
            rowKey={(record) => record._id || record.id || Math.random()}
            loading={loading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
            }}
            locale={{ emptyText: <Empty description="No admin activity recorded." /> }}
            scroll={{ x: 'max-content' }}
          />
        )}

        <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <Text strong>Admin Account Policy</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>3 admin accounts exist for separation of duties and mutual oversight.</li>
            <li>Admin accounts cannot self-approve actions (enforced via AdminApproval model).</li>
            <li>All admin actions are logged in the audit trail for peer review.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
