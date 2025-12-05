import { Form, Button, Card, Flex, Typography, Alert } from 'antd'
import { useConfirmDeleteAccountForm } from "@/features/authentication/hooks"

export default function ConfirmDeleteAccountForm({ email, deleteToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useConfirmDeleteAccountForm({ email, deleteToken, onSubmit })
  return (
    <Card title="Confirm Account Deletion">
      <Alert
        type="warning"
        message="Important"
        description={
          <>
            <Typography.Paragraph>
              This will schedule your account for deletion in 30 days.
            </Typography.Paragraph>
            <Typography.Paragraph>
              Your past transactions and service records will NOT be removed, as they must remain for auditing, billing, and service history.
            </Typography.Paragraph>
          </>
        }
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Typography.Paragraph>
        If you’re sure, proceed to schedule account deletion.
      </Typography.Paragraph>
      <Form name="confirmDeleteAccount" form={form} layout="vertical" onFinish={handleFinish}>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Schedule Deletion</Button>
        </Flex>
      </Form>
    </Card>
  )
}