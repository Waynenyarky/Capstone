import { Form, Input, Button, Typography } from 'antd'
import { useVerificationForm } from "@/features/authentication/hooks"
import React from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function VerificationForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerificationForm({ email, onSubmit })
  const navigate = useNavigate()
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={2} style={{ marginBottom: 16, fontWeight: 700, fontSize: 30 }}>{title || 'Verify Code'}</Title>
        <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
           Enter the 6-digit code sent to <br/>
           <Text strong style={{ color: '#003a70' }}>{email}</Text>
        </Text>
      </div>

      <Form name="verification" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        <Form.Item 
          name="verificationCode" 
          rules={[{ required: true, message: 'Please enter the verification code' }]}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
             <Input.OTP size="large" length={6} style={{ width: '100%' }} />
          </div>
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Verify Account
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontWeight: 600, fontSize: 15 }}>
            Back to Login
          </Button>
        </div>
      </Form>
    </div>
  )
}