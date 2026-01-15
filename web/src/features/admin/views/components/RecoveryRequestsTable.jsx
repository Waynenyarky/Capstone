import { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Button, Space, Typography } from 'antd'
import { getRecoveryRequests } from '../../services/recoveryService.js'
import RecoveryRequestFilters from './RecoveryRequestFilters.jsx'
import RecoveryRequestDetail from './RecoveryRequestDetail.jsx'
import IssueTemporaryCredentialsModal from './IssueTemporaryCredentialsModal.jsx'

const { Text } = Typography

export default function RecoveryRequestsTable() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: 'pending' })
  const [selected, setSelected] = useState(null)
  const [issueOpen, setIssueOpen] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getRecoveryRequests(filters)
      setRequests(data?.requests || [])
    } catch (err) {
      console.error('Failed to load recovery requests', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filters])

  const columns = useMemo(() => ([
    { title: 'User', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'Office', dataIndex: 'office', key: 'office' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => {
        const color = rec.status === 'approved' ? 'green' : rec.status === 'pending' ? 'gold' : 'red'
        return <Tag color={color}>{rec.status}</Tag>
      },
    },
    { title: 'Requested', dataIndex: 'requestedAt', key: 'requestedAt', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, rec) => (
        <Space>
          <Button size="small" onClick={() => setSelected(rec)}>View</Button>
          {rec.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => { setSelected(rec); setIssueOpen(true) }}>
              Issue Credentials
            </Button>
          )}
        </Space>
      ),
    },
  ]), [])

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <RecoveryRequestFilters value={filters} onChange={setFilters} onRefresh={load} />
        <Table
          rowKey="id"
          dataSource={requests}
          columns={columns}
          loading={loading}
          pagination={false}
          size="small"
        />
        {requests.length === 0 && !loading && <Text type="secondary">No recovery requests match the filters.</Text>}
      </Space>

      <RecoveryRequestDetail request={selected} onClose={() => setSelected(null)} />
      {selected && (
        <IssueTemporaryCredentialsModal
          open={issueOpen}
          onClose={() => setIssueOpen(false)}
          recoveryRequest={selected}
          onIssued={load}
        />
      )}
    </div>
  )
}
