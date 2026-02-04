import { Form, Input, Button, Card, Flex, Typography, theme } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useSignUpVerificationForm, useResendSignupCode } from "@/features/authentication/hooks"
import React from 'react'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text, Paragraph } = Typography

export default function SignUpVerificationForm({ email, onSubmit, title, devCode } = {}) {
  const { form, handleFinish, isSubmitting, attempts, setAttempts } = useSignUpVerificationForm({ email, onSubmit })
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendSignupCode({ 
    email, 
    cooldownSec: 60,
    onSent: () => {
      setAttempts(5)
      form.resetFields(['verificationCode'])
    }
  })
  const { success } = useNotifier()
  const { token } = theme.useToken()

  const handlePrefillCode = React.useCallback(() => {
    if (!devCode) return
    form.setFieldsValue({ verificationCode: String(devCode) })
    success('Dev code prefilled')
  }, [form, devCode, success])

  return (
    <Card 
      style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        borderRadius: 12,
      }}
      styles={{ body: { padding: 40 } }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: 64, 
          height: 64, 
          borderRadius: '50%', 
          backgroundColor: token.colorPrimaryBg,
          color: 'white',
          fontSize: 32,
          marginBottom: 24
        }}>
          <MailOutlined />
        </div>
        
        <Title level={3} style={{ marginBottom: 8 }}>{title || 'Verify Your Email'}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Please enter the 6-digit code sent to <br/>
          <Text strong style={{ color: token.colorText }}>{email || 'your email address'}</Text>
        </Paragraph>
      </div>

      <Form name="signUpVerification" form={form} layout="vertical" onFinish={handleFinish} size="large">
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <Input.OTP 
            size="large" 
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

          {devCode && (
            <Button type="dashed" onClick={handlePrefillCode} block>
              Prefill Code (Dev: {devCode})
            </Button>
          )}
        </Flex>
      </Form>
    </Card>
  )
}