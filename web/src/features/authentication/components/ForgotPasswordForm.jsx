import { Form, Input, Button, Card, Flex } from 'antd'
import { useForgotPasswordForm } from "@/features/authentication/hooks"
import { forgotPasswordEmailRules } from "@/features/authentication/validations"


export default function ForgotPasswordForm({ onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useForgotPasswordForm({ onSubmit })
  return (
    <Card title="Forgot Password">
      <Form name="forgotPassword" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="email"
          label="Email"
          rules={forgotPasswordEmailRules}
        >
          <Input />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Continue</Button>
        </Flex>
      </Form>
    </Card>
  )
}