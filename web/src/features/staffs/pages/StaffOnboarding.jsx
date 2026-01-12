import React from 'react'
import { Layout, Row, Col, Card, Form, Input, Button, Typography, Steps } from 'antd'
import { passwordRules, confirmPasswordRules } from '@/features/authentication/validations/changePasswordRules.js'
import { useStaffOnboarding } from '../hooks/useStaffOnboarding'

const { Title, Text } = Typography

export default function StaffOnboarding() {
  const {
    form,
    submitting,
    stepIndex,
    mustChange,
    mustMfa,
    currentUser,
    homePath,
    handleCredentialsFinish,
    navigate
  } = useStaffOnboarding()

  const usernameRules = [
    { required: true, message: 'Please enter a new username' },
    { pattern: /^[a-z0-9][a-z0-9._-]{2,39}$/, message: '3–40 chars: letters, numbers, dot, underscore, hyphen' },
  ]

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
