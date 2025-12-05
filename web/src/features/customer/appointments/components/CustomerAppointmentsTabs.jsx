import React from 'react'
import { Tabs, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useAuthSession } from '@/features/authentication'
import { authHeaders } from '@/lib/authHeaders.js'
import { getCustomerAppointments } from '@/features/customer/services/appointmentsService.js'

const statusTabs = [
  { key: 'requested', label: 'Under Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function CustomerAppointmentsTabs() {
  const { currentUser } = useAuthSession()
  const [activeKey, setActiveKey] = React.useState('requested')
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState([])

  const load = React.useCallback(async (key) => {
    setLoading(true)
    try {
      const headers = authHeaders(currentUser, 'customer')
      const items = await getCustomerAppointments({ status: key }, headers)
      setData(Array.isArray(items) ? items : [])
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => { load(activeKey) }, [activeKey, load])

  const columns = [
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Provider', dataIndex: 'providerName', key: 'providerName' },
    {
      title: 'Appointment',
      dataIndex: 'appointmentAt',
      key: 'appointmentAt',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: 'Pricing',
      dataIndex: 'pricing',
      key: 'pricing',
      render: (_, row) => {
        if (row.pricingMode === 'hourly' || row.pricingSelection === 'hourly') {
          const rate = row.hourlyRate ? `${row.hourlyRate}/hr` : ''
          const hrs = row.estimatedHours ? `${row.estimatedHours}h` : ''
          return `${rate}${hrs ? ` • ${hrs}` : ''}`
        }
        if (row.pricingMode === 'fixed' || row.pricingSelection === 'fixed') {
          return typeof row.fixedPrice === 'number' ? `${row.fixedPrice}` : 'Fixed'
        }
        return '—'
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag>{s}</Tag>,
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes' },
  ]

  return (
    <div>
      <Typography.Title level={4}>Your Appointments</Typography.Title>
      <Tabs
        activeKey={activeKey}
        onChange={(k) => setActiveKey(k)}
        items={statusTabs.map((t) => ({ key: t.key, label: t.label }))}
      />
      <Table
        rowKey={(r) => r.id}
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
      />
    </div>
  )
}