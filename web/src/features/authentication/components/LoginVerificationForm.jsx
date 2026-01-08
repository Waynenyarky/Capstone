import { Form, Button, Card, Flex, Typography } from 'antd'
import { useLoginVerificationForm, useResendLoginCode } from "@/features/authentication/hooks"
import React from 'react'
import OtpInput from '@/features/authentication/components/OtpInput.jsx'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'

export default function LoginVerificationForm({ email, onSubmit, title, otpExpiresAt } = {}) {
  const { form, handleFinish, isSubmitting } = useLoginVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Login'
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendLoginCode({ email, cooldownSec: 60 })
  const { remaining: otpRemaining, isExpired } = useOtpCountdown(otpExpiresAt)
  return (
    <Card title={cardTitle}>
      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="verificationCode" label="Verification Code" hasFeedback rules={[{ required: true, message: 'Enter the code' }] }>
          <OtpInput />
        </Form.Item>
        {otpRemaining != null ? (
          <div style={{ marginBottom: 8 }}>
            <Typography.Text type={isExpired ? 'danger' : 'secondary'}>
              {isExpired ? 'Code expired' : `Code expires in: ${Math.floor(otpRemaining / 60)}:${String(otpRemaining % 60).padStart(2, '0')}`}
            </Typography.Text>
          </div>
        ) : null}
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