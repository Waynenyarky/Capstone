import React from 'react'
import { Form, Input, Button, Alert, Card } from 'antd'
import useAdminLogin from '@/features/authentication/hooks/useAdminLogin.js'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginForm() {
  const navigate = useNavigate()
  const [credForm] = Form.useForm()
  const [verifyForm] = Form.useForm()

  const {
    step,
    setStep,
    devCode,
    loading,
    error,
    cooldown,
    serverLockRemaining,
    handleCredentials,
    handleResend,
    handleVerify,
    setPassword,
  } = useAdminLogin({ onSuccess: () => navigate('/admin') })

  if (step === 'verify') {
    return (
      <Card title="Admin sign in">
        <Form layout="vertical" form={verifyForm} onFinish={handleVerify} initialValues={{ code: devCode }}>
          <Form.Item name="code" label="Verification Code" rules={[{ required: true, message: 'Enter the code' }]}>
            <Input />
          </Form.Item>
          {devCode && (
            <Alert type="info" message={`Dev code (non-production): ${devCode}`} style={{ marginBottom: 12 }} />
          )}
          {serverLockRemaining > 0 && (
            <Alert type="warning" message={`Account locked — try again in ${serverLockRemaining}s`} style={{ marginBottom: 12 }} />
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Verify and sign in
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="default"
              onClick={() => { setStep('credentials'); try { credForm.resetFields(); setPassword('') } catch { /* ignore */ } }}
              block
            >
              Back
            </Button>
          </Form.Item>
          <Form.Item>
            <Button type="link" onClick={handleResend} disabled={loading || cooldown > 0} block>
              {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification code'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    )
  }

  return (
    <Card title="Admin sign in">
      <Form layout="vertical" form={credForm} onFinish={handleCredentials}>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Enter email' }, { type: 'email', message: 'Enter a valid email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter password' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block disabled={serverLockRemaining > 0}>
            {serverLockRemaining > 0 ? `Locked — try in ${serverLockRemaining}s` : 'Send verification code'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
   )
}
