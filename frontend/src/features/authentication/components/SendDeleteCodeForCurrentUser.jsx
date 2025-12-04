import { Card, Button, Flex, Typography } from 'antd'
import { useSendDeleteAccountCode } from "@/features/authentication/hooks"

export default function SendDeleteCodeForCurrentUser({ email, onSent, title } = {}) {
  const { isSending, handleSend } = useSendDeleteAccountCode({ email, onSent })

  return (
    <Card title={title}>
      <Typography.Paragraph>
        We will send a verification code to your email to start the delete-account flow.
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        Reminder: Deleting your account will not remove past transactions or records associated with completed services.
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