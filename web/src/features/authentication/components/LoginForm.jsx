import React from 'react'
import { Form, Input, Button, Flex, Checkbox, Dropdown, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { loginEmailRules, loginPasswordRules } from "@/features/authentication/validations"
import { useLoginFlow } from "@/features/authentication/hooks"
import { LoginVerificationForm } from "@/features/authentication"
import TotpVerificationForm from '@/features/authentication/components/TotpVerificationForm.jsx'
import LockoutBanner from '@/features/authentication/components/LockoutBanner.jsx'
import PasskeyButton from './PasskeyButton.jsx'

const { Title, Text } = Typography

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
    prefillLguOfficer,
    prefillLguManager,
    prefillInspector,
    prefillCso,
    verificationProps,
    serverLockedUntil,
  } = useLoginFlow({ onSubmit })

  // State to manage readOnly hack for autofill prevention
  const [fieldsReadOnly, setFieldsReadOnly] = React.useState(true)
  // State to force form remounting (defeats browser bfcache/restoration)
  const [formKey, setFormKey] = React.useState(Date.now())

  // Aggressive clearing mechanism for back/forward navigation and refresh
  React.useEffect(() => {
    // Generate a new key to force React to discard the old DOM nodes
    // This is the most effective way to prevent browser restoration of old values
    setFormKey(Date.now())
    
    const clearFields = () => {
      setFieldsReadOnly(false) // Enable editing
      
      // If we have remember me values, use them
      if (initialValues && initialValues.email) {
        form.setFieldsValue(initialValues)
      } else {
        // Otherwise, nuclear option: force clear everything
        form.resetFields()
        form.setFieldsValue({ email: '', password: '' })
      }
    }

    // Run on mount
    const timer = setTimeout(clearFields, 50)

    // Run on page show (bfcache restoration)
    const handlePageShow = (event) => {
        if (event.persisted) {
            setFormKey(Date.now()) // Remount form
            setTimeout(clearFields, 50)
        }
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
        clearTimeout(timer)
        window.removeEventListener('pageshow', handlePageShow)
    }
  }, [form, initialValues])

  if (step === 'verify' || step === 'verify-totp') {
    const VerificationComponent = step === 'verify' ? LoginVerificationForm : TotpVerificationForm
    return <VerificationComponent {...verificationProps} />
  }

  // Show lockout banner above login form when server indicates account is locked
  const banner = serverLockedUntil ? <LockoutBanner lockedUntil={serverLockedUntil} /> : null

  return (
    <>
      {banner}
      <div>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ marginBottom: 12, fontWeight: 700, fontSize: 32 }}>Welcome Back</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Please enter your details to sign in</Text>
        </div>
        
        <Form key={formKey} name="login" form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues} size="large" requiredMark={false} autoComplete="off">
          <Form.Item
            name="email"
            label={<Text strong>Email</Text>}
            rules={loginEmailRules}
            style={{ marginBottom: 24 }}
          >
            <Input 
              placeholder="Enter your email" 
              variant="filled" 
              autoComplete="off" 
              readOnly={fieldsReadOnly}
              onFocus={() => setFieldsReadOnly(false)}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={<Text strong>Password</Text>}
            rules={loginPasswordRules}
            style={{ marginBottom: 24 }}
          >
            <Input.Password 
              placeholder="Enter your password" 
              variant="filled" 
              autoComplete="new-password"
              readOnly={fieldsReadOnly}
              onFocus={() => setFieldsReadOnly(false)}
            />
          </Form.Item>
          
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <Form.Item name="rememberMe" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0, color: '#001529' }} className="auth-link-hover">
              Forgot password?
            </Button>
          </Flex>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large">
              Sign in
            </Button>
          </Form.Item>

          <Flex justify="center" style={{ marginBottom: 24 }}>
             <PasskeyButton form={form} />
          </Flex>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Don't have an account? </Text>
            <Button type="link" onClick={() => navigate('/sign-up')} style={{ padding: 0, fontWeight: 600, color: '#001529' }} className="auth-link-hover">Sign up</Button>
          </div>
          {/* Dev Prefill Controls - Hidden in production */}
          {import.meta.env.MODE !== 'production' && (
             <div style={{ marginTop: 24, textAlign: 'center', opacity: 0.5 }}>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'admin', label: 'Prefill Admin' },
                      { key: 'business', label: 'Prefill Business Owner' },
                      { key: 'officer', label: 'Prefill LGU Officer' },
                      { key: 'manager', label: 'Prefill LGU Manager' },
                      { key: 'inspector', label: 'Prefill Inspector' },
                      { key: 'cso', label: 'Prefill CSO' },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'admin') prefillAdmin()
                      else if (key === 'business') prefillUser()
                      else if (key === 'officer') prefillLguOfficer()
                      else if (key === 'manager') prefillLguManager()
                      else if (key === 'inspector') prefillInspector()
                      else if (key === 'cso') prefillCso()
                    },
                  }}
                >
                  <Button type="text" size="small">Dev Tools</Button>
                </Dropdown>
             </div>
          )}
        </Form>
      </div>
    </>
  )
}
