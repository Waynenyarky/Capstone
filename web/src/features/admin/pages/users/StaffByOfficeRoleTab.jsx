import React, { useState, useMemo, useEffect } from 'react'
import { Table, Button, Tag, Typography, Input, Select, Tooltip, Splitter, Grid, Pagination, Empty, theme, Dropdown } from 'antd'
import { FilterOutlined, SearchOutlined, CloseOutlined, BankOutlined } from '@ant-design/icons'
import { roleLabel, officeLabel, getStaffStatus, getStaffStatusTag } from './useAdminUsersPage'

const { Text } = Typography

export default function StaffByOfficeRoleTab({
  staff,
  loading,
  officeGroupsState,
  roleOptionsState,
  onNavigateToStaff,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedOffice, setSelectedOffice] = useState(null)

  /* ── left panel: office list ── */
  const [officeSearch, setOfficeSearch] = useState('')
  const [officeCurrentPage, setOfficeCurrentPage] = useState(1)

  /* ── right panel: employees for selected office ── */
  const [empSearch, setEmpSearch] = useState('')
  const [empFilterOpen, setEmpFilterOpen] = useState(false)
  const [empStatusFilter, setEmpStatusFilter] = useState(null)
  const [empRoleFilter, setEmpRoleFilter] = useState(null)
  const [empCurrentPage, setEmpCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  /* ── office rows ── */
  const officeRows = useMemo(() => {
    const list = staff || []
    const byOffice = new Map()
    for (const s of list) {
      const office = s.office || '—'
      if (!byOffice.has(office)) byOffice.set(office, { office, employees: 0 })
      byOffice.get(office).employees += 1
    }
    return Array.from(byOffice.values()).sort((a, b) =>
      a.office === '—' ? 1 : b.office === '—' ? -1 : a.office.localeCompare(b.office)
    )
  }, [staff])

  const filteredOffices = useMemo(() => {
    let list = officeRows
    if (officeSearch.trim()) {
      const q = officeSearch.trim().toLowerCase()
      list = list.filter((r) => {
        const label = (officeLabel(r.office, officeGroupsState) || r.office || '').toLowerCase()
        return label.includes(q)
      })
    }
    return list
  }, [officeRows, officeSearch, officeGroupsState])

  const paginatedOffices = useMemo(() => {
    const start = (officeCurrentPage - 1) * PAGE_SIZE
    return filteredOffices.slice(start, start + PAGE_SIZE)
  }, [filteredOffices, officeCurrentPage])

  useEffect(() => {
    setOfficeCurrentPage(1)
  }, [officeSearch])

  /* ── employees for selected office ── */
  const employeesForOffice = useMemo(() => {
    if (!selectedOffice) return []
    return (staff || []).filter((s) => (s.office || '—') === selectedOffice)
  }, [staff, selectedOffice])

  const filteredEmployees = useMemo(() => {
    let list = employeesForOffice
    if (empSearch.trim()) {
      const q = empSearch.trim().toLowerCase()
      list = list.filter((rec) => {
        const name = [rec?.firstName, rec?.lastName].filter(Boolean).join(' ').toLowerCase()
        const email = (rec?.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }
    if (empStatusFilter) {
      list = list.filter((rec) => getStaffStatus(rec) === empStatusFilter)
    }
    if (empRoleFilter) {
      list = list.filter((rec) => rec?.role === empRoleFilter)
    }
    return list
  }, [employeesForOffice, empSearch, empStatusFilter, empRoleFilter])

  const paginatedEmployees = useMemo(() => {
    const start = (empCurrentPage - 1) * PAGE_SIZE
    return filteredEmployees.slice(start, start + PAGE_SIZE)
  }, [filteredEmployees, empCurrentPage])

  useEffect(() => {
    setEmpCurrentPage(1)
  }, [empSearch, empStatusFilter, empRoleFilter, selectedOffice])

  useEffect(() => {
    setEmpSearch('')
    setEmpStatusFilter(null)
    setEmpRoleFilter(null)
  }, [selectedOffice])

  const empActiveFilterCount = [empStatusFilter, empRoleFilter].filter(Boolean).length

  /* ── columns ── */
  const officeColumns = [
    { title: 'Office', dataIndex: 'office', key: 'office', render: (v) => officeLabel(v, officeGroupsState) || v },
    { title: 'Employees', dataIndex: 'employees', key: 'employees' },
  ]

  const employeeColumns = [
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

  /* ── left panel (offices table) — exact StaffAccountsTab layout ── */
  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by office"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={officeSearch}
            onChange={(e) => setOfficeSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="office"
            columns={officeColumns}
            dataSource={paginatedOffices}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => rec?.office === selectedOffice ? 'office-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelectedOffice(rec.office),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={officeCurrentPage}
            total={filteredOffices?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setOfficeCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.office-row-selected > td {
          background: #e6f4ff !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  /* ── right panel (employees for office) — exact StaffAccountsTab layout ── */
  const employeesPanel = !selectedOffice ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
      <Empty
        image={<BankOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        styles={{ image: { height: 60 } }}
        description={<Text type="secondary">Select an office to view employees</Text>}
      />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorFillTertiary,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <BankOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {officeLabel(selectedOffice, officeGroupsState) || selectedOffice || '—'}
          </Typography.Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {employeesForOffice.length} employee{employeesForOffice.length !== 1 ? 's' : ''}
          </Text>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by name or email"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Dropdown
            open={empFilterOpen}
            onOpenChange={setEmpFilterOpen}
            trigger={['click']}
            placement="bottomRight"
            popupRender={() => (
              <div
                style={{
                  padding: '16px 20px',
                  background: token.colorBgElevated,
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: token.boxShadowSecondary,
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
                    onClick={() => setEmpFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                  <Select
                    placeholder="All statuses"
                    allowClear
                    value={empStatusFilter}
                    onChange={setEmpStatusFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'disabled', label: 'Disabled' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Role</Text>
                  <Select
                    placeholder="All roles"
                    allowClear
                    value={empRoleFilter}
                    onChange={setEmpRoleFilter}
                    style={{ width: '100%' }}
                    options={roleOptionsState}
                  />
                </div>
                {empActiveFilterCount > 0 && (
                  <Button size="small" type="link" onClick={() => { setEmpStatusFilter(null); setEmpRoleFilter(null) }} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          >
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={empActiveFilterCount > 0 ? 'primary' : 'default'}
                ghost={empActiveFilterCount > 0}
                aria-label="Toggle filters"
              />
            </Tooltip>
          </Dropdown>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="id"
            columns={employeeColumns}
            dataSource={paginatedEmployees}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={(rec) => ({
              onClick: () => onNavigateToStaff?.(rec?.id),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'No employees in this office' }}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={empCurrentPage}
            total={filteredEmployees?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setEmpCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
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
        {employeesPanel}
      </Splitter.Panel>
    </Splitter>
  )
}
