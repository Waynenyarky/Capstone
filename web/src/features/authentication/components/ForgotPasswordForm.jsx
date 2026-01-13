import { Form, Input, Button, Typography } from 'antd'
import { useForgotPasswordForm } from "@/features/authentication/hooks"
import { forgotPasswordEmailRules } from "@/features/authentication/validations"
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function ForgotPasswordForm({ onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useForgotPasswordForm({ onSubmit })
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={2} style={{ marginBottom: 16, fontWeight: 700, fontSize: 30 }}>Forgot Password?</Title>
        <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>
      </div>

      <Form name="forgotPassword" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        <Form.Item
          name="email"
          label={<Text strong>Email Address</Text>}
          rules={forgotPasswordEmailRules}
          style={{ marginBottom: 32 }}
        >
          <Input placeholder="name@example.com" variant="filled" style={{ padding: '10px 16px' }} />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Send Reset Code
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontWeight: 600, fontSize: 15, color: '#001529' }} className="auth-link-hover">
            Back to Login
          </Button>
        </div>
      </Form>
    </div>
  )
}