// UserSignUpForm.jsx
import React from 'react'
import { Form, Input, Card, Flex, Button, Checkbox, Typography } from 'antd'
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
} from '@/features/authentication/validations'

import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from '@/shared/forms'

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

  const navButtonStyle = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#bfc6ff',
    padding: '4px 10px',
    borderRadius: 6,
  }

  const linkButtonStyle = {
    color: '#9bd1ff',
    padding: '4px 8px',
  }

  const demoButtonStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.04)',
    color: '#dfe8ff',
    padding: '4px 10px',
    borderRadius: 6,
  }

  const extraContent = (
    <Flex gap="small" align="center">
      <Button size="small" onClick={() => navigate('/')} style={navButtonStyle} aria-label="Home">Home</Button>
      <Button size="small" type="link" onClick={() => navigate('/login')} style={linkButtonStyle} aria-label="Login">Login</Button>
      <Button size="small" onClick={prefillDemo} style={demoButtonStyle} aria-label="Prefill Demo">Prefill Demo</Button>
    </Flex>
  )

  // Styles
  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#ffffff',
    borderRadius: 6,
    paddingLeft: 12,
  }

  const labelStyle = { color: '#c9d0ff', fontWeight: 600 }

  const sendButtonStyle = {
    backgroundColor: '#9bd1ff',
    borderColor: '#9bd1ff',
    color: '#071033',
    fontWeight: 700,
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
    <Card
      extra={extraContent}
      style={{ background: 'transparent', border: 'none' }}
      bodyStyle={{ background: 'rgba(10,8,24,0.6)', borderRadius: 8, padding: 16 }}
    >
      {/* Placeholder styles for inputs (ensure Password placeholders are white too) */}
      <style>{`
        .bizclear-input::placeholder,
        .bizclear-input input::placeholder,
        .ant-input::placeholder,
        .ant-input input::placeholder,
        .ant-input-password input::placeholder {
          color: #ffffff !important;
          opacity: 1;
        }
        .bizclear-input::-webkit-input-placeholder,
        .bizclear-input input::-webkit-input-placeholder,
        .ant-input::-webkit-input-placeholder,
        .ant-input input::-webkit-input-placeholder,
        .ant-input-password input::-webkit-input-placeholder {
          color: #ffffff !important;
        }
        .bizclear-input:-ms-input-placeholder,
        .bizclear-input input:-ms-input-placeholder,
        .ant-input:-ms-input-placeholder,
        .ant-input input:-ms-input-placeholder,
        .ant-input-password input:-ms-input-placeholder {
          color: #ffffff !important;
        }
        .bizclear-input::-ms-input-placeholder,
        .bizclear-input input::-ms-input-placeholder,
        .ant-input::-ms-input-placeholder,
        .ant-input input::-ms-input-placeholder,
        .ant-input-password input::-ms-input-placeholder {
          color: #ffffff !important;
        }
      `}</style>
      <Form name="userSignUp" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="firstName" label={<span style={labelStyle}></span>} rules={firstNameRules}>
          <Input placeholder="First name" style={inputStyle} className="bizclear-input" />
        </Form.Item>

        <Form.Item name="lastName" label={<span style={labelStyle}></span>} rules={lastNameRules}>
          <Input placeholder="Last name" style={inputStyle} className="bizclear-input" />
        </Form.Item>

        <Form.Item name="email" label={<span style={labelStyle}></span>} rules={emailRules}>
          <Input placeholder="Email" style={inputStyle} className="bizclear-input" />
        </Form.Item>

        <Form.Item name="phoneNumber" label={<span style={labelStyle}></span>} rules={phoneNumberRules}>
          <Input
            placeholder="Phone Number"
            inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={preventNonNumericKeyDown}
            onPaste={sanitizePhonePaste}
            onInput={sanitizePhoneInput}
            style={inputStyle}
            className="bizclear-input"
          />
        </Form.Item>

        <Form.Item name="password" label={<span style={labelStyle}>Password</span>} rules={passwordRules}>
          <Input.Password placeholder="Password" style={inputStyle} className="bizclear-input" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={<span style={labelStyle}>Confirm Password</span>}
          dependencies={["password"]}
          hasFeedback
          rules={signUpConfirmPasswordRules}
        >
          <Input.Password placeholder="Confirm password" style={inputStyle} className="bizclear-input" />
        </Form.Item>

        <Form.Item name="termsAndConditions" valuePropName="checked" rules={termsRules} style={{ marginBottom: 12 }}>
          <Checkbox style={{ color: '#c9d0ff' }}>Accept Terms and Conditions</Checkbox>
        </Form.Item>

        <Form.Item name="isBusinessOwner" valuePropName="checked" style={{ marginBottom: 12 }}>
          <Checkbox style={{ color: '#c9d0ff' }}>Sign up as Business Owner</Checkbox>
        </Form.Item>

        <div style={{ marginTop: 8, marginBottom: 10 }}>
          <Typography.Paragraph style={{ color: '#bfc6ff', fontSize: 12, marginBottom: 10 }}>
            In accordance with our <a href="/privacy" style={{ color: '#9bd1ff' }}>Privacy Policy</a> you may be contacted about BizClear or related products and services. You can unsubscribe at any time by visiting our <a href="/preferences" style={{ color: '#9bd1ff' }}>Preference Center</a>.
          </Typography.Paragraph>
        </div>

        <Flex justify="end">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} style={sendButtonStyle}>
            Send Verification Code
          </Button>
        </Flex>
      </Form>
    </Card>
  )
}
