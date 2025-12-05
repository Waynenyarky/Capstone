import { Form, Input, Button, Card, Flex } from 'antd'
import { useLoginVerificationForm } from "@/features/authentication/hooks"
import React from 'react'

export default function LoginVerificationForm({ email, onSubmit, title, devCode } = {}) {
  const { form, handleFinish, isSubmitting, prefillDevCode } = useLoginVerificationForm({ email, onSubmit, devCode })
  const cardTitle = title || 'Verify Login'
  return (
    <Card title={cardTitle} extra={devCode ? (<Button size="small" onClick={prefillDevCode}>Prefill Code</Button>) : undefined}>
      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish}>
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