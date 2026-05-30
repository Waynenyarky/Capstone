import { useState, useMemo, useRef, useEffect } from 'react'
import { Modal, Table, Input, Select, Button, Tag, Typography, theme } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import { getStaffStatus, getStaffStatusTag } from './useAdminUsersPage'

const { Text } = Typography

export default function OfficeEmployeesModal({
  open,
  onClose,
  office,
  officeLabel,
  roleLabel,
  employees = [],
  officeGroupsState,
  roleOptionsState,
  onSelectStaff,
}) {
  const { token } = theme.useToken()
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [roleFilter, setRoleFilter] = useState(null)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        if (!e.target.closest('.ant-select-dropdown')) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const filteredEmployees = useMemo(() => {
    let list = employees || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const name = [rec?.firstName, rec?.lastName].filter(Boolean).join(' ').toLowerCase()
        const email = (rec?.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }
    if (statusFilter) {
      list = list.filter((rec) => getStaffStatus(rec) === statusFilter)
    }
    if (roleFilter) {
      list = list.filter((rec) => rec?.role === roleFilter)
    }
    return list
  }, [employees, search, statusFilter, roleFilter])

  const activeFilterCount = [statusFilter, roleFilter].filter(Boolean).length

  const columns = [
    {
      title: 'Status',
      key: 'status',
      width: 90,
      render: (_, rec) => {
        const tag = getStaffStatusTag(rec)
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' ') || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (r) => roleLabel(r, roleOptionsState),
    },
  ]

  const handleRowClick = (rec) => {
    onSelectStaff?.(rec)
    onClose()
  }

  const officeDisplay = officeLabel ? officeLabel(office, officeGroupsState) : office

  return (
    <Modal
      title={`Employees — ${officeDisplay || office || '—'}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Search by name or email"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <div style={{ position: 'relative' }} ref={filterRef}>
            <Button
              icon={<FilterOutlined />}
              type={activeFilterCount > 0 ? 'primary' : 'default'}
              ghost={activeFilterCount > 0}
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-label="Toggle filters"
            />
            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: 16,
                  background: '#fff',
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  zIndex: 50,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Filters</Text>
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setFilterOpen(false)} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Status
                  </Text>
                  <Select
                    placeholder="All statuses"
                    allowClear
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'disabled', label: 'Disabled' },
                    ]}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Role
                  </Text>
                  <Select
                    placeholder="All roles"
                    allowClear
                    value={roleFilter}
                    onChange={setRoleFilter}
                    style={{ width: '100%' }}
                    options={roleOptionsState}
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={() => { setStatusFilter(null); setRoleFilter(null) }} style={{ padding: 0 }}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          <Table
            size="small"
            dataSource={filteredEmployees}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} employee${total !== 1 ? 's' : ''}`,
            }}
            onRow={(rec) => ({
              onClick: () => handleRowClick(rec),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'No employees in this office' }}
          />
        </div>
        
      </div>
    </Modal>
  )
}
