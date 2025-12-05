import { Table, Button } from 'antd'
import { useEffect } from 'react'
import { useServiceTable } from "@/features/admin/services/hooks/useServiceTable.js"
import { subscribeServiceCreated, subscribeServiceUpdated } from "@/features/admin/services/lib/servicesEvents.js"
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"
import { getServiceStatusLabel } from "@/features/admin/services/constants/serviceStatus.js"

export default function ServiceTable({ onEdit }) {
  const { services, isLoading, reloadServices } = useServiceTable()
  const { categories } = useCategoryTable()

  useEffect(() => {
    const unsubscribe = subscribeServiceCreated(() => {
      reloadServices()
    })
    return unsubscribe
  }, [reloadServices])

  useEffect(() => {
    const unsubscribe = subscribeServiceUpdated(() => {
      reloadServices()
    })
    return unsubscribe
  }, [reloadServices])

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val) => getServiceStatusLabel(val),
    },
    {
      title: 'Price Range',
      dataIndex: 'priceRange',
      key: 'priceRange',
      render: (_, row) => {
        const min = row.priceMin
        const max = row.priceMax
        if (typeof min === 'number' && typeof max === 'number') {
          return `₱${min} — ₱${max}`
        }
        if (typeof min === 'number') return `from ₱${min}`
        if (typeof max === 'number') return `up to ₱${max}`
        return '—'
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button onClick={() => onEdit && onEdit(row.id)}>Edit</Button>
      ),
      width: 120,
    },
  ]

  const categoryLabelById = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const rows = services.map((s) => ({ ...s, category: categoryLabelById[s.categoryId] || '—' }))

  return (
    <Table
      title={() => 'Services'}
      footer={() => <Button onClick={reloadServices} loading={isLoading}>Refresh</Button> }
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      pagination={false}
    />
  )
}
