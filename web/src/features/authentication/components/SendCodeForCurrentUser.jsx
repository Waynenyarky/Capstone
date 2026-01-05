import { Card, Button, Flex, Typography } from 'antd'
import { useSendVerificationCode } from "@/features/authentication/hooks"

import { useEffect } from 'react'

export default function SendCodeForCurrentUser({ email, onSent, title, autoSend = false } = {}) {
  const { isSending, handleSend } = useSendVerificationCode({ email, onSent })
  useEffect(() => {
    if (autoSend && email && !isSending) {
      handleSend()
    }
  }, [autoSend, email, isSending, handleSend])
  const cardTitle = title || 'Send Verification Code'

  return (
    <Card title={cardTitle}>
      <Typography.Paragraph>
        We will send a verification code to your email.
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