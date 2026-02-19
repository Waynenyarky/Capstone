import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Table, Button, Tag, Typography, Input, Select, Tooltip, Splitter, Grid, Pagination, theme } from 'antd'
import { PlusOutlined, FilterOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons'
import { roleLabel, officeLabel, getStaffStatus, getStaffStatusTag } from './useAdminUsersPage'
import StaffDetailPanel from './StaffDetailPanel'

const { Text } = Typography

export default function StaffAccountsTab({
  staff,
  loading,
  officeGroupsState,
  roleOptionsState,
  onEdit,
  onResetPassword,
  onDisableAccount,
  onActivateAccount,
  activateLoading,
  onAddEmployee,
  selectedStaffId,
  clearSelectedStaffId,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedStaff, setSelectedStaff] = useState(null)

  useEffect(() => {
    if (selectedStaff && staff?.length) {
      const updated = staff.find((s) => s.id === selectedStaff.id)
      if (updated) setSelectedStaff(updated)
      else setSelectedStaff(null)
    }
  }, [staff])

  useEffect(() => {
    if (selectedStaffId && staff?.length) {
      const s = staff.find((x) => x.id === selectedStaffId)
      if (s) setSelectedStaff(s)
      clearSelectedStaffId?.()
    }
  }, [selectedStaffId, staff, clearSelectedStaffId])
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [officeFilter, setOfficeFilter] = useState(null)
  const [roleFilter, setRoleFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const filterWrapperRef = useRef(null)

  const PAGE_SIZE = 20

  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(e.target)) {
        const isSelectDropdown = e.target.closest('.ant-select-dropdown')
        if (!isSelectDropdown) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const officeOptions = useMemo(
    () =>
      (officeGroupsState || []).flatMap((group) =>
        (group.options || []).map((opt) => ({ value: opt.value, label: opt.label }))
      ),
    [officeGroupsState]
  )

  const activeFilterCount = [statusFilter, officeFilter, roleFilter].filter(Boolean).length

  const filteredStaff = useMemo(() => {
    let list = staff || []
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
    if (officeFilter) {
      list = list.filter((rec) => rec?.office === officeFilter)
    }
    if (roleFilter) {
      list = list.filter((rec) => rec?.role === roleFilter)
    }
    return list
  }, [staff, search, statusFilter, officeFilter, roleFilter])

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return (filteredStaff || []).slice(start, start + PAGE_SIZE)
  }, [filteredStaff, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, officeFilter, roleFilter])

  const clearFilters = () => {
    setStatusFilter(null)
    setOfficeFilter(null)
    setRoleFilter(null)
  }

  const columns = [
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => {
        const tag = getStaffStatusTag(rec)
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    { title: 'Name', key: 'name', render: (_, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' ') },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r) => roleLabel(r, roleOptionsState) },
    { title: 'Office', dataIndex: 'office', key: 'office', render: (v) => officeLabel(v, officeGroupsState) },
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by name or email"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={filterWrapperRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen((prev) => !prev)}
                aria-label="Toggle filters"
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
                  minWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Filters</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Office</Text>
                  <Select
                    placeholder="All offices"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={officeFilter}
                    onChange={setOfficeFilter}
                    style={{ width: '100%' }}
                    options={officeOptions}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Role</Text>
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
                  <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {onAddEmployee && (
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={onAddEmployee}>Add Employee</Button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={paginatedStaff}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => rec?.id === selectedStaff?.id ? 'staff-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelectedStaff(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredStaff?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.staff-row-selected > td {
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
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', }}>
        <StaffDetailPanel
          staff={selectedStaff}
          officeGroupsState={officeGroupsState}
          roleOptionsState={roleOptionsState}
          onEdit={onEdit}
          onResetPassword={onResetPassword}
          onDisableAccount={onDisableAccount}
          onActivateAccount={onActivateAccount}
          activateLoading={activateLoading}
        />
      </Splitter.Panel>
    </Splitter>
  )
}
