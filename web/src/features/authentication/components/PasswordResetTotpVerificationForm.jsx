import React from 'react'
import { Form, Button, Typography, Input } from 'antd'
import { usePasswordResetTotpVerification } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function PasswordResetTotpVerificationForm({ email, onSubmit, onBack }) {
  const [form] = Form.useForm()
  const { isSubmitting, handleFinish } = usePasswordResetTotpVerification({ 
    email, 
    onSubmit,
    form 
  })

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Verify Your Identity</Title>
        <Text type="secondary">
          Enter the authentication code from your authenticator app to continue with password reset.
        </Text>
      </div>

      <Form form={form} size="default" layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="verificationCode"
          label="Authentication Code"
          rules={[
            { required: true, message: 'Please enter your authentication code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          getValueFromEvent={(val) => {
            if (typeof val === 'string') return val.replace(/\D/g, '').slice(0, 6)
            if (Array.isArray(val)) return val.join('').replace(/\D/g, '').slice(0, 6)
            return ''
          }}
        >
          <Input.OTP 
            length={6} 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
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
            Verify and Continue
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="text" onClick={onBack} style={{ padding: 0 }}>
            Back
          </Button>
        </div>
      </Form>
    </div>
  )
}
