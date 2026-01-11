// UserSignUpForm.jsx
import React from 'react'
import { Form, Input, Card, Flex, Button, Checkbox, Typography, Row, Col } from 'antd'
import { useNavigate } from 'react-router-dom'

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
  businessOwnerRequiredRules,
} from '@/features/authentication/validations'

import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from '@/shared/forms'

const { Title, Text, Paragraph } = Typography

export default function UserSignUpForm() {
  const navigate = useNavigate()

  // Signup flow hooks (keeps existing behavior)
  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useUserSignUpFlow()
  const { form, handleFinish, isSubmitting, prefillDemo } = useUserSignUp({
    onBegin: verifyEmail,
    onSubmit: console.log,
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

  const extraContent = (
    <Flex gap="small" align="center">
      <Button size="small" onClick={() => navigate('/')}>Home</Button>
      <Button size="small" type="link" onClick={() => navigate('/login')}>Login</Button>
      <Button size="small" onClick={prefillDemo}>Prefill Demo</Button>
    </Flex>
  )

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
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 12, fontWeight: 700, fontSize: 32 }}>Register</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Create your account to get started</Text>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        {extraContent}
      </div>

      <Form name="userSignUp" form={form} layout="vertical" onFinish={handleFinish} size="large" requiredMark={false}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="firstName" label={<Text strong>First Name</Text>} rules={firstNameRules} style={{ marginBottom: 24 }}>
              <Input placeholder="First name" variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lastName" label={<Text strong>Last Name</Text>} rules={lastNameRules} style={{ marginBottom: 24 }}>
              <Input placeholder="Last name" variant="filled" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="email" label={<Text strong>Email</Text>} rules={emailRules} style={{ marginBottom: 24 }}>
              <Input placeholder="Email address" variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phoneNumber" label={<Text strong>Phone Number</Text>} rules={phoneNumberRules} style={{ marginBottom: 24 }}>
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

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="password" label={<Text strong>Password</Text>} rules={passwordRules} style={{ marginBottom: 24 }}>
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
              style={{ marginBottom: 24 }}
            >
              <Input.Password placeholder="Confirm password" variant="filled" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="termsAndConditions" valuePropName="checked" rules={termsRules} style={{ marginBottom: 12 }}>
          <Checkbox>
            I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
          </Checkbox>
        </Form.Item>

        <Form.Item name="isBusinessOwner" valuePropName="checked" rules={businessOwnerRequiredRules} style={{ marginBottom: 12 }}>
          <Checkbox>Sign up as Business Owner</Checkbox>
        </Form.Item>

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0, textAlign: 'center' }}>
            By clicking "Send Verification Code", you agree to our <a href="/privacy">Privacy Policy</a>.
          </Paragraph>
        </div>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large">
            Send Verification Code
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, fontWeight: 600 }}>Login</Button>
        </div>
      </Form>
    </div>
  )
}
