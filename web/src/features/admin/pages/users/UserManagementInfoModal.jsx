import React from 'react'
import { Modal, Drawer, Typography, Space, Divider } from 'antd'

const { Text } = Typography

const InfoContent = () => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Text>
      User Management lets you manage staff accounts, offices, and roles. Staff members can be assigned to offices and roles that determine their permissions in the system.
    </Text>

    <Divider style={{ margin: '8px 0' }} />

    <div>
      <Text strong>Sections</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text>Overview – stats, charts, and recent activity</Text></li>
        <li><Text>Staff Accounts – view and manage LGU staff members</Text></li>
        <li><Text>All Users – view all registered users including business owners</Text></li>
      </ul>
    </div>

    <Text type="secondary" style={{ fontSize: 12 }}>
      Use the Add Employee button in the content area to create new staff accounts. Assign offices and roles to control what each staff member can do.
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
