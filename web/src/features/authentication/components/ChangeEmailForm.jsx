import { Form, Input, Button, Card, Flex } from 'antd'
import { useChangeEmailForm } from "@/features/authentication/hooks"
import { emailRules } from "@/features/authentication/validations"

export default function ChangeEmailForm({ currentEmail, resetToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useChangeEmailForm({ email: currentEmail, resetToken, onSubmit })
  return (
    <Card title="Change Email">
      <Form name="changeEmail" form={form} layout="vertical" onFinish={handleFinish} initialValues={{ newEmail: '' }}>
        <Form.Item
          name="newEmail"
          label="New Email"
          rules={[
            ...emailRules,
            () => ({
              validator(_, value) {
                if (!value || value !== currentEmail) return Promise.resolve()
                return Promise.reject(new Error('New email must be different from current email'))
              },
            }),
          ]}
        >
          <Input />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Change Email</Button>
        </Flex>
      </Form>
    </Card>
  )
}