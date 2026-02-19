import { Form, Input, Button, Typography, Flex, Grid } from 'antd'
import { useVerificationForm } from "@/features/authentication/hooks"
import React from 'react'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function VerificationForm({
  email,
  onSubmit,
  title,
  isLoggedInFlow = false,
  onResend,
  isResending,
  isCooling,
  remaining,
  onBack,
} = {}) {
  const { form, handleFinish, isSubmitting } = useVerificationForm({ email, onSubmit })
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const showResend = typeof onResend === 'function'
  const showBack = typeof onBack === 'function'

  return (
    <div style={{ maxWidth: 300, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 12 : 16 }}>
          {title || 'Verify Code'}
        </Title>
        <Text type="secondary">
          Enter the 6-digit code sent to <Text strong>{email}</Text>
        </Text>
      </div>

      <Form name="verification" form={form} size="default" layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          name="verificationCode"
          rules={[{ required: true, message: 'Please enter the verification code' }]}
          style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Input.OTP
              size="default"
              length={6}
              style={{ width: '100%' }}
              inputType="numeric"
              mask={false}
              onChange={(value) => form.setFieldsValue({ verificationCode: value })}
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
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
            Verify
          </Button>
        </Form.Item>

        {showResend && (
          <Flex justify="center" style={{ marginBottom: 8 }}>
            <Button
              type="link"
              onClick={onResend}
              loading={isResending}
              disabled={isCooling || isResending}
              style={{ padding: 0, height: 'auto' }}
            >
              {isCooling ? `Resend code in ${remaining}s` : 'Resend code'}
            </Button>
          </Flex>
        )}
      </Form>

      {showBack && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="text" onClick={onBack} style={{ padding: 0 }}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}