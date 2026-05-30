import { Form } from '@/shared/components/AppForm'
import { Modal, Input, Select, Button, Space, Typography, Grid } from 'antd'
import { roleLabel, officeLabel } from './useAdminUsersPage'
import { preventNonNumericKeyDown } from '@/shared/forms'

const { Text } = Typography
const { useBreakpoint } = Grid

/** Philippine mobile: 09XXXXXXXXX, 9XXXXXXXXX, or +639XXXXXXXXX. Required. */
const phoneRules = [
  { required: true, message: 'Enter a phone number' },
  {
    validator(_, value) {
      const v = String(value || '').trim().replace(/\D/g, '')
      if (!v) return Promise.resolve() // required rule handles empty
      const valid = /^09\d{9}$/.test(v) || /^639\d{9}$/.test(v) || /^9\d{9}$/.test(v)
      if (!valid) {
        return Promise.reject(new Error('Enter a valid Philippine mobile number (e.g. 09XX XXX XXXX or +63 9XX XXX XXXX)'))
      }
      return Promise.resolve()
    },
  },
]

export default function CreateStaffModals({
  createOpen,
  onCloseCreate,
  form,
  onCreateSubmit,
  confirmOpen,
  onCloseConfirm,
  confirming,
  onConfirmCreate,
  pendingValues,
  successOpen,
  onCloseSuccess,
  successData,
  officeGroupsState,
  roleOptionsState,
  setTabKey,
  openCreateModal,
}) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <>
      <Modal
        title="Create Staff Account"
        open={createOpen}
        onCancel={onCloseCreate}
        footer={null}
        width={isMobile ? '95%' : 520}
        centered
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Form form={form} layout="vertical" onFinish={onCreateSubmit}>
            <Form.Item name="email" label="Staff Email" rules={[{ required: true, message: 'Enter an email' }, { type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="staff@example.com" style={{ borderRadius: 10 }} />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={phoneRules}
              getValueFromEvent={(e) => String(e?.target?.value ?? '').replace(/\D/g, '').slice(0, 12)}
            >
              <Input
                placeholder="09XX XXX XXXX or +63 9XX XXX XXXX"
                style={{ borderRadius: 10 }}
                inputMode="numeric"
                maxLength={14}
                onKeyDown={preventNonNumericKeyDown}
                onPaste={(e) => {
                  e.preventDefault()
                  const raw = e?.clipboardData?.getData('text') ?? ''
                  const cleaned = String(raw).replace(/\D/g, '').slice(0, 12)
                  form.setFieldValue('phoneNumber', cleaned)
                }}
              />
            </Form.Item>
            <Form.Item name="office" label="Office" rules={[{ required: true, message: 'Select an office' }]}>
              <Select
                placeholder="Select office"
                showSearch
                optionFilterProp="label"
                style={{ borderRadius: 10 }}
                options={(officeGroupsState || []).map((g) => ({ label: g.label, options: g.options.map((o) => ({ value: o.value, label: o.label })) }))}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
              <Select placeholder="Select role" options={roleOptionsState} style={{ borderRadius: 10 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block style={{ borderRadius: 12 }}>
              Review & Create
            </Button>
          </Form>
          <div style={{ background: 'rgba(248, 250, 252, 0.85)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: 12, borderRadius: 14 }}>
            <Text type="secondary">The selected role and office determine what actions this staff member can perform.</Text>
          </div>
        </div>
      </Modal>

      <Modal
        title="Review Details"
        open={confirmOpen}
        onCancel={onCloseConfirm}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCloseConfirm} disabled={confirming}>Cancel</Button>
            <Button type="primary" onClick={onConfirmCreate} loading={confirming} disabled={confirming}>Confirm & Create Account</Button>
          </Space>
        }
        destroyOnHidden
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div><Text type="secondary">Email:</Text> <Text>{pendingValues?.email || ''}</Text></div>
          {pendingValues?.phoneNumber && (
            <div><Text type="secondary">Phone:</Text> <Text>{pendingValues.phoneNumber}</Text></div>
          )}
          <div><Text type="secondary">Role:</Text> <Text>{roleLabel(pendingValues?.role, roleOptionsState)}</Text></div>
          <div><Text type="secondary">Office:</Text> <Text>{officeLabel(pendingValues?.office, officeGroupsState)}</Text></div>
          <div style={{ marginTop: 8 }}>
            <Text type="warning">You are about to create a staff account with access to internal LGU systems. Login credentials will be sent to this email.</Text>
          </div>
          {confirming && <div style={{ marginTop: 6 }}><Text type="secondary">Creating account and sending login instructions…</Text></div>}
        </div>
      </Modal>

      <Modal
        title="Staff Account Created Successfully"
        open={successOpen}
        onCancel={onCloseSuccess}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => { onCloseSuccess(); setTabKey('staff'); }}>View Staff Account</Button>
            <Button type="primary" onClick={() => { onCloseSuccess(); openCreateModal(); }}>Create Another Staff</Button>
          </Space>
        }
        destroyOnHidden
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div><Text type="secondary">Login instructions sent to:</Text> <Text>{successData?.email || ''}</Text></div>
          {successData?.phoneNumber && (
            <div><Text type="secondary">Phone:</Text> <Text>{successData.phoneNumber}</Text></div>
          )}
          {successData?.devTempPassword && (
            <div>
              <Text type="secondary">Temporary Password:</Text> <Text code copyable>{successData.devTempPassword}</Text>
              <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>Visible in non-production only. Share this securely with the staff member.</Text></div>
            </div>
          )}
          <div><Text type="secondary">Account status:</Text> <Text>{successData?.status || ''}</Text></div>
          <div><Text type="secondary">Assigned office:</Text> <Text>{officeLabel(successData?.office, officeGroupsState)}</Text></div>
          <div><Text type="secondary">Role:</Text> <Text>{roleLabel(successData?.role, roleOptionsState)}</Text></div>
        </div>
      </Modal>
    </>
  )
}
