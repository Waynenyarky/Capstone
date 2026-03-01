import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, Alert, Grid } from 'antd'
import { useForgotPasswordForm } from "@/features/authentication/hooks"
import { forgotPasswordEmailRules } from "@/features/authentication/validations"
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function ForgotPasswordForm({ onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useForgotPasswordForm({ onSubmit })
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div style={{ maxWidth: 300, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 12 : 16 }}>Forgot Password?</Title>
        <Text type="secondary">
          Enter your email address and we'll send you a code to reset your password.
        </Text>
      </div>

      <Form name="forgotPassword" form={form} size="default" layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          name="email"
          label="Email Address"
          rules={forgotPasswordEmailRules}
        >
          <Input placeholder="name@example.com" variant="filled" />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
            Send Reset Link
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="text" onClick={() => navigate('/login')} style={{ padding: 0 }}>
            Back to Login
          </Button>
        </div>
      </Form>
    </div>
  )
}