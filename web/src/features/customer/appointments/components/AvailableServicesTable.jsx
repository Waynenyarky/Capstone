import React, { useMemo, useState } from 'react'
import { Table, Button, Input, Flex, Card, Tabs, Tag } from 'antd'
import { useAvailableServices } from '@/features/customer/appointments/hooks/useAvailableServices.js'

export default function AvailableServicesTable({ onBook }) {
  const {
    services,
    categoryTabs,
    loading,
    search,
    activeCategory,
    locationContext,
    handleSearchSubmit,
    handleTabChange,
    filterByCurrentLocation,
    resetLocationFilter,
    reload,
  } = useAvailableServices()

  const [searchText, setSearchText] = useState(search)

  const columns = useMemo(() => ([
    { title: 'Service', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Provider', dataIndex: 'providerName', key: 'providerName' },
    { title: 'Category', dataIndex: 'categoryName', key: 'category' },
    {
      title: 'Pricing', key: 'pricing', render: (_, row) => {
        const mode = String(row.pricingMode || 'fixed')
        if (mode === 'hourly') return `Hourly ${row.hourlyRate ?? '—'}`
        if (mode === 'both') return `Fixed ${row.fixedPrice ?? '—'} / Hourly ${row.hourlyRate ?? '—'}`
        return `Fixed ${row.fixedPrice ?? '—'}`
      },
    },
    {
      title: 'Action', key: 'action', render: (_, row) => (
        <Button type="primary" onClick={() => typeof onBook === 'function' && onBook(row)}>
          Book
        </Button>
      ),
    },
  ]), [onBook])

  const tabsItems = useMemo(() => (
    (categoryTabs || []).map((name) => ({ key: name, label: name === 'all' ? 'All' : name }))
  ), [categoryTabs])

  return (
    <Card title="Available Services" extra={(
      <Flex gap="small" align="center">
        {locationContext.active ? (
          <Tag color="blue">
            Current location: {locationContext.city || '—'}{locationContext.province ? `, ${locationContext.province}` : ''}
          </Tag>
        ) : (
          <Tag>Current location: not set</Tag>
        )}
        <Button onClick={reload} loading={loading}>Refresh</Button>
      </Flex>
    )}>
      <Flex gap="small" style={{ marginBottom: 12 }}>
        <Input
          placeholder="Search services"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button onClick={() => handleSearchSubmit(searchText)} disabled={loading}>Search</Button>
        <Button onClick={filterByCurrentLocation} loading={loading} type="default">Use My Location</Button>
        {locationContext.active && (
          <Button onClick={resetLocationFilter} disabled={loading}>Clear Location Filter</Button>
        )}
      </Flex>
      <Tabs activeKey={activeCategory} onChange={handleTabChange} items={tabsItems} />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={services}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  )
}