import React from 'react'
import { Layout, Row, Col, Card, Form, Input, Button, Typography, Steps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import { firstLoginChangeCredentials } from '@/features/authentication/services/authService.js'
import { passwordRules, confirmPasswordRules } from '@/features/authentication/validations/changePasswordRules.js'
import { useNotifier } from '@/shared/notifications'

const { Title, Text } = Typography

export default function StaffOnboarding() {
  const navigate = useNavigate()
  const { currentUser, role, login } = useAuthSession()
  const { success, error } = useNotifier()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = React.useState(false)

  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleKey)
  const mustChange = !!currentUser?.mustChangeCredentials
  const mustMfa = !!currentUser?.mustSetupMfa
  const homePath = '/staff'

  React.useEffect(() => {
    if (!currentUser?.token) return
    if (!isStaffRole) {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [currentUser, isStaffRole, navigate])

  const stepKey = mustChange ? 'credentials' : (mustMfa ? 'mfa' : 'done')
  const stepIndex = stepKey === 'credentials' ? 0 : (stepKey === 'mfa' ? 1 : 2)

  const usernameRules = [
    { required: true, message: 'Please enter a new username' },
    { pattern: /^[a-z0-9][a-z0-9._-]{2,39}$/, message: '3–40 chars: letters, numbers, dot, underscore, hyphen' },
  ]

  const handleCredentialsFinish = async (values) => {
    try {
      setSubmitting(true)
      const res = await firstLoginChangeCredentials({
        newPassword: values.password,
        newUsername: values.username,
      })
      const updated = res?.user
      if (updated && typeof updated === 'object') {
        const raw = localStorage.getItem('auth__currentUser')
        const remember = !!raw
        const merged = { ...currentUser, ...updated }
        login(merged, { remember })
      }
      form.resetFields()
      success('Credentials updated')
      navigate('/mfa/setup', { replace: true })
    } catch (e) {
      console.error('First login change credentials error:', e)
      error(e, 'Failed to update credentials')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col style={{ width: 560, maxWidth: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>Staff Account Setup</Title>
              <Text type="secondary">Complete required steps to activate your staff account.</Text>
            </div>

            <Card styles={{ body: { padding: 20 } }}>
              <Steps
                current={stepIndex}
                items={[
                  { title: 'Change Credentials' },
                  { title: 'Set Up MFA' },
                  { title: 'Account Active' },
                ]}
              />

              {mustChange ? (
                <div style={{ marginTop: 20 }}>
                  <Form form={form} layout="vertical" onFinish={handleCredentialsFinish}>
                    <Form.Item name="username" label="New Username" rules={usernameRules}>
                      <Input autoComplete="username" />
                    </Form.Item>

                    <Form.Item name="password" label="New Password" rules={passwordRules}>
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item name="confirmPassword" label="Confirm New Password" dependencies={['password']} hasFeedback rules={confirmPasswordRules}>
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting} block>
                      Save and Continue
                    </Button>
                  </Form>
                </div>
              ) : mustMfa ? (
                <div style={{ marginTop: 20 }}>
                  <Text type="secondary">Multi-factor authentication is required for staff accounts.</Text>
                  <div style={{ marginTop: 12 }}>
                    <Button type="primary" onClick={() => navigate('/mfa/setup', { replace: true })} block>
                      Set Up MFA Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <Text type="secondary">{`Welcome${currentUser?.firstName ? `, ${currentUser.firstName}` : ''}. Your account is active.`}</Text>
                  <div style={{ marginTop: 12 }}>
                    <Button type="primary" onClick={() => navigate(homePath, { replace: true })} block>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
