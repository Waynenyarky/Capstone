import React, { useState } from 'react'
import { Layout, Row, Col, Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Switch } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { UsersTable } from '@/features/admin/users'
import { useStaffManagement, officeGroups, roleOptions, roleLabel, officeLabel } from '../hooks'
import { RecoveryRequestsTable, SecurityEventsTable, AdminAuditActivity } from '../components'
import { updateStaff, resetStaffPassword } from '../services'
import { useNotifier } from '@/shared/notifications'

const { Text } = Typography

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
    closeSuccessModal
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
    { title: 'Office', dataIndex: 'office', key: 'office' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r) => roleLabel(r) },
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
                options={officeGroups.map(g => ({
                  label: g.label,
                  options: g.options.map(o => ({ value: o.value, label: o.label })),
                }))}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
              <Select placeholder="Select role" options={roleOptions} />
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
          title="Create Staff Account"
          open={createOpen}
          onCancel={closeCreateModal}
          footer={null}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
            <Form.Item name="email" label="Staff Email" rules={[{ required: true, message: 'Enter an email' }, { type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="staff@example.com" />
            </Form.Item>

            <Form.Item
              name="office"
              label="Office"
              rules={[{ required: true, message: 'Select an office' }]}
              extra="The selected role and office determine what actions this staff member can perform."
            >
              <Select
                placeholder="Select office"
                showSearch
                optionFilterProp="label"
                options={officeGroups.map(g => ({
                  label: g.label,
                  options: g.options.map(o => ({ value: o.value, label: o.label })),
                }))}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Select a role' }]}
              extra="The selected role and office determine what actions this staff member can perform."
            >
              <Select placeholder="Select role" options={roleOptions} />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              Review & Create
            </Button>
          </Form>
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
              <Text type="secondary">Role:</Text> <Text>{roleLabel(pendingValues?.role)}</Text>
            </div>
            <div>
              <Text type="secondary">Office:</Text> <Text>{officeLabel(pendingValues?.office)}</Text>
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
            <div>
              <Text type="secondary">Account status:</Text> <Text>{successData?.status || ''}</Text>
            </div>
            <div>
              <Text type="secondary">Assigned office:</Text> <Text>{officeLabel(successData?.office)}</Text>
            </div>
            <div>
              <Text type="secondary">Role:</Text> <Text>{roleLabel(successData?.role)}</Text>
            </div>
          </div>
        </Modal>
      </Layout.Content>
    </Layout>
  )
}
