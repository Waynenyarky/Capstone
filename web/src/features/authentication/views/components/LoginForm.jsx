import React from 'react'
import { Form, Input, Button, Flex, Checkbox, Dropdown, Typography, Grid, Alert, AutoComplete, Modal, List, Popconfirm, Space, App } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
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

  const { getRememberedEmails, getAllRememberedEmailsWithDetails, clearRememberedEmail } = useRememberedEmail()
  const { modal, message } = App.useApp()
  const [emailOptions, setEmailOptions] = React.useState([])
  const [manageEmailsVisible, setManageEmailsVisible] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0) // Force re-render of modal list

  // Load remembered emails for autocomplete
  React.useEffect(() => {
    const emails = getRememberedEmails()
    setEmailOptions(emails.map(email => ({ value: email, label: email })))
  }, [getRememberedEmails, refreshKey])

  // Handle delete email with confirmation
  const handleDeleteEmail = React.useCallback((email) => {
    Modal.confirm({
      title: 'Delete Remembered Email?',
      content: `Are you sure you want to remove "${email}" from your remembered accounts? You will need to enter it manually next time.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        clearRememberedEmail(email)
        message.success('Email removed from remembered accounts')
        // Force refresh of email list and options
        setRefreshKey(prev => prev + 1)
        // Refresh email options
        setTimeout(() => {
          const emails = getRememberedEmails()
          setEmailOptions(emails.map(e => ({ value: e, label: e })))
          // Close modal if no emails left
          if (emails.length === 0) {
            setManageEmailsVisible(false)
          }
        }, 100)
      },
    })
  }, [clearRememberedEmail, getRememberedEmails, message])

  // Handle clear all emails with confirmation
  const handleClearAllEmails = React.useCallback(() => {
    Modal.confirm({
      title: 'Clear All Remembered Emails?',
      content: 'Are you sure you want to remove all remembered email addresses? This action cannot be undone.',
      okText: 'Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        clearRememberedEmail()
        message.success('All remembered emails cleared')
        setEmailOptions([])
        setRefreshKey(prev => prev + 1)
        setManageEmailsVisible(false)
      },
    })
  }, [clearRememberedEmail, message])

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
      <div style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 32 }}>
          <Title level={2} style={{ marginBottom: isMobile ? 6 : 8, fontWeight: 700, fontSize: isMobile ? 26 : undefined }}>Welcome Back</Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 14 : 15 }}>Please enter your details to sign in</Text>
        </div>
        
        <Form key={formKey} name="login" form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues || { email: '', password: '', rememberMe: false }} size="large" requiredMark={false} autoComplete="off">
          <Form.Item
            name="email"
            label={<Text strong>Email</Text>}
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
            label={<Text strong>Password</Text>}
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
            <Flex align="center" gap={8}>
              <Form.Item name="rememberMe" valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
                <Checkbox style={{ fontSize: isMobile ? 14 : undefined }} data-test="login-remember" data-testid="login-remember">Remember me</Checkbox>
              </Form.Item>
              {getRememberedEmails().length > 0 && (
                <Button 
                  type="link" 
                  onClick={() => setManageEmailsVisible(true)}
                  style={{ padding: 0, fontSize: isMobile ? 12 : 13, color: '#8c8c8c' }}
                  className="auth-link-hover"
                  data-test="manage-emails"
                >
                  Manage ({getRememberedEmails().length})
                </Button>
              )}
            </Flex>
            <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0, color: '#001529', fontSize: isMobile ? 14 : undefined }} className="auth-link-hover" data-test="login-forgot" data-testid="login-forgot">
              Forgot password?
            </Button>
          </Flex>

          <Form.Item style={{ marginBottom: isMobile ? 20 : 24 }}>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" data-test="login-submit" data-testid="login-submit">
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

        {/* Manage Remembered Emails Modal */}
        <Modal
          title="Manage Remembered Accounts"
          open={manageEmailsVisible}
          onCancel={() => setManageEmailsVisible(false)}
          footer={[
            <Button key="clear-all" danger onClick={handleClearAllEmails} disabled={getRememberedEmails().length === 0}>
              Clear All
            </Button>,
            <Button key="close" type="primary" onClick={() => setManageEmailsVisible(false)}>
              Close
            </Button>,
          ]}
          width={isMobile ? '90%' : 500}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              These email addresses are stored locally in your browser for faster login. You can remove individual accounts or clear all.
            </Text>
          </div>
          <List
            key={refreshKey}
            dataSource={getAllRememberedEmailsWithDetails()}
            locale={{ emptyText: 'No remembered emails' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm
                    title="Delete this email?"
                    description={`Remove "${item.email}" from remembered accounts?`}
                    onConfirm={() => handleDeleteEmail(item.email)}
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel"
                    key="delete"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      size="small"
                      aria-label={`Delete ${item.email}`}
                    >
                      Remove
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.email}</Text>
                      {item.lastLogin && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          (Last used: {new Date(item.lastLogin).toLocaleDateString()})
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Modal>
      </div>
    </>
  )
}
