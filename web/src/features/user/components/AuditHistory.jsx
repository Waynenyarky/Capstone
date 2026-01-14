import { useState, useEffect } from 'react'
import { Card, Table, Typography, Space, Button, DatePicker, Select, Tag, Tooltip } from 'antd'
import { DownloadOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { getAuditHistory, exportAuditHistory } from '@/features/user/services/auditService.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export default function AuditHistory() {
  const { currentUser, role } = useAuthSession()
  const { error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [dateRange, setDateRange] = useState(null)
  const [eventTypeFilter, setEventTypeFilter] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadHistory()
  }, [currentUser, dateRange, eventTypeFilter, pagination.current, pagination.pageSize])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      
      if (eventTypeFilter) {
        params.eventType = eventTypeFilter
      }
      
      const result = await getAuditHistory(params, currentUser, role)
      setData(result?.auditLogs || [])
      setPagination(prev => ({
        ...prev,
        total: result?.total || 0,
      }))
    } catch (err) {
      console.error('Failed to load audit history:', err)
      error(err, 'Failed to load audit history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format = 'csv') => {
    try {
      const params = {}
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      if (eventTypeFilter) {
        params.eventType = eventTypeFilter
      }
      
      const blob = await exportAuditHistory(format, params, currentUser, role)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-history-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export audit history:', err)
      error(err, 'Failed to export audit history')
    }
  }

  const maskSensitiveData = (value, field) => {
    if (!value) return value
    const str = String(value)
    
    // Mask passwords
    if (field === 'password' || str.includes('"password"')) {
      return '••••••••'
    }
    
    // Mask email partially
    if (field === 'email' && str.includes('@')) {
      const [local, domain] = str.split('@')
      if (local.length > 2) {
        return `${local.substring(0, 2)}***@${domain}`
      }
      return `***@${domain}`
    }
    
    return str
  }

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
      width: 180,
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (type) => {
        const colors = {
          email_change: 'blue',
          password_change: 'red',
          profile_update: 'cyan',
          mfa_change: 'green',
          admin_approval_request: 'orange',
          admin_approval_approved: 'green',
          admin_approval_rejected: 'red',
        }
        return (
          <Tag color={colors[type] || 'default'}>
            {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Tag>
        )
      },
      filters: [
        { text: 'Email Change', value: 'email_change' },
        { text: 'Password Change', value: 'password_change' },
        { text: 'Profile Update', value: 'profile_update' },
        { text: 'MFA Change', value: 'mfa_change' },
        { text: 'Admin Approval', value: 'admin_approval_request' },
      ],
    },
    {
      title: 'Field Changed',
      dataIndex: 'fieldChanged',
      key: 'fieldChanged',
      render: (field) => field || '-',
    },
    {
      title: 'Old Value',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (value, record) => {
        try {
          const parsed = JSON.parse(value)
          return maskSensitiveData(JSON.stringify(parsed), record.fieldChanged)
        } catch {
          return maskSensitiveData(value, record.fieldChanged)
        }
      },
      ellipsis: true,
    },
    {
      title: 'New Value',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (value, record) => {
        try {
          const parsed = JSON.parse(value)
          return maskSensitiveData(JSON.stringify(parsed), record.fieldChanged)
        } catch {
          return maskSensitiveData(value, record.fieldChanged)
        }
      },
      ellipsis: true,
    },
    {
      title: 'Changed By',
      dataIndex: 'changedBy',
      key: 'changedBy',
      render: (changedBy, record) => {
        if (changedBy === 'self' || String(record.userId) === String(currentUser?._id)) {
          return <Tag color="blue">You</Tag>
        }
        return <Tag color="orange">Admin</Tag>
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <HistoryOutlined /> Audit History
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
            allowClear
          />
          <Select
            placeholder="Filter by type"
            value={eventTypeFilter}
            onChange={setEventTypeFilter}
            allowClear
            style={{ width: 200 }}
          >
            <Option value="email_change">Email Change</Option>
            <Option value="password_change">Password Change</Option>
            <Option value="profile_update">Profile Update</Option>
            <Option value="mfa_change">MFA Change</Option>
            <Option value="admin_approval_request">Admin Approval</Option>
          </Select>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="_id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} records`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize,
            }))
          },
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
