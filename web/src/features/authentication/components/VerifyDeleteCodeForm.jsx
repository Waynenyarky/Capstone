import { Form, Input, Button, Card, Flex, Typography } from 'antd'
import { useVerifyDeleteAccountCode } from "@/features/authentication/hooks"

export default function VerifyDeleteCodeForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyDeleteAccountCode({ email, onSubmit })
  return (
    <Card title={title}>
      <Typography.Paragraph type="secondary">
        Enter the verification code sent to your email.
      </Typography.Paragraph>
      <Form name="verifyDelete" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="verificationCode" label="Verification Code" hasFeedback rules={[{ required: true, message: 'Enter the code' }] }>
          <Input.OTP />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Verify</Button>
        </Flex>
      </Form>
    </Card>
  )
}