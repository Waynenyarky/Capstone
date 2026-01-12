import { Form, Input, Button, Typography } from 'antd'
import { useVerifyDeleteAccountCode } from "@/features/authentication/hooks"

const { Title, Text } = Typography

export default function VerifyDeleteCodeForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyDeleteAccountCode({ email, onSubmit })
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>{title || 'Verify Identity'}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
           Enter the 6-digit code sent to <br/>
           <Text strong style={{ color: '#ff4d4f' }}>{email}</Text>
        </Text>
      </div>

      <Form name="verifyDelete" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
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
          <Button 
            type="primary" 
            danger
            htmlType="submit" 
            loading={isSubmitting} 
            disabled={isSubmitting} 
            block 
            size="large" 
            style={{ height: 48, fontSize: 16 }}
          >
            Verify & Continue
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}