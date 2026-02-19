import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Typography, Input, Select, Tooltip, Splitter, Grid, Pagination, Modal, Form, Space, Alert, theme } from 'antd'
import { FilterOutlined, SearchOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import AdminDetailPanel from './AdminDetailPanel'
import { getAdminList, requestAdminChange } from '../../services/staffService'
import { useNotifier } from '@/shared/notifications'
import { useAdminStepUp } from '../../hooks/useAdminStepUp'

const { Text } = Typography

function getAdminStatus(rec) {
  if (!rec) return null
  if (rec.isActive === false) return 'disabled'
  if (rec.mustChangeCredentials || rec.mustSetupMfa) return 'pending'
  return 'active'
}

function getAdminStatusTag(rec) {
  const status = getAdminStatus(rec)
  if (status === 'active') return { label: 'Active', color: 'green' }
  if (status === 'pending') return { label: 'Pending', color: 'orange' }
  if (status === 'disabled') return { label: 'Disabled', color: 'red' }
  return { label: '—', color: 'default' }
}

export default function AdminAccountsTab({ currentUserId }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { success, error: notifyError } = useNotifier()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const filterWrapperRef = useRef(null)

  // Modal states
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm] = Form.useForm()
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetForm] = Form.useForm()
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [disableOpen, setDisableOpen] = useState(false)
  const [disableTarget, setDisableTarget] = useState(null)
  const [disableForm] = Form.useForm()
  const [disableSubmitting, setDisableSubmitting] = useState(false)

  const PAGE_SIZE = 20

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true)
      const list = await getAdminList()
      setAdmins(list)
    } catch (e) {
      console.error('Load admins error:', e)
      setAdmins([])
      const msg = e?.message?.includes('404') || e?.message?.includes('502')
        ? 'Backend services may not be running. Start with ./start.sh --dev or docker-compose up -d'
        : 'Failed to load admin accounts'
      notifyError(e, msg)
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  useEffect(() => {
    if (selectedAdmin && admins?.length) {
      const updated = admins.find((a) => a.id === selectedAdmin.id)
      if (updated) setSelectedAdmin(updated)
      else setSelectedAdmin(null)
    }
  }, [admins])

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

  const activeFilterCount = [statusFilter].filter(Boolean).length

  const filteredAdmins = useMemo(() => {
    let list = admins || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const name = [rec?.firstName, rec?.lastName].filter(Boolean).join(' ').toLowerCase()
        const email = (rec?.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }
    if (statusFilter) {
      list = list.filter((rec) => getAdminStatus(rec) === statusFilter)
    }
    return list
  }, [admins, search, statusFilter])

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return (filteredAdmins || []).slice(start, start + PAGE_SIZE)
  }, [filteredAdmins, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const clearFilters = () => {
    setStatusFilter(null)
  }

  // ─── Action handlers (all go through approval) ───

  const openEditModal = useCallback((record) => {
    setEditTarget(record)
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber || '',
      reason: '',
    })
    setEditOpen(true)
  }, [editForm])

  const handleEditSubmit = useCallback(async () => {
    try {
      const values = await editForm.validateFields()
      if (!editTarget?.id) return
      setEditSubmitting(true)

      const changes = {}
      if (values.firstName !== editTarget.firstName) changes.firstName = values.firstName
      if (values.lastName !== editTarget.lastName) changes.lastName = values.lastName
      if (values.email !== editTarget.email) changes.email = values.email
      if ((values.phoneNumber || '') !== (editTarget.phoneNumber || '')) changes.phoneNumber = values.phoneNumber

      if (Object.keys(changes).length === 0) {
        notifyError(null, 'No changes detected')
        setEditSubmitting(false)
        return
      }

      await runWithStepUp(async (stepUpToken) => {
        await requestAdminChange(editTarget.id, {
          requestType: 'personal_info_change',
          changes,
          reason: values.reason,
        }, { stepUpToken })
      })

      success('Approval request submitted. The change requires confirmation from other admins before it takes effect.')
      setEditOpen(false)
      setEditTarget(null)
      await loadAdmins()
    } catch (e) {
      if (e?.message === 'Step-up cancelled' || e?.errorFields) return
      notifyError(e, 'Failed to submit change request')
    } finally {
      setEditSubmitting(false)
    }
  }, [editForm, editTarget, loadAdmins, success, notifyError, runWithStepUp])

  const openResetModal = useCallback((record) => {
    setResetTarget(record)
    resetForm.setFieldsValue({ reason: '' })
    setResetOpen(true)
  }, [resetForm])

  const handleResetSubmit = useCallback(async () => {
    try {
      const values = await resetForm.validateFields()
      if (!resetTarget?.id) return
      setResetSubmitting(true)

      await runWithStepUp(async (stepUpToken) => {
        await requestAdminChange(resetTarget.id, {
          requestType: 'password_reset',
          changes: { passwordReset: true },
          reason: values.reason,
        }, { stepUpToken })
      })

      success('Password reset request submitted. Requires confirmation from other admins.')
      setResetOpen(false)
      setResetTarget(null)
      await loadAdmins()
    } catch (e) {
      if (e?.message === 'Step-up cancelled' || e?.errorFields) return
      notifyError(e, 'Failed to submit reset request')
    } finally {
      setResetSubmitting(false)
    }
  }, [resetForm, resetTarget, loadAdmins, success, notifyError, runWithStepUp])

  const openDisableModal = useCallback((record) => {
    setDisableTarget(record)
    disableForm.setFieldsValue({ reason: '' })
    setDisableOpen(true)
  }, [disableForm])

  const handleDisableSubmit = useCallback(async () => {
    try {
      const values = await disableForm.validateFields()
      if (!disableTarget?.id) return
      setDisableSubmitting(true)

      await runWithStepUp(async (stepUpToken) => {
        await requestAdminChange(disableTarget.id, {
          requestType: 'account_status_change',
          changes: { isActive: false },
          reason: values.reason,
        }, { stepUpToken })
      })

      success('Disable request submitted. Requires confirmation from other admins.')
      setDisableOpen(false)
      setDisableTarget(null)
      await loadAdmins()
    } catch (e) {
      if (e?.message === 'Step-up cancelled' || e?.errorFields) return
      notifyError(e, 'Failed to submit disable request')
    } finally {
      setDisableSubmitting(false)
    }
  }, [disableForm, disableTarget, loadAdmins, success, notifyError, runWithStepUp])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = () => {
      const first = admins?.[0] || {
        id: 'dev-mock-admin',
        firstName: 'Dev',
        lastName: 'Admin',
        email: 'dev.admin@example.com',
      }
      openEditModal(first)
    }
    window.addEventListener('devtools:usermgmt-open-admin-edit', handler)
    return () => window.removeEventListener('devtools:usermgmt-open-admin-edit', handler)
  }, [admins, openEditModal])

  const columns = [
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => {
        const tag = getAdminStatusTag(rec)
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, rec) => {
        const name = [rec?.firstName, rec?.lastName].filter(Boolean).join(' ')
        const isSelfRow = currentUserId && String(rec?.id) === String(currentUserId)
        return (
          <span>
            {name}
            {isSelfRow && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>You</Tag>}
          </span>
        )
      },
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
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
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={paginatedAdmins}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => rec?.id === selectedAdmin?.id ? 'admin-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelectedAdmin(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredAdmins?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.admin-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const modals = (
    <>
      {/* Edit Admin Modal */}
      <Modal
        title="Request Admin Profile Edit"
        open={editOpen}
        onCancel={() => !editSubmitting && setEditOpen(false)}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditOpen(false)} disabled={editSubmitting}>Cancel</Button>
            <Button type="primary" onClick={handleEditSubmit} loading={editSubmitting}>
              Submit for Approval
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="This change requires approval from other administrators before it takes effect."
          style={{ marginBottom: 16 }}
        />
        <Form form={editForm} layout="vertical">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Enter email' }, { type: 'email', message: 'Enter a valid email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="+63 912 345 6789" />
          </Form.Item>
          <Form.Item name="reason" label="Reason for Change" rules={[{ required: true, message: 'Provide a reason (min 5 characters)' }, { min: 5, message: 'Reason must be at least 5 characters' }]}>
            <Input.TextArea rows={2} placeholder="Explain why this change is needed..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Request Admin Password Reset"
        open={resetOpen}
        onCancel={() => !resetSubmitting && setResetOpen(false)}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setResetOpen(false)} disabled={resetSubmitting}>Cancel</Button>
            <Button type="primary" onClick={handleResetSubmit} loading={resetSubmitting}>
              Submit for Approval
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Password reset requires approval from other administrators. Once approved, a temporary password will be generated and the admin will need to change it on next login."
          style={{ marginBottom: 16 }}
        />
        {resetTarget && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Admin: </Text>
            <Text strong>{[resetTarget.firstName, resetTarget.lastName].filter(Boolean).join(' ')}</Text>
            <Text type="secondary"> ({resetTarget.email})</Text>
          </div>
        )}
        <Form form={resetForm} layout="vertical">
          <Form.Item name="reason" label="Reason for Reset" rules={[{ required: true, message: 'Provide a reason (min 5 characters)' }, { min: 5, message: 'Reason must be at least 5 characters' }]}>
            <Input.TextArea rows={2} placeholder="Explain why this reset is needed..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Disable Account Modal */}
      <Modal
        title="Request Admin Account Disable"
        open={disableOpen}
        onCancel={() => !disableSubmitting && setDisableOpen(false)}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDisableOpen(false)} disabled={disableSubmitting}>Cancel</Button>
            <Button type="primary" danger onClick={handleDisableSubmit} loading={disableSubmitting}>
              Submit for Approval
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Disabling an admin account requires approval from other administrators. Once approved, the admin will lose all access immediately."
          style={{ marginBottom: 16 }}
        />
        {disableTarget && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Admin: </Text>
            <Text strong>{[disableTarget.firstName, disableTarget.lastName].filter(Boolean).join(' ')}</Text>
            <Text type="secondary"> ({disableTarget.email})</Text>
          </div>
        )}
        <Form form={disableForm} layout="vertical">
          <Form.Item name="reason" label="Reason for Disabling" rules={[{ required: true, message: 'Provide a reason (min 5 characters)' }, { min: 5, message: 'Reason must be at least 5 characters' }]}>
            <Input.TextArea rows={2} placeholder="Explain why this account should be disabled..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )

  if (isMobile) {
    return (
      <>
        {tableContent}
        {modals}
        {stepUpModal}
      </>
    )
  }

  return (
    <>
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
          {tableContent}
        </Splitter.Panel>
        <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AdminDetailPanel
            admin={selectedAdmin}
            currentUserId={currentUserId}
            onRequestEdit={openEditModal}
            onRequestResetPassword={openResetModal}
            onRequestDisable={openDisableModal}
          />
        </Splitter.Panel>
      </Splitter>
      {modals}
      {stepUpModal}
    </>
  )
}
