import React from 'react'
import { Form, Input, Button, Flex, Checkbox, Dropdown, Typography, Grid, Alert, AutoComplete } from 'antd'
import { useNavigate } from 'react-router-dom'
import { loginEmailRules, loginPasswordRules } from "@/features/authentication/validations"
import { useLoginFlow, useRememberedEmail } from "@/features/authentication/hooks"
import { LoginVerificationForm } from "@/features/authentication"
import TotpVerificationForm from '@/features/authentication/views/components/TotpVerificationForm.jsx'
import LockoutBanner from '@/features/authentication/views/components/LockoutBanner.jsx'
import PasskeySignInOptions from './PasskeySignInOptions.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function LoginForm({ onSubmit } = {}) {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const {
    step,
    form,
    handleFinish,
    isSubmitting,
    prefillAdmin,
    prefillAdmin2,
    prefillAdmin3,
    prefillUser,
    prefillLguOfficer,
    prefillLguManager,
    prefillInspector,
    prefillCso,
    verificationProps,
    serverLockedUntil,
    mfaRequired,
    initialValues,
  } = useLoginFlow({ onSubmit })

  const { getRememberedEmails } = useRememberedEmail()
  const [emailOptions, setEmailOptions] = React.useState([])

  // Load remembered emails for autocomplete
  React.useEffect(() => {
    const emails = getRememberedEmails()
    setEmailOptions(emails.map(email => ({ value: email, label: email })))
  }, [getRememberedEmails])

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
      // Preserve rememberMe state if there's a remembered email, otherwise reset to false
      const preserveRememberMe = initialValues?.rememberMe === true
      form.resetFields()
      form.setFieldsValue({ 
        email: initialValues?.email || '', 
        password: '', 
        rememberMe: preserveRememberMe ? true : false 
      })
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

  // Listen for devtools-driven prefill events (global FAB)
  React.useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const preset = event?.detail?.preset
      const map = {
        admin: prefillAdmin,
        admin2: prefillAdmin2,
        admin3: prefillAdmin3,
        business: prefillUser,
        officer: prefillLguOfficer,
        manager: prefillLguManager,
        inspector: prefillInspector,
        cso: prefillCso,
      }
      const fn = map[preset]
      if (fn) {
        setFieldsReadOnly(false)
        fn()
      }
    }
    window.addEventListener('devtools:login-prefill', handler)
    return () => window.removeEventListener('devtools:login-prefill', handler)
  }, [prefillAdmin, prefillAdmin2, prefillAdmin3, prefillUser, prefillLguOfficer, prefillLguManager, prefillInspector, prefillCso])

  if (step === 'verify' || step === 'verify-totp') {
    const VerificationComponent = step === 'verify' ? LoginVerificationForm : TotpVerificationForm
    return <VerificationComponent {...verificationProps} />
  }

  // Show lockout banner above login form when server indicates account is locked
  const banner = serverLockedUntil ? <LockoutBanner lockedUntil={serverLockedUntil} /> : null
  const mfaBanner = mfaRequired ? (
    <Alert
      type="warning"
      showIcon
      message="Multi-factor authentication required"
      description={`${mfaRequired.message || 'Use a passkey or authenticator app to continue.'}${mfaRequired.allowedMethods ? ` (Allowed: ${mfaRequired.allowedMethods.join(', ')})` : ''}`}
      style={{ marginBottom: isMobile ? 18 : 24 }}
    />
  ) : null

  return (
    <>
      {banner}
      {mfaBanner}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Form key={formKey} name="login" form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues || { email: '', password: '', rememberMe: false }} size="default" requiredMark={false} autoComplete="off" style={{ maxWidth: '300px', width: '100%' }}>
          <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center' }}>Sign In with BizClear</Title>
          <Form.Item
            name="email"
            label="Email"
            rules={loginEmailRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <AutoComplete
              placeholder="Enter your email" 
              variant="filled" 
              autoComplete="off"
              options={emailOptions}
              filterOption={(inputValue, option) => {
                if (!inputValue || !option) return true
                const value = String(option.value || '').toLowerCase()
                const input = String(inputValue).toLowerCase()
                return value.includes(input)
              }}
              onSearch={(value) => {
                // Filter options based on search value
                const allEmails = getRememberedEmails()
                if (!value || value.trim() === '') {
                  setEmailOptions(allEmails.slice(0, 10).map(email => ({ value: email, label: email })))
                } else {
                  const filtered = allEmails.filter(email => 
                    String(email).toLowerCase().includes(String(value).toLowerCase())
                  )
                  setEmailOptions(filtered.slice(0, 10).map(email => ({ value: email, label: email })))
                }
              }}
              onSelect={(value) => {
                form.setFieldsValue({ email: value })
              }}
              onFocus={() => setFieldsReadOnly(false)}
              notFoundContent={null}
              data-test="login-email"
              data-testid="login-email"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={loginPasswordRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Input.Password 
              placeholder="Enter your password" 
              variant="filled" 
              autoComplete="new-password"
              readOnly={fieldsReadOnly}
              onFocus={() => setFieldsReadOnly(false)}
              data-test="login-password"
              data-testid="login-password"
            />
          </Form.Item>
          
          <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 20 : 24, flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="rememberMe" valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
              <Checkbox style={{ fontSize: isMobile ? 14 : undefined }} data-test="login-remember" data-testid="login-remember">Remember me</Checkbox>
            </Form.Item>
            <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0, color: '#001529', fontSize: isMobile ? 14 : undefined }} className="auth-link-hover" data-test="login-forgot" data-testid="login-forgot">
              Forgot password?
            </Button>
          </Flex>

          <Form.Item style={{ marginBottom: isMobile ? 20 : 24 }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="default" data-test="login-submit" data-testid="login-submit">
              Sign in
            </Button>
          </Form.Item>

          <Flex justify="center" style={{ marginBottom: isMobile ? 20 : 24 }}>
             <PasskeySignInOptions form={form} onAuthenticated={onSubmit} />
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
                      { key: 'admin2', label: 'Prefill Admin 2' },
                      { key: 'admin3', label: 'Prefill Admin 3' },
                      { key: 'business', label: 'Prefill Business Owner' },
                      { key: 'officer', label: 'Prefill LGU Officer' },
                      { key: 'manager', label: 'Prefill LGU Manager' },
                      { key: 'inspector', label: 'Prefill Inspector' },
                      { key: 'cso', label: 'Prefill CSO' },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'admin') prefillAdmin()
                      else if (key === 'admin2') prefillAdmin2()
                      else if (key === 'admin3') prefillAdmin3()
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
