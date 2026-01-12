import React from 'react'
import { Layout, Row, Col, Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { UsersTable } from '@/features/admin/users'
import { useStaffManagement, officeGroups, roleOptions, roleLabel, officeLabel } from '../hooks'

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
                ]}
              />
            </Card>
          </Col>
        </Row>

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
