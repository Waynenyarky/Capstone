import { Form, Button, Card, Flex, Typography, Input, theme } from 'antd'
import { useLoginVerificationForm, useResendLoginCode } from "@/features/authentication/hooks"
import React from 'react'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'

const { Title, Text, Paragraph } = Typography

export default function LoginVerificationForm({ email, onSubmit, title, otpExpiresAt, devCode } = {}) {
  const { form, handleFinish, isSubmitting } = useLoginVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Login'
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendLoginCode({ email, cooldownSec: 60 })
  const { remaining: otpRemaining, isExpired } = useOtpCountdown(otpExpiresAt)
  const { token } = theme.useToken()

  const prefillDevCode = () => {
    if (devCode) form.setFieldsValue({ verificationCode: devCode })
  }

  return (
    <Card 
      variant="borderless"
      style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        borderRadius: 16
      }}
      styles={{ body: { padding: 40 } }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>{cardTitle}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          We sent a verification code to <Text strong style={{ color: token.colorPrimary }}>{email}</Text>
        </Text>
      </div>

      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish} size="large">
        <Form.Item 
          name="verificationCode" 
          label={<Text strong>Verification Code</Text>}
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { len: 6, message: 'Code must be 6 digits' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <Input.OTP size="large" length={6} style={{ width: '100%', justifyContent: 'center' }} />
        </Form.Item>

        <Flex vertical gap="middle">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Verify
          </Button>

          <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <Text type={isExpired ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
              {otpRemaining != null ? (
                 isExpired ? 'Code expired' : `Code expires in: ${Math.floor(otpRemaining / 60)}:${String(otpRemaining % 60).padStart(2, '0')}`
              ) : ''}
            </Text>
            <Button 
              type="link" 
              onClick={handleResend} 
              loading={isResending} 
              disabled={isCooling || isResending}
              style={{ padding: 0, height: 'auto' }}
            >
              {isCooling ? `Resend available in ${remaining}s` : 'Resend Code'}
            </Button>
          </Flex>

          {devCode && (
            <Button type="dashed" onClick={prefillDevCode} block>
              Prefill Code (Dev: {devCode})
            </Button>
          )}
        </Flex>
      </Form>
    </Card>
  )
}