import { Form, Input, Button, Card, Flex } from 'antd'
import { useVerificationConfirmForm } from '@/features/authentication/hooks'

export default function VerificationConfirmForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerificationConfirmForm({ email, onSubmit })
  const cardTitle = title || 'Verify Current Email'
  return (
    <Card title={cardTitle}>
      <Form name="verification_confirm" form={form} layout="vertical" onFinish={handleFinish}>
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