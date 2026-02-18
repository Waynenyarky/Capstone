import React from 'react'
import { Modal, Button, Typography } from 'antd'

const { Text } = Typography

export default function MaintenanceInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About maintenance mode"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={560}
    >
      <Text>
        When maintenance mode is <strong>on</strong>, non-admin users are redirected to the public
        maintenance page and see the message you set. Enable/disable requests require approval. This
        page shows the current system status and pending requests.
      </Text>
    </Modal>
  )
}
