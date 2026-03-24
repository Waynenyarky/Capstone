import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, Flex, Grid } from 'antd'
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
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          style={{ marginBottom: 24 }}
          getValueFromEvent={(val) => {
            if (typeof val === 'string') return val.replace(/\D/g, '').slice(0, 6)
            if (Array.isArray(val)) return val.join('').replace(/\D/g, '').slice(0, 6)
            return ''
          }}
        >
          <Input.OTP
            size="default"
            length={6}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            inputType="numeric"
            mask={false}
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