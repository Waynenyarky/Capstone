import { Form } from '@/shared/components/AppForm'
import { Button, Card, Input, Typography, Flex, Grid } from 'antd'
import { useTotpVerificationForm } from '@/features/authentication/hooks'
import React from 'react'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function TotpVerificationForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useTotpVerificationForm({ email, onSubmit })
  const cardTitle = title || 'MFA Verification'
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  return (
    <div 
      style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
      }}
      styles={{ body: { padding: isMobile ? 24 : 40 } }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
        <Title level={isMobile ? 4 : 2} style={{ marginBottom: isMobile ? 6 : 8, fontWeight: 700 }}>{cardTitle}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Enter the code from your authenticator app
        </Text>
      </div>

      <Form name="totpVerification" form={form} layout="vertical" onFinish={handleFinish} validateTrigger="onSubmit">
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the code' },
          ]}
          style={{ marginBottom: 32 }}
        >
          <div style={{ maxWidth: 320, margin: '0 auto' }}>
            <Input.OTP 
              length={6} 
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              inputType="numeric"
            mask={false}
            onChange={(value) => {
              const normalized = String(value ?? '').replace(/\D/g, '').slice(0, 6)
              form.setFieldsValue({ verificationCode: normalized })
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
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block >
            Verify
          </Button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Max attempts: 10 • Multiple failures may temporarily lock verification
            </Text>
          </div>
        </Flex>
      </Form>
    </div>
  )
}
