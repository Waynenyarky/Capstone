import { Card, Button, Flex, Typography } from 'antd'
import { useSendCodeForCurrentUserConfirm } from '@/features/authentication/hooks'

import { useEffect } from 'react'

export default function SendCodeForCurrentUserConfirm({ email, onSent, title, autoSend = false } = {}) {
  const { isSending, handleSend } = useSendCodeForCurrentUserConfirm({ email, onSent })
  useEffect(() => {
    if (autoSend && email && !isSending) {
      handleSend()
    }
  }, [autoSend, email, isSending, handleSend])
  const cardTitle = title || 'Confirm Current Email'

  return (
    <Card title={cardTitle}>
      <Typography.Paragraph>
        To change your account email, first confirm you control your current email address.
      </Typography.Paragraph>
      <Typography.Text type="secondary">{email || 'Unknown email'}</Typography.Text>
      <Flex justify="end" gap="small" style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSend} loading={isSending} disabled={isSending || !email}>
          Send Code
        </Button>
      </Flex>
    </Card>
  )
}
