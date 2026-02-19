import React from 'react'
import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'Who can turn maintenance mode on or off?',
    children: 'Only admins can request to enable or disable maintenance mode. The request appears on this page and often requires approval (e.g. from another admin) depending on your setup. Once approved, the change takes effect and non-admin users see the maintenance page.',
  },
  {
    key: '2',
    label: 'What do users see when maintenance is on?',
    children: 'Non-admin users are redirected to the public maintenance page and see the message you configured. They cannot log in or use the main app until maintenance mode is turned off. Admins can still access the admin area.',
  },
  {
    key: '3',
    label: 'Can I change the maintenance message?',
    children: 'Yes. When enabling or requesting maintenance mode, you can set the message shown to users (e.g. expected end time, contact info). Update it when you request a change or through the maintenance configuration if your system supports it.',
  },
  {
    key: '4',
    label: 'Why is there a pending request to enable/disable?',
    children: 'Your system may require a second admin to approve maintenance changes. Pending requests appear here until someone approves or rejects them. Use the Requests page if you need to approve a maintenance request.',
  },
]

export default function MaintenanceInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Maintenance Mode"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          When maintenance mode is <strong>on</strong>, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you can do</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Current status</strong> — See whether maintenance mode is on or off and the active message (if any).</Text></li>
            <li><Text><strong>Enable / disable</strong> — Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.</Text></li>
            <li><Text><strong>Pending requests</strong> — View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.</Text></li>
          </ul>
        </div>

        <div>
          <Text strong>Frequently asked questions</Text>
          <Collapse
            size="small"
            items={FAQ_ITEMS}
            style={{ marginTop: 8 }}
            bordered={false}
          />
        </div>
      </Space>
    </Modal>
  )
}
