import { Card, Button, Flex, Typography, Alert } from 'antd'
import { useSendDeleteAccountCode } from "@/features/authentication/hooks"

export default function SendDeleteCodeForCurrentUser({ email, onSent, title } = {}) {
  const { isSending, handleSend } = useSendDeleteAccountCode({ email, onSent })

  return (
    <Card title={title}>
      <Alert
        type="info"
        message="Email verification"
        description="This flow uses a 6-digit code sent to your email (e.g., Gmail). Do NOT use codes from an authenticator app."
        showIcon
        style={{ marginBottom: 12 }}
      />
      <Typography.Paragraph>
        We will send a 6-digit verification code to your email (for example, your Gmail address) to start the delete-account flow. Enter that code on the next step to verify you own the email account.
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