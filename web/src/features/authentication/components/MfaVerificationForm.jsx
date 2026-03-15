import React, { useState } from 'react'
import { Form, Input, Button, Typography, Alert } from 'antd'
import { useMfaVerificationForm } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function MfaVerificationForm({ email, onSubmit, warning, onBack }) {
  const [form] = Form.useForm()
  const { isSubmitting, handleFinish } = useMfaVerificationForm({ 
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
          name="code"
          label="Authentication Code"
          rules={[
            { required: true, message: 'Please enter your authentication code' },
            { len: 6, message: 'Authentication code must be 6 digits' },
            { pattern: /^\d+$/, message: 'Authentication code must contain only numbers' }
          ]}
        >
          <Input 
            placeholder="000000" 
            maxLength={6}
            style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
            autoComplete="one-time-code"
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
