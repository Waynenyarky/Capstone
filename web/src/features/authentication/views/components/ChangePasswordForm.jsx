import { Form, Input, Button, Typography, Space, Alert } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { changeConfirmPasswordRules as confirmPasswordRules, changePasswordRules as passwordRules } from "@/features/authentication/validations"
import { useChangePasswordForm } from "@/features/authentication/hooks"
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx'

const { Title, Text } = Typography

export default function ChangePasswordForm({ email, resetToken, onSubmit, isLoggedInFlow = false } = {}) {
  const { form, handleFinish, isSubmitting, step, otpSent, handleResendCode } = useChangePasswordForm({ email, resetToken, onSubmit, isLoggedInFlow })
  const navigate = useNavigate()
  const [passwordValue, setPasswordValue] = useState('')
  
  const isResetFlow = !!resetToken && !isLoggedInFlow
  const isOtpFlow = !isResetFlow && (isLoggedInFlow || !resetToken) // Use OTP for logged-in users
  
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

      {isOtpFlow && otpSent && (
        <Alert
          message="Verification Code Sent"
          description={
            <Space direction="vertical" size={4}>
              <Text>A verification code has been sent to your email address.</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Please check your inbox and enter the code below to complete the password change.
              </Text>
            </Space>
          }
          type="info"
          icon={<MailOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button type="link" size="small" onClick={handleResendCode}>
              Resend
            </Button>
          }
        />
      )}

      <Form name="changePassword" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        {/* Step 1: Password fields (shown when step is 'password' or in reset flow) */}
        {(step === 'password' || isResetFlow) && (
          <>
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
                disabled={isOtpFlow && otpSent}
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
              <Input.Password 
                placeholder="Confirm new password" 
                variant="filled" 
                style={{ padding: '10px 16px' }}
                disabled={isOtpFlow && otpSent}
              />
            </Form.Item>
          </>
        )}

        {/* Step 2: OTP verification (shown when step is 'verify' and OTP was sent) */}
        {isOtpFlow && step === 'verify' && otpSent && (
          <Form.Item 
            name="verificationCode" 
            label={<Text strong>Verification Code</Text>}
            rules={[
              { required: true, message: 'Please enter the verification code' },
              { pattern: /^[0-9]{6}$/, message: 'Please enter a valid 6-digit code' }
            ]}
            style={{ marginBottom: 32 }}
          >
            <Input 
              placeholder="Enter 6-digit code" 
              variant="filled" 
              style={{ padding: '10px 16px' }}
              maxLength={6}
            />
          </Form.Item>
        )}

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            {isResetFlow 
              ? 'Reset Password' 
              : (step === 'verify' ? 'Verify & Change Password' : 'Send Verification Code')}
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