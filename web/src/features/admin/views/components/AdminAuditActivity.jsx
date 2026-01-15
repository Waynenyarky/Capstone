import { useEffect, useState, useCallback } from 'react'
import { Card, Table, Tag, Space, Typography, DatePicker, Select, Button, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useAuthSession } from '@/features/authentication'
import { useNotifier } from '@/shared/notifications'
import { getAuditHistoryAdmin } from '../../services'

const { Text } = Typography
const { RangePicker } = DatePicker

export default function AdminAuditActivity() {
  const { currentUser, role } = useAuthSession()
  const { error } = useNotifier()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [eventType, setEventType] = useState()
  const [dateRange, setDateRange] = useState(null)

  const loadLogs = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      setLoading(true)
      const params = { userId: currentUser.id, limit: 50 }
      if (eventType) params.eventType = eventType
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      const res = await getAuditHistoryAdmin(params)
      setLogs(res?.logs || res?.auditLogs || [])
    } catch (e) {
      console.error('Load admin audit logs error:', e)
      error(e, 'Failed to load admin activity')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, eventType, dateRange, error])

  useEffect(() => {
    loadLogs()
  }, [loadLogs, currentUser?.id, eventType, dateRange])

  const columns = [
    {
      title: 'When',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : ''),
    },
    {
      title: 'Event',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    { title: 'Field', dataIndex: 'fieldChanged', key: 'fieldChanged' },
    {
      title: 'Value',
      key: 'value',
      render: (_v, rec) => {
        const reason = rec?.metadata?.reason
        const newValue = rec?.newValue
        if (reason) {
          return (
            <Space direction="vertical" size={0}>
              <Text>{newValue || '-'}</Text>
              <Text type="secondary">Reason: {reason}</Text>
            </Space>
          )
        }
        return newValue || '-'
      },
    },
    {
      title: 'IP',
      dataIndex: ['metadata', 'ip'],
      key: 'ip',
      render: (v) => v || '—',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (v) => <Tag>{v || role}</Tag>,
    },
  ]

  const eventOptions = [
    'profile_update',
    'password_change',
    'email_change',
    'session_invalidated',
    'maintenance_mode',
  ]

  return (
    <Card
      title="My Admin Activity"
      extra={
        <Space>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Select
            allowClear
            placeholder="Event type"
            style={{ width: 160 }}
            value={eventType}
            onChange={setEventType}
            options={eventOptions.map((e) => ({ value: e, label: e }))}
          />
          <Button onClick={loadLogs} loading={loading}>Refresh</Button>
        </Space>
      }
    >
      <Table
        rowKey={(rec) => rec.id || rec._id}
        dataSource={logs}
        columns={columns}
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No recent admin activity' }}
      />
      <div style={{ marginTop: 8 }}>
        <Tooltip title="Reason is required for admin-initiated changes.">
          <Text type="secondary">Includes change reasons where provided.</Text>
        </Tooltip>
      </div>
    </Card>
  )
}
