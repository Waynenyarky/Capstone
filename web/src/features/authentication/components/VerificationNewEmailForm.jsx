import { Form, Input, Button, Card, Flex } from 'antd'
import { useVerifyChangeEmailForm } from '@/features/authentication/hooks'

export default function VerificationNewEmailForm({ email, currentEmail, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyChangeEmailForm({ email, currentEmail, onSubmit })
  const cardTitle = title || 'Verify New Email'
  return (
    <Card title={cardTitle}>
      <Form name="verification_new" form={form} layout="vertical" onFinish={handleFinish}>
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
