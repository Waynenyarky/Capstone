import { Form, Input, Button, Card, Flex, Checkbox, Dropdown } from 'antd'
import { loginEmailRules, loginPasswordRules } from "@/features/authentication/validations"
import { useLoginFlow } from "@/features/authentication/hooks"
import { LoginVerificationForm } from "@/features/authentication"
import TotpVerificationForm from '@/features/authentication/components/TotpVerificationForm.jsx'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import LockoutBanner from '@/features/authentication/components/LockoutBanner.jsx'


export default function LoginForm({ onSubmit } = {}) {
  const navigate = useNavigate()
  const {
    step,
    form,
    handleFinish,
    isSubmitting,
    initialValues,
    prefillAdmin,
    prefillUser,
    verificationProps,
    serverLockedUntil,
  } = useLoginFlow({ onSubmit })

  if (step === 'verify' || step === 'verify-totp') {
    const VerificationComponent = step === 'verify' ? LoginVerificationForm : TotpVerificationForm
    return <VerificationComponent {...verificationProps} />
  }

  // Show lockout banner above login form when server indicates account is locked
  const banner = serverLockedUntil ? <LockoutBanner lockedUntil={serverLockedUntil} /> : null

  const extraContent = (
    <Flex gap="small" align="center">
      <Button size="small" onClick={() => navigate('/')}>Home</Button>
      <Button size="small" type="link" onClick={() => navigate('/sign-up')}>Sign Up</Button>
      {import.meta.env.MODE !== 'production' ? (
        <Dropdown
          menu={{
            items: [
              { key: 'admin', label: 'Admin' },
              { key: 'user', label: 'User' },
            ],
            onClick: ({ key }) => {
              if (key === 'admin') prefillAdmin()
              else if (key === 'user') prefillUser()
            },
          }}
          trigger={['click']}
        >
          <Button size="small" type="text">Prefill</Button>
        </Dropdown>
      ) : null}
    </Flex>
  )

  return (
    <>
      {banner}
      <Card title="Login" extra={extraContent}>
      <Form name="login" form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues}>
        <Form.Item
          name="email"
          label="Email"
          rules={loginEmailRules}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={loginPasswordRules}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item name="rememberMe" valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="link" onClick={() => navigate('/forgot-password')}>Forgot password?</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Continue</Button>
        </Flex>
      </Form>
      </Card>
    </>
  )
}
