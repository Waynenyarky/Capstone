import React from 'react'
import { Modal, Button, Typography, Space, Divider, Collapse } from 'antd'
import { FAQ_ITEMS } from './constants/maintenance.constants.js'

const { Text } = Typography

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
