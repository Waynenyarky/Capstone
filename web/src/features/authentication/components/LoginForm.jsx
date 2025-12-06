import { Form, Input, Button, Card, Flex, Checkbox, Dropdown } from 'antd'
import { loginEmailRules, loginPasswordRules } from "@/features/authentication/validations"
import { useLoginFlow } from "@/features/authentication/hooks"
import { LoginVerificationForm } from "@/features/authentication"
import React from 'react'
import { useNavigate } from 'react-router-dom'


export default function LoginForm({ onSubmit } = {}) {
  const navigate = useNavigate()
  const {
    step,
    form,
    handleFinish,
    isSubmitting,
    initialValues,
    prefillAdmin,
    prefillProvider,
    prefillCustomer,
    verificationProps,
  } = useLoginFlow({ onSubmit })

  if (step === 'verify') {
    return <LoginVerificationForm {...verificationProps} />
  }

  return (
    <Card title="Login" extra={(
      // Only show developer prefills in non-production modes
      import.meta.env.MODE !== 'production' ? (
        <Flex gap="small">
          <Dropdown
            menu={{
              items: [
                { key: 'admin', label: 'Admin' },
                { key: 'provider', label: 'Provider' },
                { key: 'customer', label: 'Customer' },
              ],
              onClick: ({ key }) => {
                if (key === 'admin') prefillAdmin()
                else if (key === 'provider') prefillProvider()
                else if (key === 'customer') prefillCustomer()
              },
            }}
            trigger={['click']}
          >
            <Button size="small" type="text">Prefill</Button>
          </Dropdown>
        </Flex>
      ) : null
    )}>
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
  )
}
