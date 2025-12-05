import React from 'react'
import { Card, Table, Tag, Button, Flex } from 'antd'
import { useAddSupportedAreas } from "@/features/admin/areas/hooks/useAddSupportedAreas.js"
import { subscribeSupportedAreasUpdated } from "@/features/admin/areas/lib/supportedAreasEvents.js"

export default function SupportedAreasTable({ onSelectProvince }) {
  const { areasByProvince, isLoading, reloadAreas } = useAddSupportedAreas()

  const dataSource = Array.isArray(areasByProvince)
    ? areasByProvince.map((grp, idx) => ({
        key: grp?.province || `row-${idx}`,
        province: grp?.province || '',
        cities: Array.isArray(grp?.cities) ? grp.cities : [],
        active: grp?.active !== false,
      }))
    : []

  const columns = [
    {
      title: 'Province',
      dataIndex: 'province',
      key: 'province',
      sorter: (a, b) => String(a.province).localeCompare(String(b.province)),
    },
    {
      title: 'Cities',
      dataIndex: 'cities',
      key: 'cities',
      render: (cities) => (
        <Flex gap="small" wrap="wrap">
          {(Array.isArray(cities) ? cities : []).map((name) => (
            <Tag key={`city-${name}`}>{String(name)}</Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (val) => (val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, row) => row.active === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Flex gap="small">
          <Button onClick={() => onSelectProvince && onSelectProvince(row.province)}>Edit</Button>
        </Flex>
      ),
    },
  ]

  React.useEffect(() => {
    const unsubscribe = subscribeSupportedAreasUpdated(() => {
      reloadAreas()
    })
    return unsubscribe
  }, [reloadAreas])


  return (
    <Card
      title="Supported Areas"
      extra={<Button onClick={reloadAreas} loading={isLoading}>Reload</Button>}
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        loading={isLoading}
        pagination={false}
        size="small"
        onRow={(row) => ({ onClick: () => { onSelectProvince && onSelectProvince(row.province) } })}
      />
    </Card>
  )
}