import React, { useMemo, useState } from 'react'
import { Layout, Row, Col, Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Switch, Popconfirm, Tooltip } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { UsersTable } from '@/features/admin/users'
import { useStaffManagement, roleLabel, officeLabel } from '../../hooks'
import { RecoveryRequestsTable, SecurityEventsTable, AdminAuditActivity } from '../components'
import { updateStaff, resetStaffPassword } from '../../services'
import { useNotifier } from '@/shared/notifications'

const { Text, Title } = Typography

export default function AdminUsers() {
  const {
    staff,
    loadingStaff,
    loadStaff,
    tabKey,
    setTabKey,
    createOpen,
    openCreateModal,
    closeCreateModal,
    form,
    handleCreateSubmit,
    confirmOpen,
    closeConfirmModal,
    confirming,
    handleConfirmCreate,
    pendingValues,
    successOpen,
    successData,
    closeSuccessModal,
    offices,
    roles,
    loadingOffices,
    loadingRoles,
    officeGroupsState,
    roleOptionsState,
    addOffice,
    updateOffice,
    removeOffice,
    addRole,
    updateRole,
    removeRole,
  } = useStaffManagement()
  const { success, error } = useNotifier()

  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editLoading, setEditLoading] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetForm] = Form.useForm()
  const [resetLoading, setResetLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  const [officeForm] = Form.useForm()
  const [roleForm] = Form.useForm()
  const [officeEditKey, setOfficeEditKey] = useState(null)
  const [officeEdit, setOfficeEdit] = useState({
    id: '',
    code: '',
    name: '',
    group: '',
    originalCode: '',
    originalGroup: '',
  })
  const [roleEditId, setRoleEditId] = useState(null)
  const [roleEdit, setRoleEdit] = useState({ id: '', slug: '', name: '' })

  const openEditModal = (record) => {
    setEditTarget(record)
    editForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phoneNumber: record.phoneNumber || '',
      office: record.office || undefined,
      role: record.role || undefined,
      isActive: record.isActive !== false,
      reason: '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (!editTarget?.id) return
      setEditLoading(true)
      await updateStaff(editTarget.id, values)
      success('Staff updated')
      setEditOpen(false)
      setEditTarget(null)
      await loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      console.error('Update staff error:', e)
      error(e, 'Failed to update staff')
    } finally {
      setEditLoading(false)
    }
  }

  const openResetModal = (record) => {
    setResetTarget(record)
    resetForm.setFieldsValue({ reason: '' })
    setResetOpen(true)
  }

  const handleResetSubmit = async () => {
    try {
      const values = await resetForm.validateFields()
      if (!resetTarget?.id) return
      setResetLoading(true)
      await resetStaffPassword(resetTarget.id, values)
      success('Temporary password issued')
      setResetOpen(false)
      setResetTarget(null)
      await loadStaff()
    } catch (e) {
      if (e?.errorFields) return
      console.error('Reset staff password error:', e)
      error(e, 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const staffColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_v, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' '),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Office', dataIndex: 'office', key: 'office', render: (v) => officeLabel(v, officeGroupsState) },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r) => roleLabel(r, roleOptionsState) },
    {
      title: 'Status',
      key: 'status',
      render: (_v, rec) => {
        const active = rec?.isActive !== false
        return active ? <Tag color="green">Active</Tag> : <Tag color="orange">Pending</Tag>
      },
    },
    {
      title: 'Onboarding',
      key: 'onboarding',
      render: (_v, rec) => {
        const needs = (rec?.mustChangeCredentials || rec?.mustSetupMfa)
        return needs ? <Tag color="orange">Required</Tag> : <Tag color="blue">Complete</Tag>
      },
    },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => (v ? new Date(v).toLocaleString() : '') },
    {
      title: 'Actions',
      key: 'actions',
      render: (_v, rec) => (
        <Space size="small">
          <Button size="small" onClick={() => openEditModal(rec)}>Edit</Button>
          <Button size="small" onClick={() => openResetModal(rec)}>Reset Password</Button>
        </Space>
      ),
    },
  ]

  const officeRows = useMemo(
    () =>
      (offices || []).map((office) => ({
        ...office,
        key: office.id || office.code,
      })),
    [offices]
  )

  const roleRows = useMemo(
    () =>
      (roles || []).map((role) => ({
        ...role,
        key: role.id || role.slug,
      })),
    [roles]
  )

  const officeGroupOptions = useMemo(() => {
    const labels = new Set((officeGroupsState || []).map((group) => group.label))
    labels.add('Custom Offices')
    return Array.from(labels).map((label) => ({ value: label, label }))
  }, [officeGroupsState])

  const handleAddOffice = async () => {
    try {
      const values = await officeForm.validateFields()
      const code = values.code.trim().toUpperCase()
      const name = values.name.trim()
      const group = values.group
      const exists = officeRows.some((opt) => String(opt.code).toUpperCase() === code)
      if (exists) {
        error(new Error('Duplicate office'), 'Office code already exists')
        return
      }
      await addOffice({ code, name, group })
      officeForm.resetFields()
      success('Office added')
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Unable to add office')
    }
  }

  const handleAddRole = async () => {
    try {
      const values = await roleForm.validateFields()
      const slug = values.slug.trim().toLowerCase()
      const name = values.name.trim()
      const exists = roleRows.some((opt) => String(opt.slug).toLowerCase() === slug)
      if (exists) {
        error(new Error('Duplicate role'), 'Role code already exists')
        return
      }
      await addRole({ slug, name, displayName: name })
      roleForm.resetFields()
      success('Role added')
    } catch (e) {
      if (e?.errorFields) return
      error(e, 'Unable to add role')
    }
  }

  const startOfficeEdit = (record) => {
    setOfficeEditKey(record.key)
    setOfficeEdit({
      id: record.id,
      code: record.code,
      name: record.name,
      group: record.group,
      originalCode: record.code,
      originalGroup: record.group,
    })
  }

  const cancelOfficeEdit = () => {
    setOfficeEditKey(null)
    setOfficeEdit({
      id: '',
      code: '',
      name: '',
      group: '',
      originalCode: '',
      originalGroup: '',
    })
  }

  const saveOfficeEdit = async () => {
    if (!officeEdit?.code || !officeEdit?.name) {
      error(new Error('Invalid office'), 'Office code and name are required')
      return
    }
    const code = officeEdit.code.trim().toUpperCase()
    const name = officeEdit.name.trim()
    const originalCode = officeEdit.originalCode
    const originalGroup = officeEdit.originalGroup
    const exists = officeRows.some(
      (opt) =>
        String(opt.code).toUpperCase() === code &&
        !(opt.group === originalGroup && opt.code === originalCode)
    )
    if (exists) {
      error(new Error('Duplicate office'), 'Office code already exists')
      return
    }
    try {
      await updateOffice(officeEdit.id, { code, name, group: officeEdit.group })
      cancelOfficeEdit()
      success('Office updated')
    } catch (e) {
      error(e, 'Unable to update office')
    }
  }

  const startRoleEdit = (record) => {
    setRoleEditId(record.id)
    setRoleEdit({ id: record.id, slug: record.slug, name: record.displayName || record.name })
  }

  const cancelRoleEdit = () => {
    setRoleEditId(null)
    setRoleEdit({ id: '', slug: '', name: '' })
  }

  const saveRoleEdit = async () => {
    if (!roleEdit?.slug || !roleEdit?.name) {
      error(new Error('Invalid role'), 'Role code and name are required')
      return
    }
    const slug = roleEdit.slug.trim().toLowerCase()
    const name = roleEdit.name.trim()
    const exists = roleRows.some(
      (opt) => String(opt.slug).toLowerCase() === slug && opt.id !== roleEditId
    )
    if (exists) {
      error(new Error('Duplicate role'), 'Role code already exists')
      return
    }
    try {
      await updateRole(roleEditId, { slug, name, displayName: name })
      cancelRoleEdit()
      success('Role updated')
    } catch (e) {
      error(e, 'Unable to update role')
    }
  }

  const handleDeleteOffice = async (record) => {
    try {
      await removeOffice(record.id)
      success('Office removed')
    } catch (e) {
      error(e, 'Unable to remove office')
    }
  }

  const handleDeleteRole = async (record) => {
    try {
      await removeRole(record.id)
      success('Role removed')
    } catch (e) {
      error(e, 'Unable to remove role')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="User Management"
              extra={
                <Space>
                  <Button onClick={loadStaff} loading={loadingStaff}>Refresh Staff</Button>
                  <Button type="primary" onClick={openCreateModal}>Add New Staff</Button>
                </Space>
              }
            >
              <Tabs
                activeKey={tabKey}
                onChange={setTabKey}
                items={[
                  {
                    key: 'staff',
                    label: 'Staff Accounts',
                    children: (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <Text type="secondary">The selected role and office determine what actions this staff member can perform.</Text>
                        </div>
                        <Table
                          rowKey="id"
                          columns={staffColumns}
                          dataSource={staff}
                          loading={loadingStaff}
                          pagination={false}
                        />
                      </>
                    ),
                  },
                  {
                    key: 'office-role',
                    label: 'Office & Role Management',
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col span={24} md={12}>
                          <Card
                            size="small"
                            title="Offices"
                            extra={<Text type="secondary">Add or update office entries</Text>}
                          >
                            <Form form={officeForm} layout="vertical" onFinish={handleAddOffice}>
                              <Row gutter={[8, 8]}>
                                <Col span={24}>
                                  <Form.Item name="name" label="Office name" rules={[{ required: true, message: 'Enter office name' }]}>
                                    <Input placeholder="City Treasurer Office" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item name="code" label="Office code" rules={[{ required: true, message: 'Enter office code' }]}>
                                    <Input placeholder="CTO" />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item name="group" label="Group" initialValue="Custom Offices" rules={[{ required: true, message: 'Select group' }]}>
                                    <Select options={officeGroupOptions} />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Button icon={<PlusOutlined />} type="primary" htmlType="submit" block>
                                    Add Office
                                  </Button>
                                </Col>
                              </Row>
                            </Form>

                            <Table
                              size="small"
                              rowKey="key"
                              dataSource={officeRows}
                              pagination={false}
                              loading={loadingOffices}
                              style={{ marginTop: 12 }}
                              columns={[
                                {
                                  title: 'Office',
                                  dataIndex: 'name',
                                  render: (_value, record) =>
                                    officeEditKey === record.key ? (
                                      <Input
                                        value={officeEdit.name}
                                        onChange={(e) => setOfficeEdit((prev) => ({ ...prev, name: e.target.value }))}
                                      />
                                    ) : (
                                      record.name
                                    ),
                                },
                                {
                                  title: 'Code',
                                  dataIndex: 'code',
                                  width: 110,
                                  render: (_value, record) =>
                                    officeEditKey === record.key ? (
                                      <Input
                                        value={officeEdit.code}
                                        onChange={(e) => setOfficeEdit((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                      />
                                    ) : (
                                      <Text code>{record.code}</Text>
                                    ),
                                },
                                {
                                  title: 'Group',
                                  dataIndex: 'group',
                                  width: 160,
                                  render: (_value, record) =>
                                    officeEditKey === record.key ? (
                                      <Select
                                        value={officeEdit.group}
                                        onChange={(val) => setOfficeEdit((prev) => ({ ...prev, group: val }))}
                                        options={officeGroupOptions}
                                      />
                                    ) : (
                                      <Text type="secondary">{record.group}</Text>
                                    ),
                                },
                                {
                                  title: 'Actions',
                                  key: 'actions',
                                  width: 120,
                                  render: (_value, record) =>
                                    officeEditKey === record.key ? (
                                      <Space size="small">
                                        <Tooltip title="Save">
                                          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={saveOfficeEdit} />
                                        </Tooltip>
                                        <Tooltip title="Cancel">
                                          <Button size="small" icon={<CloseOutlined />} onClick={cancelOfficeEdit} />
                                        </Tooltip>
                                      </Space>
                                    ) : (
                                      <Space size="small">
                                        <Tooltip title="Edit">
                                          <Button size="small" icon={<EditOutlined />} onClick={() => startOfficeEdit(record)} />
                                        </Tooltip>
                                        <Popconfirm
                                          title="Delete this office?"
                                          description="This will remove the office from selection lists."
                                          onConfirm={() => handleDeleteOffice(record)}
                                        >
                                          <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                      </Space>
                                    ),
                                },
                              ]}
                            />
                          </Card>
                        </Col>
                        <Col span={24} md={12}>
                          <Card
                            size="small"
                            title="Roles"
                            extra={<Text type="secondary">Manage staff role options</Text>}
                          >
                            <Form form={roleForm} layout="vertical" onFinish={handleAddRole}>
                              <Row gutter={[8, 8]}>
                                <Col span={24}>
                                  <Form.Item name="name" label="Role name" rules={[{ required: true, message: 'Enter role name' }]}>
                                    <Input placeholder="LGU Coordinator" />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item name="slug" label="Role code" rules={[{ required: true, message: 'Enter role code' }]}>
                                    <Input placeholder="lgu_coordinator" />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Button icon={<PlusOutlined />} type="primary" htmlType="submit" block>
                                    Add Role
                                  </Button>
                                </Col>
                              </Row>
                            </Form>

                            <Table
                              size="small"
                              rowKey="key"
                              dataSource={roleRows}
                              pagination={false}
                              loading={loadingRoles}
                              style={{ marginTop: 12 }}
                              columns={[
                                {
                                  title: 'Role',
                                  dataIndex: 'name',
                                  render: (_value, record) =>
                                    roleEditId === record.id ? (
                                      <Input
                                        value={roleEdit.name}
                                        onChange={(e) => setRoleEdit((prev) => ({ ...prev, name: e.target.value }))}
                                      />
                                    ) : (
                                      record.displayName || record.name
                                    ),
                                },
                                {
                                  title: 'Code',
                                  dataIndex: 'slug',
                                  width: 140,
                                  render: (_value, record) =>
                                    roleEditId === record.id ? (
                                      <Input
                                        value={roleEdit.slug}
                                        onChange={(e) => setRoleEdit((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                                      />
                                    ) : (
                                      <Text code>{record.slug}</Text>
                                    ),
                                },
                                {
                                  title: 'Actions',
                                  key: 'actions',
                                  width: 120,
                                  render: (_value, record) =>
                                    roleEditId === record.id ? (
                                      <Space size="small">
                                        <Tooltip title="Save">
                                          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={saveRoleEdit} />
                                        </Tooltip>
                                        <Tooltip title="Cancel">
                                          <Button size="small" icon={<CloseOutlined />} onClick={cancelRoleEdit} />
                                        </Tooltip>
                                      </Space>
                                    ) : (
                                      <Space size="small">
                                        <Tooltip title="Edit">
                                          <Button size="small" icon={<EditOutlined />} onClick={() => startRoleEdit(record)} />
                                        </Tooltip>
                                        <Popconfirm
                                          title="Delete this role?"
                                          description="This will remove the role from selection lists."
                                          onConfirm={() => handleDeleteRole(record)}
                                        >
                                          <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                      </Space>
                                    ),
                                },
                              ]}
                            />
                          </Card>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: 'all',
                    label: 'All Users',
                    children: <UsersTable />,
                  },
                  {
                    key: 'recovery',
                    label: 'Recovery Requests',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <RecoveryRequestsTable />
                        <SecurityEventsTable events={[]} />
                      </Space>
                    ),
                  },
                  {
                    key: 'activity',
                    label: 'Admin Activity',
                    children: <AdminAuditActivity />,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          title="Edit Staff Account"
          open={editOpen}
          onCancel={() => setEditOpen(false)}
          onOk={handleEditSubmit}
          confirmLoading={editLoading}
          okText="Save Changes"
          destroyOnClose
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
              <Input placeholder="First name" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
              <Input placeholder="Last name" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Enter email' }, { type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="email@example.com" />
            </Form.Item>
            <Form.Item name="phoneNumber" label="Contact Number" rules={[{ min: 7, message: 'Enter a valid number' }]}>
              <Input placeholder="+63..." />
            </Form.Item>
            <Form.Item name="office" label="Office" rules={[{ required: true, message: 'Select an office' }]}>
              <Select
                placeholder="Select office"
                showSearch
                optionFilterProp="label"
                options={(officeGroupsState || []).map(g => ({
                  label: g.label,
                  options: g.options.map(o => ({ value: o.value, label: o.label })),
                }))}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
              <Select placeholder="Select role" options={roleOptionsState} />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Reason for change"
              rules={[{ required: true, message: 'Provide a reason' }, { min: 5, message: 'Reason must be at least 5 characters' }]}
              extra="Required for audit trail"
            >
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Reset Staff Password"
          open={resetOpen}
          onCancel={() => setResetOpen(false)}
          onOk={handleResetSubmit}
          confirmLoading={resetLoading}
          okText="Issue Temporary Password"
          destroyOnClose
        >
          <Form form={resetForm} layout="vertical">
            <Form.Item
              name="reason"
              label="Reason for reset"
              rules={[{ required: true, message: 'Provide a reason' }, { min: 5, message: 'Reason must be at least 5 characters' }]}
              extra="Required for audit trail"
            >
              <Input.TextArea rows={3} maxLength={500} showCount placeholder="Why are you resetting this account?" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={(
            <div>
              <Title level={4} style={{ margin: 0 }}>Create Staff Account</Title>
              <Text type="secondary">Set the staff email, office, and role.</Text>
            </div>
          )}
          open={createOpen}
          onCancel={closeCreateModal}
          footer={null}
          width={520}
          centered
          destroyOnHidden
          styles={{ body: { paddingTop: 12 } }}
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              background: 'rgba(255, 255, 255, 0.72)',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              borderRadius: 18,
              padding: 16,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
            }}
          >
            <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
              <Form.Item name="email" label="Staff Email" rules={[{ required: true, message: 'Enter an email' }, { type: 'email', message: 'Enter a valid email' }]}>
                <Input size="large" placeholder="staff@example.com" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                name="office"
                label="Office"
                rules={[{ required: true, message: 'Select an office' }]}
              >
                <Select
                  size="large"
                  placeholder="Select office"
                  showSearch
                  optionFilterProp="label"
                  style={{ borderRadius: 10 }}
                  options={(officeGroupsState || []).map(g => ({
                    label: g.label,
                    options: g.options.map(o => ({ value: o.value, label: o.label })),
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Select a role' }]}
              >
                <Select size="large" placeholder="Select role" options={roleOptionsState} style={{ borderRadius: 10 }} />
              </Form.Item>

              <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 12 }}>
                Review & Create
              </Button>
            </Form>

            <div
              style={{
                background: 'rgba(248, 250, 252, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: 12,
                borderRadius: 14,
              }}
            >
              <Text type="secondary">
                The selected role and office determine what actions this staff member can perform.
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button type="link" style={{ padding: 0 }} onClick={() => setTabKey('office-role')}>
                  Manage office & role options
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          title="Review Details"
          open={confirmOpen}
          onCancel={closeConfirmModal}
          footer={
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={closeConfirmModal} disabled={confirming}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleConfirmCreate} loading={confirming} disabled={confirming}>
                Confirm & Create Account
              </Button>
            </Space>
          }
          destroyOnHidden
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <Text type="secondary">Email:</Text> <Text>{pendingValues?.email || ''}</Text>
            </div>
            <div>
              <Text type="secondary">Role:</Text> <Text>{roleLabel(pendingValues?.role, roleOptionsState)}</Text>
            </div>
            <div>
              <Text type="secondary">Office:</Text> <Text>{officeLabel(pendingValues?.office, officeGroupsState)}</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="warning">You are about to create a staff account with access to internal LGU systems. Login credentials will be sent to this email.</Text>
            </div>
            {confirming && (
              <div style={{ marginTop: 6 }}>
                <Text type="secondary">Creating account and sending login instructions…</Text>
              </div>
            )}
          </div>
        </Modal>

        <Modal
          title="Staff Account Created Successfully"
          open={successOpen}
          onCancel={closeSuccessModal}
          footer={
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  closeSuccessModal()
                  setTabKey('staff')
                }}
              >
                View Staff Account
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  closeSuccessModal()
                  openCreateModal()
                }}
              >
                Create Another Staff
              </Button>
            </Space>
          }
          destroyOnHidden
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <Text type="secondary">Login instructions sent to:</Text> <Text>{successData?.email || ''}</Text>
            </div>
            {successData?.username && (
              <div>
                <Text type="secondary">Username:</Text> <Text code>{successData.username}</Text>
              </div>
            )}
            {successData?.devTempPassword && (
              <div>
                <Text type="secondary">Temporary Password:</Text> <Text code copyable>{successData.devTempPassword}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Visible in non-production only. Share this securely with the staff member.</Text>
                </div>
              </div>
            )}
            <div>
              <Text type="secondary">Account status:</Text> <Text>{successData?.status || ''}</Text>
            </div>
            <div>
              <Text type="secondary">Assigned office:</Text> <Text>{officeLabel(successData?.office, officeGroupsState)}</Text>
            </div>
            <div>
              <Text type="secondary">Role:</Text> <Text>{roleLabel(successData?.role, roleOptionsState)}</Text>
            </div>
          </div>
        </Modal>
      </Layout.Content>
    </Layout>
  )
}
