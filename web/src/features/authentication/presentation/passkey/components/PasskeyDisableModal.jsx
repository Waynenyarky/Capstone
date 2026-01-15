/**
 * Presentation Component: PasskeyDisableModal
 * Modal for disabling all passkeys - pure presentation
 */
import React from 'react'
import { Modal, Alert, Typography, Button } from 'antd'

const { Paragraph } = Typography

export default function PasskeyDisableModal({ 
  visible, 
  onOk, 
  onCancel, 
  deleting 
}) {
  return (
    <Modal
      title="Disable Passkey Authentication"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="Disable Passkeys"
      okButtonProps={{ danger: true, loading: deleting }}
      cancelButtonProps={{ disabled: deleting }}
      centered
    >
      <Alert 
        type="warning" 
        showIcon
        message="This will disable all passkeys"
        description="All registered passkeys will be removed. You will no longer be able to use passkeys to sign in. You can register new passkeys at any time."
        style={{ marginBottom: 16 }}
      />
      <Paragraph>
        Are you sure you want to disable Passkey Authentication? This action cannot be undone.
      </Paragraph>
    </Modal>
  )
}
