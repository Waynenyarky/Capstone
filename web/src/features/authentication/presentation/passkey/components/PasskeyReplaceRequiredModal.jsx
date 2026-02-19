/**
 * Presentation Component: PasskeyReplaceRequiredModal
 * Shown to admins when they try to disable passkeys. They must register a new passkey first;
 * the old one(s) are only removed after successful registration.
 */
import React from 'react'
import { Modal, Alert, Typography, Button } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'

const { Paragraph } = Typography

export default function PasskeyReplaceRequiredModal({
  visible,
  onRegister,
  onCancel,
}) {
  return (
    <Modal
      title={
        <>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Replace Passkey Required
        </>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="register" type="primary" onClick={onRegister} icon={<SafetyCertificateOutlined />}>
          Register New Passkey
        </Button>,
      ]}
      centered
    >
      <Alert
        type="info"
        showIcon
        message="Admins must have at least one passkey"
        description="Register a new passkey first. After you register successfully, your current passkey(s) will be removed. If you cancel or registration fails, your current passkey(s) will remain and nothing will change."
        style={{ marginBottom: 16 }}
      />
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        This keeps your account secure while letting you switch to a new device or passkey.
      </Paragraph>
    </Modal>
  )
}
