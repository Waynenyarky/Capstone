import { Form, Button, Card, Flex, Typography, Input, theme, Grid } from 'antd'
import { useLoginVerificationForm, useResendLoginCode } from "@/features/authentication/hooks"
import React from 'react'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function LoginVerificationForm({ email, onSubmit, title, otpExpiresAt, devCode, onSessionExpired } = {}) {
  const { form, handleFinish, isSubmitting } = useLoginVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Login'
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendLoginCode({ email, cooldownSec: 60, onSessionExpired })
  const { remaining: otpRemaining, isExpired } = useOtpCountdown(otpExpiresAt)
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const prefillDevCode = () => {
    if (devCode) form.setFieldsValue({ verificationCode: devCode })
  }

  return (
    <Card 
      variant="borderless"
      style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        borderRadius: 16
      }}
      styles={{ body: { padding: isMobile ? 24 : 40 } }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
        <Title level={isMobile ? 4 : 3}>{cardTitle}</Title>
        <Text type="secondary">
          Please enter the 6-digit code sent to <br/><Text strong style={{ color: token.colorPrimary }}>{email}</Text>
        </Text>
        {devCode && import.meta.env.VITE_DEMO_UI !== 'true' && (
          <Paragraph style={{ marginTop: 16, marginBottom: 0, padding: '12px 16px', background: token.colorFillQuaternary, borderRadius: 8, fontFamily: 'monospace', fontSize: 18, fontWeight: 600 }}>
            Development: your code is <Text copyable={{ text: devCode }}>{devCode}</Text>
          </Paragraph>
        )}
      </div>

      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish} size="default">
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <div style={{ maxWidth: 320, margin: '0 auto' }}>
            <Input.OTP 
              size="large" 
              length={6} 
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              inputType="numeric"
              mask={false}
              onChange={(value) => {
                // Input.OTP already handles numeric input, just ensure it's set in form
                form.setFieldsValue({ verificationCode: value })
              }}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                if (allowedKeys.includes(e.key)) return
                
                // Allow Ctrl/Cmd + A, C, V, X
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                
                // Block any non-numeric key
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            />
          </div>
        </Form.Item>

        <Flex vertical gap="middle">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
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

          {devCode && import.meta.env.VITE_DEMO_UI !== 'true' && (
            <Button type="dashed" onClick={prefillDevCode} block>
              Prefill Code (Dev: {devCode})
            </Button>
          )}
        </Flex>
      </Form>
    </Card>
  )
}