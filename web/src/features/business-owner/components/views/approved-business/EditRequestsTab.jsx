import { useState, useEffect, useMemo } from 'react'
import { Typography, Table, Empty, Tag } from 'antd'
import { getEditRequests } from '../../../services/editRequestsService'
import { formatDate } from '../../../utils/formatters.js'

const { Text } = Typography

export default function EditRequestsTab({ businessId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    getEditRequests()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.requests || []
        setRequests(all.filter(r => r.businessId === businessId || !businessId))
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [businessId])

  // Group flat field rows into requests by requestId or createdAt batch
  const grouped = useMemo(() => {
    const map = new Map()
    requests.forEach(r => {
      const key = r.requestId || r._id
      if (!map.has(key)) {
        map.set(key, { ...r, fields: [] })
      }
      const group = map.get(key)
      if (r.fieldName) {
        group.fields.push({ fieldName: r.fieldName, currentValue: r.currentValue, requestedValue: r.requestedValue })
      }
    })
    return Array.from(map.values())
  }, [requests])

  const columns = [
    { title: 'Request', key: 'summary', render: (_, r) => r.fields.length > 0 ? `${r.fields.length} field change${r.fields.length > 1 ? 's' : ''}` : r.fieldName || 'Edit request' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'approved' ? 'success' : v === 'rejected' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 150 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true, render: v => v || '-' },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.requestId}
      columns={columns}
      dataSource={grouped}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No edit requests" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      expandable={{
        expandedRowRender: (record) => record.fields.length > 0 ? (
          <Table
            size="small"
            dataSource={record.fields}
            rowKey={(f, i) => `${record._id}-${i}`}
            pagination={false}
            columns={[
              { title: 'Field', dataIndex: 'fieldName', key: 'field', width: 180 },
              { title: 'Current Value', dataIndex: 'currentValue', key: 'current', ellipsis: true },
              { title: 'Requested Value', dataIndex: 'requestedValue', key: 'requested', ellipsis: true },
            ]}
          />
        ) : null,
        rowExpandable: (r) => r.fields?.length > 0,
      }}
    />
  )
}
