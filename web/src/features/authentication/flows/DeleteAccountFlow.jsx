import { useState } from 'react'
import { Result, Button, Typography, Input, Alert } from 'antd'
import { Form } from '@/shared/components/AppForm'
import { useLoggedInDeleteAccountFlow } from "@/features/authentication/hooks"

const { Title, Text, Paragraph } = Typography

export default function DeleteAccountFlow({ onBackToStart } = {}) {
  const { step, confirmProps } = useLoggedInDeleteAccountFlow()
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const showBack = typeof onBackToStart === 'function' && step !== 'done'

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await confirmProps.onSubmit({ password: values.password })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
      {showBack && (
        <Button type="text" onClick={onBackToStart} style={{ marginBottom: 16, paddingLeft: 0 }}>
          &larr; Back
        </Button>
      )}

      {step === 'confirm' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 8 }}>Delete Account</Title>
            <Text type="secondary">
              Enter your password to confirm account deletion. This action is irreversible.
            </Text>
          </div>
          <Alert
            type="error"
            showIcon
            message="This will permanently delete your account and all associated data."
            style={{ marginBottom: 24 }}
          />
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="password"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your password to confirm' }]}
            >
              <Input.Password placeholder="Enter your password" variant="filled" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
                Delete my account
              </Button>
            </Form.Item>
          </Form>
        </>
      )}

      {step === 'done' && (
        <Result
          status="success"
          title="Account Deleted"
          subTitle="Your account has been deleted. You will be logged out shortly."
          extra={[
            <Button type="primary" key="done" onClick={() => window.location.reload()}>
              Done
            </Button>,
          ]}
        />
      )}
    </div>
  )
}