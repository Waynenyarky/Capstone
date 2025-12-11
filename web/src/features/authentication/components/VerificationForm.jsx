import { Form, Input, Button, Card, Flex } from 'antd'
import { useVerificationForm } from "@/features/authentication/hooks"
import React from 'react'
 

export default function VerificationForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Code'
  return (
    <Card title={cardTitle}>
      <Form name="verification" form={form} layout="vertical" onFinish={handleFinish}>
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