import { Button, Table } from 'antd'
import { useEffect } from 'react'
import { iconOptions, getIconComponent } from "@/shared/components/molecules/iconOptions.js"
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"
import { subscribeCategoryCreated, subscribeCategoryUpdated } from "@/features/admin/services/lib/categoriesEvents.js"

export default function CategoryTable({ onEdit }) {
  const { categories, isLoading, reloadCategories } = useCategoryTable()

  useEffect(() => {
    const unsubscribe = subscribeCategoryCreated(() => {
      reloadCategories()
    })
    const unsubscribeUpdated = subscribeCategoryUpdated(() => {
      reloadCategories()
    })
    return () => {
      try { unsubscribe() } catch (err) { void err }
      try { unsubscribeUpdated() } catch (err) { void err }
    }
  }, [reloadCategories])

  const columns = [{
    title: '',
    dataIndex: 'icon',
    key: 'icon',
    render: (val) => {
      const Icon = getIconComponent(val, iconOptions)
      return Icon ? <Icon /> : null
    },
    width: 60,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    render: (_, record) => (
      <Button type="link" onClick={() => typeof onEdit === 'function' ? onEdit(record.id) : null}>Edit</Button>
    ),
  },
  ]

  return (
    <Table
      title={() => 'Categories'}
      footer={() => <Button onClick={reloadCategories} loading={isLoading}>Refresh</Button> }
      rowKey="id"
      columns={columns}
      dataSource={categories}
      loading={isLoading}
      pagination={false}
    />
  )
}
