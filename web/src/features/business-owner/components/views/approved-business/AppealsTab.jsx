import { useState, useEffect } from 'react'
import { Table, Empty, Tag } from 'antd'
import { getAppeals } from '../../../services/appealsService'
import { formatDate } from '../../../utils/formatters.js'

export default function AppealsTab({ businessId }) {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    getAppeals()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.appeals || []
        setAppeals(all.filter(a => a.businessId === businessId || !businessId))
      })
      .catch(() => setAppeals([]))
      .finally(() => setLoading(false))
  }, [businessId])

  const columns = [
    { title: 'Type', dataIndex: 'appealType', key: 'type', width: 140 },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: v => <Tag color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : v === 'under_review' ? 'processing' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 120 },
    {
      title: 'Resolution', dataIndex: 'resolution', key: 'resolution', width: 200,
      render: (v, r) => r.status === 'rejected' || r.status === 'approved' ? (v || 'N/A') : '—',
    },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.appealId}
      columns={columns}
      dataSource={appeals}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No appeals filed" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
}
