import { Form, Input, Button, Typography, Checkbox } from 'antd'
import { changeConfirmPasswordRules as confirmPasswordRules, changePasswordRules as passwordRules } from "@/features/authentication/validations"
import { useChangePasswordForm } from "@/features/authentication/hooks"
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx'

const { Title, Text } = Typography

export default function ChangePasswordForm({ email, resetToken, onSubmit, isLoggedInFlow = false } = {}) {
  const { form, handleFinish, isSubmitting } = useChangePasswordForm({ email, resetToken, onSubmit })
  const navigate = useNavigate()
  const [passwordValue, setPasswordValue] = useState('')
  
  const isResetFlow = !!resetToken && !isLoggedInFlow
  
  const handlePasswordChange = (e) => {
    const value = e?.target?.value || ''
    setPasswordValue(value)
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          {isLoggedInFlow ? 'Set New Password' : (isResetFlow ? 'Reset Password' : 'Change Password')}
        </Title>
        <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
          {isLoggedInFlow 
            ? 'Create a strong password for your account.' 
            : (isResetFlow ? 'Please enter a new password for your account.' : 'Update your password to keep your account secure.')}
        </Text>
      </div>

      <Form name="changePassword" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        {!isResetFlow && !isLoggedInFlow && (
          <Form.Item 
            name="currentPassword" 
            label={<Text strong>Current Password</Text>}
            rules={[{ required: true, message: 'Please enter your current password' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password placeholder="Enter current password" variant="filled" style={{ padding: '10px 16px' }} />
          </Form.Item>
        )}
        
        <Form.Item 
          name="password" 
          label={<Text strong>New Password</Text>}
          rules={passwordRules}
          style={{ marginBottom: 24 }}
        >
          <Input.Password 
            placeholder="Enter new password" 
            variant="filled" 
            style={{ padding: '10px 16px' }}
            onChange={handlePasswordChange}
          />
        </Form.Item>
        
        {passwordValue && <PasswordStrengthIndicator value={passwordValue} />}
        
        <Form.Item 
          name="confirmPassword" 
          label={<Text strong>Confirm New Password</Text>}
          dependencies={['password']} 
          hasFeedback 
          rules={confirmPasswordRules}
          style={{ marginBottom: 32 }}
        >
          <Input.Password placeholder="Confirm new password" variant="filled" style={{ padding: '10px 16px' }} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            {isResetFlow ? 'Reset Password' : 'Update Password'}
          </Button>
        </Form.Item>
        
        {isResetFlow && (
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