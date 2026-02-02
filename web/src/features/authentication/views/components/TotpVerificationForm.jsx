import { Form, Button, Card, Input, Typography, Flex } from 'antd'
import { useTotpVerificationForm } from '@/features/authentication/hooks'
import React from 'react'

const { Title, Text } = Typography

export default function TotpVerificationForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useTotpVerificationForm({ email, onSubmit })
  const cardTitle = title || 'MFA Verification'
  
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
          Enter the code from your authenticator app
        </Text>
      </div>

      <Form name="totpVerification" form={form} layout="vertical" onFinish={handleFinish} size="large">
        <Form.Item 
          name="verificationCode" 
          label={<Text strong>Authenticator Code</Text>}
          rules={[
            { required: true, message: 'Please enter the code' }
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

        <Flex vertical gap="middle">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Verify
          </Button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Max attempts: 10 • Multiple failures may temporarily lock verification
            </Text>
          </div>
        </Flex>
      </Form>
    </Card>
  )
}
