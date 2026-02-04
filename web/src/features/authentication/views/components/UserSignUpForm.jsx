// UserSignUpForm.jsx
import React, { useState } from 'react'
import { ConfigProvider, Form, Input, Card, Flex, Button, Checkbox, Typography, Row, Col, Grid } from 'antd'
import { useNavigate, Link } from 'react-router-dom'

import { useUserSignUp, useUserSignUpFlow } from '@/features/authentication/hooks'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx'
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
  const [passwordValue, setPasswordValue] = useState('')
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {extraContent && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 20 : 24 }}>
          {extraContent}
        </div>
      )}

        <Form name="userSignUp" form={form} layout="vertical" onFinish={handleFinish} size="default" requiredMark={false} style={{ maxWidth: '300px'}}>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20, textAlign: 'center' }}>Register An Account</Title>
            <Form.Item name="firstName" label="First Name" rules={firstNameRules}>
              <Input placeholder="First name" variant="filled" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={lastNameRules}>
              <Input placeholder="Last name" variant="filled" />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={emailRules}>
              <Input placeholder="Email address" variant="filled" />
            </Form.Item>
            <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules}>
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


            <Form.Item name="password" label="Password" rules={passwordRules}>
              <Input.Password
                placeholder="Create password"
                variant="filled"
                onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
              />
            </Form.Item>
            <PasswordStrengthIndicator value={passwordValue} />
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              hasFeedback
              rules={signUpConfirmPasswordRules}
              style={{ marginBottom: isMobile ? 20 : 24 }}
            >
              <Input.Password placeholder="Confirm password" variant="filled" />
            </Form.Item>

        <Form.Item name="termsAndConditions" valuePropName="checked" rules={termsRules} style={{ marginBottom: isMobile ? 20 : 24 }}>
          <Checkbox style={{ fontSize: isMobile ? 13 : undefined }}>
            I have read and agree to the <Link to="/terms" style={{ color: '#001529', textDecoration: 'underline'}}>Terms of Service</Link> and <Link to="/privacy" style={{ color: '#001529', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: isMobile ? 16 : 20 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="default">
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
