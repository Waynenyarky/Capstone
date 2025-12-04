import { Table, Button, Row, Col, Tabs } from 'antd'
import { useProvidersApplicationsTable } from "@/features/admin/providers/hooks/useProvidersApplicationsTable.js"
import { getProviderStatusLabel } from "@/features/admin/providers/constants/providerStatus.js"
import { ReviewProviderApplicationForm } from "@/features/admin/providers"
import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"
import { subscribeProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"

export default function ProviderApplicationsTable() {
  const [activeTab, setActiveTab] = useState('pending')
  const { applications, isLoading, reloadApplications } = useProvidersApplicationsTable(activeTab === 'all' ? '' : activeTab)
  const [selectedId, setSelectedId] = useState(null)
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 })

  // Data hook now subscribes to provider status changes and auto-reloads

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (val) => getProviderStatusLabel(val) },
    { title: 'Rejection Reason', dataIndex: 'rejectionReason', key: 'rejectionReason', render: (val) => val || '-' },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button onClick={() => setSelectedId(row.id)}>
          Review
        </Button>
      ),
    },
  ]
  const rows = applications

  const reloadCounts = async () => {
    const res = await fetchWithFallback('/api/providers/applications-summary')
    if (!res || !res.ok) return
    const data = await res.json()
    setCounts({
      pending: Number(data.pendingCount || 0),
      approved: Number(data.approvedCount || 0),
      rejected: Number(data.rejectedCount || 0),
      all: Number(data.allCount || 0),
    })
  }

  useEffect(() => {
    reloadCounts()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeProviderStatusChanged(() => {
      reloadCounts()
    })
    return unsubscribe
  }, [])

  const tabItems = [
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
    { key: 'all', label: `All (${counts.all})` },
  ]
  
  const onTabChange = (key) => {
    setActiveTab(key)
    setSelectedId(null)
  }

  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={16}>
            <Tabs items={tabItems} activeKey={activeTab} onChange={onTabChange} />
            <Table
                title={() => 'Provider Applications'}
                footer={() => (
                <Button onClick={reloadApplications} loading={isLoading}>
                    Refresh
                </Button>
                )}
                rowKey="id"
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                onRow={(row) => ({ onClick: () => { setSelectedId(row.id) } })}
            />
        </Col>
        <Col span={8}>
            <ReviewProviderApplicationForm providerId={selectedId} onReviewed={() => { setSelectedId(null); reloadApplications() }} />
        </Col>
    </Row>
  )
}