import React from 'react'
import { Modal, Typography, Flex, Button } from 'antd'

export default function ProviderWelcomeModal({ open, onCancel, onSkip, onStart }) {
  return (
    <Modal
      open={open}
      title="Welcome to your provider workspace"
      footer={(
        <Flex justify="end" gap={8}>
          <Button onClick={onSkip}>Skip for now</Button>
          <Button type="primary" onClick={onStart}>Start service setup</Button>
        </Flex>
      )}
      onCancel={onCancel}
    >
      <Typography.Paragraph>
        Your application has been approved. Would you like to start setting up the services you want to offer now?
      </Typography.Paragraph>
      <Typography.Text type="secondary">
        You can only activate services within the categories you selected in your application. To add a new category later, please contact the admin.
      </Typography.Text>
    </Modal>
  )
}