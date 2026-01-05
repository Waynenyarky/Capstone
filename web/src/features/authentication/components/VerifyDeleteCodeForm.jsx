import { Form, Input, Button, Card, Flex, Typography } from 'antd'
import { useVerifyDeleteAccountCode } from "@/features/authentication/hooks"

export default function VerifyDeleteCodeForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyDeleteAccountCode({ email, onSubmit })
  return (
    <Card title={title}>
      <Typography.Paragraph type="secondary">
        Enter the 6-digit verification code that was sent to your email (not the code from an authenticator app). Check your inbox (and spam folder) for the message.
      </Typography.Paragraph>
      <Form name="verifyDelete" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="verificationCode" label="Verification Code" hasFeedback rules={[{ required: true, message: 'Enter the code' }] }>
          <Input.OTP />
        </Form.Item>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Tip: this is the email code sent to your inbox — do not enter codes from your authenticator app.
        </Typography.Text>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Verify</Button>
        </Flex>
      </Form>
    </Card>
  )
}