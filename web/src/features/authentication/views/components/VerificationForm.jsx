import { Form, Input, Button, Typography } from 'antd'
import { useVerificationForm } from "@/features/authentication/hooks"
import React from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function VerificationForm({ email, onSubmit, title, isLoggedInFlow = false } = {}) {
  const { form, handleFinish, isSubmitting } = useVerificationForm({ email, onSubmit })
  const navigate = useNavigate()
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>{title || 'Verify Code'}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
           Enter the 6-digit code sent to <br/>
           <Text strong style={{ color: '#003a70' }}>{email}</Text>
        </Text>
      </div>

      <Form name="verification" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input.OTP 
              size="large" 
              length={6} 
              style={{ width: '100%' }}
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
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Verify
          </Button>
        </Form.Item>

        {!isLoggedInFlow && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontWeight: 600, fontSize: 15 }}>
              Back to Login
            </Button>
          </div>
        )}
      </Form>
    </div>
  )
}