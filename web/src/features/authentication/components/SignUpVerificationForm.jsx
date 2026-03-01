import { Form } from '@/shared/components/AppForm'
import { Input, Button, Flex, Typography, Grid } from 'antd'
import { useSignUpVerificationForm, useResendSignupCode } from "@/features/authentication/hooks"
import React, { useState } from 'react'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function SignUpVerificationForm({ email, onSubmit, title, devCode } = {}) {
  const { form, handleFinish, isSubmitting, attempts, setAttempts } = useSignUpVerificationForm({ email, onSubmit })
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [devCodeDisplay, setDevCodeDisplay] = useState(devCode)

  const { isSending: isResending, handleResend, isCooling, remaining } = useResendSignupCode({
    email,
    cooldownSec: 60,
    onSent: ({ devCode: newDevCode }) => {
      setAttempts(5)
      form.resetFields(['verificationCode'])
      if (newDevCode !== undefined && newDevCode !== null) setDevCodeDisplay(String(newDevCode))
    }
  })
  const { success } = useNotifier()

  const handlePrefillCode = React.useCallback(() => {
    if (!devCodeDisplay) return
    form.setFieldsValue({ verificationCode: String(devCodeDisplay) })
    success('Dev code prefilled')
  }, [form, devCodeDisplay, success])

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 6 : 8 }}>{title || 'Verify Your Email'}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Please enter the 6-digit code sent to <br/>
          <Text strong>{email || 'your email address'}</Text>
        </Paragraph>
      </div>

      <Form name="signUpVerification" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <Input.OTP 
            length={6} 
            disabled={attempts <= 0} 
            style={{ width: '100%', justifyContent: 'center' }}
            inputType="numeric"
            mask={false}
            onChange={(value) => {
              // Input.OTP already handles numeric input, just ensure it's set in form
              form.setFieldsValue({ verificationCode: value })
            }}
            onKeyDown={(e) => {
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
              if (allowedKeys.includes(e.key)) return
              if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
        </Form.Item>

        <Flex vertical gap="middle">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting || attempts <= 0} block>
            Verify Email
          </Button>
          
          <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <Text type={attempts <= 1 ? "danger" : "secondary"} style={{ fontSize: 13 }}>
              {attempts > 0 ? `Attempts remaining: ${attempts}` : 'Max attempts reached'}
            </Text>
            <Button 
              type="link" 
              onClick={handleResend} 
              loading={isResending} 
              disabled={isCooling || isResending}
              style={{ padding: 0, height: 'auto', fontSize: 13 }}
            >
              {isCooling ? `Resend available in ${remaining}s` : 'Resend Code'}
            </Button>
          </Flex>

          {devCodeDisplay && import.meta.env.VITE_DEMO_UI !== 'true' && (
            <Button type="dashed" onClick={handlePrefillCode} block>
              Prefill Code (Dev: {devCodeDisplay})
            </Button>
          )}
          
        </Flex>
      </Form>
    </div>
  )
}