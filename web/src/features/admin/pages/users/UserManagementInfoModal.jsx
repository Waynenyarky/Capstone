import React from 'react'
import { Modal, Drawer, Typography, Space, Divider } from 'antd'

const { Text } = Typography

const InfoContent = () => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Text>
      User Management lets you manage staff accounts, admin accounts, and business owners. Staff members are assigned to offices and roles that determine their permissions in the system.
    </Text>

    <Divider style={{ margin: '8px 0' }} />

    <div>
      <Text strong>Tabs</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text><strong>Overview</strong> – Stats, charts, and recent activity (staff by status, business owners, recent registrations)</Text></li>
        <li><Text><strong>Staff Accounts</strong> – View and manage LGU staff. Select a staff member to edit, reset password, disable, or activate their account. All actions require a reason for audit trail.</Text></li>
        <li><Text><strong>Staff by Office & Role</strong> – Browse staff by office. Select an office to see its employees, then click a row to open their detail in Staff Accounts.</Text></li>
        <li><Text><strong>Admins</strong> – View and manage admin accounts. Password reset and disable requests require approval from other administrators.</Text></li>
        <li><Text><strong>Business Owners</strong> – View all registered business owners</Text></li>
        <li><Text><strong>Logs</strong> – View all admin actions across every user. Search by name or email, filter by action type and date range, and click a row for full details.</Text></li>
      </ul>
    </div>

    <div>
      <Text strong>Staff statuses</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text><strong>Active</strong> – Can log in and use the system</Text></li>
        <li><Text><strong>Pending</strong> – Awaiting onboarding (must change temporary password or set up MFA)</Text></li>
        <li><Text><strong>Disabled</strong> – Account disabled by admin; cannot log in until reactivated</Text></li>
      </ul>
    </div>

    <div>
      <Text strong>Staff actions</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text><strong>Edit Details</strong> – Update name, email, phone, office, role</Text></li>
        <li><Text><strong>Reset Password</strong> – Issue a temporary password (requires reason)</Text></li>
        <li><Text><strong>Disable Account</strong> – Prevent login (requires reason)</Text></li>
        <li><Text><strong>Activate Account</strong> – Re-enable a disabled account (requires reason)</Text></li>
      </ul>
    </div>

    <Text type="secondary" style={{ fontSize: 12 }}>
      Use the <strong>Add Employee</strong> button (Staff Accounts tab) to create new staff. Assign offices and roles to control what each staff member can do. All sensitive actions are logged for audit.
    </Text>
  </Space>
)

export default function UserManagementInfoModal({ open, onClose, isMobile = false }) {
  if (isMobile) {
    return (
      <Drawer
        title="About User Management"
        placement="bottom"
        open={open}
        onClose={onClose}
        height="90vh"
      >
        <InfoContent />
      </Drawer>
    )
  }

  return (
    <Modal
      title="About User Management"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <InfoContent />
    </Modal>
  )
}
