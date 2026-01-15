// UserSignUpForm.jsx
import React from 'react'
import { Form, Input, Card, Flex, Button, Checkbox, Typography, Row, Col, Grid } from 'antd'
import { useNavigate, Link } from 'react-router-dom'

import { useUserSignUp, useUserSignUpFlow } from '@/features/authentication/hooks'
import { SignUpVerificationForm } from '@/features/authentication'
import {
  emailRules,
  firstNameRules,
  lastNameRules,
  phoneNumberRules,
  signUpPasswordRules as passwordRules,
  signUpConfirmPasswordRules,
  termsRules,
} from '@/features/authentication/validations'

import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from '@/shared/forms'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function UserSignUpForm({ extraContent }) {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  // Signup flow hooks (direct signup with auto-login, skipping verification)
  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useUserSignUpFlow()
  const { form, handleFinish, isSubmitting } = useUserSignUp({
    onBegin: ({ email, serverData }) => {
      verifyEmail({ email, devCode: serverData?.devCode })
    },
    onSubmit: () => {
      // Do not auto-login. Navigate to login page so user can sign in manually.
      navigate('/login')
    },
  })

  if (step === 'verify') {
    return (
      <SignUpVerificationForm
        title="Verify Your Email"
        email={emailForVerify}
        devCode={devCodeForVerify}
        onSubmit={handleVerificationSubmit}
      />
    )
  }

  // Render verification step if required by the flow
  if (step === 'verify') {
    return (
      <SignUpVerificationForm
        title="Verify Your Email"
        email={emailForVerify}
        devCode={devCodeForVerify}
        onSubmit={handleVerificationSubmit}
      />
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 32 }}>
        <Title level={2} style={{ marginBottom: isMobile ? 6 : 8, fontWeight: 700, fontSize: isMobile ? 26 : undefined }}>Register</Title>
        <Text type="secondary" style={{ fontSize: isMobile ? 14 : 15 }}>Create your account to get started</Text>
      </div>
      {extraContent && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 20 : 24 }}>
          {extraContent}
        </div>
      )}

      <Form name="userSignUp" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        <Row gutter={isMobile ? 16 : 24}>
          <Col xs={24} md={12}>
            <Form.Item name="firstName" label={<Text strong>First Name</Text>} rules={firstNameRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
              <Input placeholder="First name" variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lastName" label={<Text strong>Last Name</Text>} rules={lastNameRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
              <Input placeholder="Last name" variant="filled" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? 16 : 24}>
          <Col xs={24} md={12}>
            <Form.Item name="email" label={<Text strong>Email</Text>} rules={emailRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
              <Input placeholder="Email address" variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phoneNumber" label={<Text strong>Phone Number</Text>} rules={phoneNumberRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
              <Input
                placeholder="Mobile number"
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={preventNonNumericKeyDown}
                onPaste={sanitizePhonePaste}
                onInput={sanitizePhoneInput}
                variant="filled"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? 16 : 24}>
          <Col xs={24} md={12}>
            <Form.Item name="password" label={<Text strong>Password</Text>} rules={passwordRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
              <Input.Password placeholder="Create password" variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="confirmPassword"
              label={<Text strong>Confirm Password</Text>}
              dependencies={["password"]}
              hasFeedback
              rules={signUpConfirmPasswordRules}
              style={{ marginBottom: isMobile ? 20 : 24 }}
            >
              <Input.Password placeholder="Confirm password" variant="filled" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="termsAndConditions" valuePropName="checked" rules={termsRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
          <Checkbox style={{ fontSize: isMobile ? 13 : undefined }}>
            I have read and agree to the <Link to="/terms" style={{ color: '#001529', textDecoration: 'underline', fontWeight: 600 }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: '#001529', textDecoration: 'underline', fontWeight: 600 }}>Privacy Policy</Link>.
          </Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: isMobile ? 16 : 20 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large">
            Continue
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontWeight: 600, color: '#001529' }} className="auth-link-hover">Login</Button>
        </div>
      </Form>
    </div>
  )
}
