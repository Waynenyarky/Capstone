import React from 'react'
import { Form, Button, Typography, Input } from 'antd'
import { useEmailChangeTotpVerification } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function EmailChangeTotpVerificationForm({ email, onSubmit, onBack }) {
  const [form] = Form.useForm()
  const { isSubmitting, handleFinish } = useEmailChangeTotpVerification({ 
    email, 
    onSubmit,
    form 
  })

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Verify Your Identity</Title>
        <Text type="secondary">
          Enter the authentication code from your authenticator app to continue with email change.
        </Text>
      </div>

      <Form form={form} size="default" layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="verificationCode"
          label="Authentication Code"
          rules={[
            { required: true, message: 'Please enter your authentication code' },
            { len: 6, message: 'Authentication code must be 6 digits' },
            { pattern: /^\d+$/, message: 'Authentication code must contain only numbers' }
          ]}
        >
          <div style={{ maxWidth: 320, margin: '0 auto' }}>
            <Input.OTP 
              length={6} 
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
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
          </div>
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
