import React from 'react'
import { useProvidersTable } from "@/features/admin/providers/hooks/useProvidersTable.js"
import { Table, Button, Tabs } from 'antd'
import { fetchWithFallback } from "@/lib/http.js"
import { subscribeProviderStatusChanged } from "@/features/admin/providers/lib/providersEvents.js"
import { getProviderStatusLabel } from "@/features/admin/providers/constants/providerStatus.js"

export default function ProvidersTable({ onReview = null }) {
  const [activeTab, setActiveTab] = React.useState('active')
  const { providers, isLoading, reloadProviders } = useProvidersTable(activeTab === 'all' ? '' : activeTab)
  const [counts, setCounts] = React.useState({ active: 0, inactive: 0, appeals: 0, all: 0 })

  const reloadCounts = React.useCallback(async () => {
    const res = await fetchWithFallback('/api/providers/summary')
    if (!res || !res.ok) return
    const data = await res.json()
    setCounts({
      active: Number(data.activeCount || 0),
      inactive: Number(data.inactiveCount || 0),
      appeals: Number(data.appealsPendingCount || 0),
      all: Number(data.allCount || 0),
    })
  }, [])

  React.useEffect(() => {
    reloadCounts()
  }, [reloadCounts])

  React.useEffect(() => {
    const unsubscribe = subscribeProviderStatusChanged(() => {
      reloadCounts()
    })
    return unsubscribe
  }, [reloadCounts])

  // Data hook now subscribes to provider status changes and auto-reloads

  const getColumns = () => {
    if (activeTab === 'appeals') {
      return [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (val) => getProviderStatusLabel(val) },
        { title: 'Pending Appeals', dataIndex: 'pendingAppealsCount', key: 'pendingAppealsCount' },
        { title: 'Last Appeal Submitted', dataIndex: 'lastAppealSubmittedAt', key: 'lastAppealSubmittedAt', render: (val) => (val ? new Date(val).toLocaleString() : '-') },
        {
          title: 'Actions',
          key: 'actions',
          render: (_, record) => (
            <Button onClick={() => { if (typeof onReview === 'function') onReview(record.id) }}>Review Status</Button>
          ),
        },
      ]
    }
    return [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (val) => getProviderStatusLabel(val) },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Button onClick={() => { if (typeof onReview === 'function') onReview(record.id) }}>Review Status</Button>
        ),
      },
    ]
  }

  const rows = providers

  const tabItems = [
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'inactive', label: `Inactive (${counts.inactive})` },
    { key: 'appeals', label: `Appeals (${counts.appeals})` },
    { key: 'all', label: `All (${counts.all})` },
  ]

  return (
    <div>
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      <Table
        title={() => (activeTab === 'appeals' ? 'Providers with Pending Appeals' : 'Providers')}
        footer={() => <Button onClick={reloadProviders} loading={isLoading}>Refresh</Button> }
        rowKey="id"
        columns={getColumns()}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
      />
    </div>
  )
}