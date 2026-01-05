import { Form, Input, Button, Card, Flex } from 'antd'
import { changeConfirmPasswordRules as confirmPasswordRules, changePasswordRules as passwordRules } from "@/features/authentication/validations"
import { useChangePasswordForm } from "@/features/authentication/hooks"

export default function ChangePasswordForm({ email, resetToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useChangePasswordForm({ email, resetToken, onSubmit })
  return (
    <Card title="Change Password">
      <Form name="changePassword" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true, message: 'Please enter your current password' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="password" label="New Password" rules={passwordRules}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="confirmPassword" label="Confirm New Password" dependencies={['password']} hasFeedback rules={confirmPasswordRules}>
          <Input.Password />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Change Password</Button>
        </Flex>
      </Form>
    </Card>
  )
}