import React from 'react'
import { Layout, Row, Col, Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography } from 'antd'
import Sidebar from '@/features/authentication/components/Sidebar'
import { UsersTable } from '@/features/admin/users'
import { fetchJsonWithFallback } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications'

const { Text } = Typography

const officeGroups = [
  {
    label: 'Core Offices',
    options: [
      { value: 'OSBC', label: 'OSBC – One Stop Business Center' },
      { value: 'CHO', label: 'CHO – City Health Office' },
      { value: 'BFP', label: 'BFP – Bureau of Fire Protection' },
      { value: 'CEO / ZC', label: 'CEO / ZC – City Engineering Office / Zoning Clearance' },
      { value: 'BH', label: 'BH – Barangay Hall / Barangay Business Clearance' },
    ],
  },
  {
    label: 'Preneed / Inter-Govt Clearances',
    options: [
      { value: 'DTI', label: 'DTI – Department of Trade and Industry' },
      { value: 'SEC', label: 'SEC – Securities and Exchange Commission' },
      { value: 'CDA', label: 'CDA – Cooperative Development Authority' },
    ],
  },
  {
    label: 'Specialized / Conditional Offices',
    options: [
      { value: 'PNP-FEU', label: 'PNP‑FEU – Firearms & Explosives Unit' },
      { value: 'FDA / BFAD / DOH', label: 'FDA / BFAD / DOH – Food & Drug Administration / Bureau of Food & Drugs / Department of Health' },
      { value: 'PRC / PTR', label: 'PRC / PTR – Professional Regulatory Commission / Professional Tax Registration Boards' },
      { value: 'NTC', label: 'NTC – National Telecommunications Commission' },
      { value: 'POEA', label: 'POEA – Philippine Overseas Employment Administration' },
      { value: 'NIC', label: 'NIC – National Insurance Commission' },
      { value: 'ECC / ENV', label: 'ECC / ENV – Environmental Compliance Certificate / Environmental Office' },
    ],
  },
  {
    label: 'Support / Coordination Offices',
    options: [
      { value: 'CTO', label: "CTO – City Treasurer’s Office" },
      { value: 'MD', label: 'MD – Market Division / Sector-Specific Divisions' },
      { value: 'CLO', label: 'CLO – City Legal Office' },
    ],
  },
]

const roleOptions = [
  { value: 'lgu_officer', label: 'LGU Officer' },
  { value: 'lgu_manager', label: 'LGU Manager' },
  { value: 'inspector', label: 'LGU Inspector' },
  { value: 'cso', label: 'Customer Support Officer' },
]

function roleLabel(role) {
  const key = String(role || '').toLowerCase()
  const map = {
    lgu_officer: 'LGU Officer',
    lgu_manager: 'LGU Manager',
    inspector: 'LGU Inspector',
    cso: 'Customer Support Officer',
  }
  return map[key] || key
}

function officeLabel(value) {
  const v = String(value || '')
  for (const group of officeGroups) {
    for (const opt of group.options) {
      if (opt.value === v) return opt.label
    }
  }
  return v
}

export default function AdminUsers() {
  const { success, error } = useNotifier()
  const [staff, setStaff] = React.useState([])
  const [loadingStaff, setLoadingStaff] = React.useState(false)
  const [tabKey, setTabKey] = React.useState('staff')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [form] = Form.useForm()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [pendingValues, setPendingValues] = React.useState(null)
  const [successOpen, setSuccessOpen] = React.useState(false)
  const [successData, setSuccessData] = React.useState(null)

  const loadStaff = React.useCallback(async () => {
    setLoadingStaff(true)
    try {
      const data = await fetchJsonWithFallback('/api/auth/staff', { method: 'GET' })
      setStaff(Array.isArray(data) ? data : (data?.staff || []))
    } catch (e) {
      console.error('Load staff error:', e)
      setStaff([])
      error(e, 'Failed to load staff')
    } finally {
      setLoadingStaff(false)
    }
  }, [error])

  React.useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const handleCreateSubmit = (values) => {
    setPendingValues(values)
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    const values = pendingValues || {}
    try {
      setConfirming(true)
      const startedAt = Date.now()
      const payload = {
        email: values.email,
        office: values.office,
        role: values.role,
      }
      const created = await fetchJsonWithFallback('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const elapsed = Date.now() - startedAt
      if (elapsed < 1200) {
        await new Promise((r) => setTimeout(r, 1200 - elapsed))
      }
      success('Staff account created')
      form.resetFields()
      setCreateOpen(false)
      setConfirmOpen(false)
      setPendingValues(null)
      await loadStaff()
      setTabKey('staff')
      setSuccessData({
        id: created?.id,
        email: created?.email || values.email,
        office: created?.office || values.office,
        role: created?.role || values.role,
        status: 'Pending First Login & MFA Setup',
      })
      setSuccessOpen(true)
    } catch (e) {
      console.error('Create staff error:', e)
      error(e, 'Failed to create staff account')
    } finally {
      setConfirming(false)
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
                  <Button type="primary" onClick={() => setCreateOpen(true)}>Add New Staff</Button>
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
          onCancel={() => setCreateOpen(false)}
          footer={null}
          destroyOnClose
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
          onCancel={() => (confirming ? null : setConfirmOpen(false))}
          footer={
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setConfirmOpen(false)} disabled={confirming}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleConfirmCreate} loading={confirming} disabled={confirming}>
                Confirm & Create Account
              </Button>
            </Space>
          }
          destroyOnClose
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
          onCancel={() => setSuccessOpen(false)}
          footer={
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setSuccessOpen(false)
                  setTabKey('staff')
                }}
              >
                View Staff Account
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setSuccessOpen(false)
                  setCreateOpen(true)
                }}
              >
                Create Another Staff
              </Button>
            </Space>
          }
          destroyOnClose
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
