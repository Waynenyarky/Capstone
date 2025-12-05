import { Form, Input, Button, Card, Flex } from 'antd'
import { useSignUpVerificationForm } from "@/features/authentication/hooks"
import React from 'react'
import { useNotifier } from '@/shared/notifications.js'

export default function SignUpVerificationForm({ email, onSubmit, title, devCode } = {}) {
  const { form, handleFinish, isSubmitting } = useSignUpVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Sign Up'
  const { success } = useNotifier()

  const handlePrefillCode = React.useCallback(() => {
    if (!devCode) return
    form.setFieldsValue({ verificationCode: String(devCode) })
    success('Dev code prefilled')
  }, [form, devCode, success])
  return (
    <Card title={cardTitle} extra={devCode ? (<Button size="small" onClick={handlePrefillCode}>Prefill Code</Button>) : undefined}>
      <Form name="signUpVerification" form={form} layout="vertical" onFinish={handleFinish}>
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