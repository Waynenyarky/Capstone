import { useState } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, Result } from 'antd'
import { changePasswordRules, changeConfirmPasswordRules } from '@/features/authentication/validations'
import PasswordStrengthIndicator from '@/features/authentication/components/PasswordStrengthIndicator.jsx'
import { useLoggedInPasswordChangeFlow } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function LoggedInPasswordChangeFlow({ onBackToStart } = {}) {
  const { step, changeProps, reset } = useLoggedInPasswordChangeFlow()
  const [passwordForm] = Form.useForm()
  const [passwordValue, setPasswordValue] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const showBack = typeof onBackToStart === 'function'

  const onPasswordFinish = async (values) => {
    setSubmitting(true)
    try {
      await changeProps.onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'password') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 8 }}>Change Password</Title>
          <Text type="secondary">Enter your current password and choose a new one.</Text>
        </div>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={onPasswordFinish}
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password placeholder="Enter current password" variant="filled" />
          </Form.Item>
          <Form.Item name="password" label="New Password" rules={changePasswordRules}>
            <Input.Password
              placeholder="Enter new password"
              variant="filled"
              onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
            />
          </Form.Item>
          <PasswordStrengthIndicator value={passwordValue} />
          <Form.Item name="confirmPassword" label="Confirm New Password" dependencies={['password']} hasFeedback rules={changeConfirmPasswordRules}>
            <Input.Password placeholder="Confirm new password" variant="filled" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
              Change password
            </Button>
          </Form.Item>
          {showBack && (
            <div style={{ textAlign: 'center' }}>
              <Button type="text" onClick={onBackToStart} style={{ padding: 0 }}>
                Back
              </Button>
            </div>
          )}
        </Form>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <Result
          status="success"
          title="Password Changed Successfully"
          subTitle="Your password has been updated. You can now use your new password to log in."
          extra={[
            <Button type="primary" key="again" onClick={reset}>
              Change again
            </Button>,
          ]}
        />
      </div>
    )
  }

  return null
}
