import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Table, Pagination, Input, Button, Select, Tooltip, Typography, Tag, Splitter, Grid, theme } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import { useUsersTable } from "@/features/admin/users/hooks/useUsersTable.js"
import UserDetailPanel from './UserDetailPanel.jsx'

const PAGE_SIZE = 20

const STAFF_ROLES = ['lgu_officer', 'lgu_manager', 'inspector', 'cso']
const ADMIN_ROLE = 'admin'

const ROLE_OPTIONS = [
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'user', label: 'User' },
]

const { Text } = Typography

export default function UsersTable() {
  const { token } = theme.useToken()
  const { users, isLoading } = useUsersTable()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState(null)
  const filterWrapperRef = useRef(null)

  useEffect(() => {
    if (selectedUser && users?.length) {
      const updated = users.find((u) => u.id === selectedUser.id)
      if (updated) setSelectedUser(updated)
      else setSelectedUser(null)
    }
  }, [users])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = () => {
      const list = (users || []).filter((rec) => !STAFF_ROLES.includes(rec?.role) && rec?.role !== ADMIN_ROLE)
      const first = list[0] || {
        id: 'dev-mock-owner',
        firstName: 'Dev',
        lastName: 'Owner',
        email: 'dev.owner@example.com',
        role: 'business_owner',
      }
      setSelectedUser(first)
    }
    window.addEventListener('devtools:usermgmt-open-user-detail', handler)
    return () => window.removeEventListener('devtools:usermgmt-open-user-detail', handler)
  }, [users])

  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(e.target)) {
        if (!e.target.closest('.ant-select-dropdown')) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const filteredUsers = useMemo(() => {
    let list = (users || []).filter((rec) => !STAFF_ROLES.includes(rec?.role) && rec?.role !== ADMIN_ROLE)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const name = [rec?.firstName, rec?.lastName].filter(Boolean).join(' ').toLowerCase()
        const email = (rec?.email || '').toLowerCase()
        const role = (rec?.role || '').toLowerCase()
        const phone = (rec?.phoneNumber || '').toLowerCase()
        return name.includes(q) || email.includes(q) || role.includes(q) || phone.includes(q)
      })
    }
    if (roleFilter) {
      list = list.filter((rec) => rec?.role === roleFilter)
    }
    return list
  }, [users, search, roleFilter])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const clearFilters = () => setRoleFilter(null)

  const roleLabel = (role) => {
    const key = String(role || '').toLowerCase()
    const map = {
      admin: 'Admin',
      business_owner: 'Business Owner',
      user: 'User',
      lgu_officer: 'LGU Officer',
      lgu_manager: 'LGU Manager',
      inspector: 'LGU Inspector',
      cso: 'CSO',
    }
    if (map[key]) return map[key]

    const words = key.split(/[_\s]+/).filter(Boolean)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const columns = [
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => (rec?.isActive !== false ? <Tag color="green">Active</Tag> : <Tag color="orange">Pending</Tag>),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' '),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span>{roleLabel(role)}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => (val ? new Date(val).toLocaleString() : ''),
    },
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 0 }}>
        <Input
          placeholder="Search by name, email, role, or phone"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <div style={{ position: 'relative' }} ref={filterWrapperRef}>
          <Tooltip title="Filter by role">
            <Button
              icon={<FilterOutlined />}
              type={roleFilter ? 'primary' : 'default'}
              ghost={!!roleFilter}
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-label="Toggle role filter"
            />
          </Tooltip>
          {filterOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                padding: '16px 20px',
                background: '#fff',
                borderRadius: 10,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                zIndex: 50,
                minWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 13 }}>Role</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />}
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                />
              </div>
              <Select
                placeholder="All roles"
                allowClear
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: '100%' }}
                options={ROLE_OPTIONS}
              />
              {roleFilter && (
                <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                  Clear filter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={paginatedUsers}
            loading={isLoading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => rec?.id === selectedUser?.id ? 'user-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelectedUser(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredUsers.length}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.user-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  if (isMobile) return tableContent

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {tableContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <UserDetailPanel user={selectedUser} />
      </Splitter.Panel>
    </Splitter>
  )
}
