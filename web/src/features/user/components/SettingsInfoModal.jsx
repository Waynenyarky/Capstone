import React from 'react'
import { Modal, Button, Typography } from 'antd'

export default function SettingsInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Settings"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={560}
    >
      <Typography.Paragraph>
        Settings lets you manage your account, security, and preferences.
      </Typography.Paragraph>
      <Typography.Paragraph>
        <strong>General</strong> — Profile details and display name.
      </Typography.Paragraph>
      <Typography.Paragraph>
        <strong>Security</strong> — Password, MFA, passkeys, and active sessions.
      </Typography.Paragraph>
      <Typography.Paragraph>
        <strong>Account</strong> — Email, notification preferences, and account deletion.
      </Typography.Paragraph>
      <Typography.Paragraph>
        <strong>Theme</strong> — Appearance and theme customization.
      </Typography.Paragraph>
    </Modal>
  )
}
