import { Form, Button, Card, Flex, Typography } from 'antd'
import { useLoginVerificationForm, useResendLoginCode } from "@/features/authentication/hooks"
import React from 'react'
import OtpInput from '@/features/authentication/components/OtpInput.jsx'

export default function LoginVerificationForm({ email, onSubmit, title, devCode } = {}) {
  const { form, handleFinish, isSubmitting, prefillDevCode } = useLoginVerificationForm({ email, onSubmit, devCode })
  const cardTitle = title || 'Verify Login'
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendLoginCode({ email, cooldownSec: 60 })
  return (
    <Card title={cardTitle} extra={devCode ? (<Button size="small" onClick={prefillDevCode}>Prefill Code</Button>) : undefined}>
      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="verificationCode" label="Verification Code" hasFeedback rules={[{ required: true, message: 'Enter the code' }] }>
          <OtpInput />
        </Form.Item>
        <Flex justify="space-between" align="center">
          <div>
            <Typography.Text type="secondary">Max attempts: 5 • Rate-limited on repeated failures</Typography.Text>
          </div>
          <div>
            <Button size="small" onClick={handleResend} loading={isResending} disabled={isCooling || isResending} style={{ marginRight: 8 }}>
              {isCooling ? `Resend (${remaining}s)` : 'Resend code'}
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Verify</Button>
          </div>
        </Flex>
      </Form>
    </Card>
  )
}