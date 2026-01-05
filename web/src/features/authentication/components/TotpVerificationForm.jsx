import { Form, Button, Card } from 'antd'
import { useTotpVerificationForm } from '@/features/authentication/hooks'
import React from 'react'
import OtpInput from '@/features/authentication/components/OtpInput.jsx'
import { Typography } from 'antd'

export default function TotpVerificationForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useTotpVerificationForm({ email, onSubmit })
  const cardTitle = title || 'MFA Verification'
  return (
    <Card title={cardTitle}>
      <Form name="totpVerification" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="verificationCode" label="Authenticator Code" hasFeedback rules={[{ required: true, message: 'Enter the code' }] }>
          <OtpInput />
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <Typography.Text type="secondary">Max attempts: 10 • Multiple failures may temporarily lock verification</Typography.Text>
          <div>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Verify</Button>
          </div>
        </div>
      </Form>
    </Card>
  )
}
