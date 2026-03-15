import React, { useState } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, Spin, Alert, theme } from 'antd'
import {
  SafetyCertificateOutlined,
  LockOutlined,
  CheckCircleOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons'
import { passwordRules, confirmPasswordRules } from '@/features/authentication/validations/changePasswordRules.js'
import MfaSetup from '@/features/authentication/components/MfaSetup.jsx'
import PasswordStrengthIndicator from '@/features/authentication/components/PasswordStrengthIndicator.jsx'

const { Title, Paragraph } = Typography

const LABELS = {
  admin: {
    welcomeTitle: 'Welcome, Administrator',
    welcomeMessage: 'Before accessing the admin dashboard, you need to complete your account setup:',
    completeMessage: 'Your account is ready. You can now access the admin dashboard.',
    completeButton: 'Go to Admin Dashboard',
  },
  staff: {
    welcomeTitle: 'Welcome, Staff',
    welcomeMessage: 'Before accessing the staff dashboard, you need to complete your account setup:',
    completeMessage: 'Your account is ready. You can now access the staff dashboard.',
    completeButton: 'Go to Staff Dashboard',
  },
}

/**
 * Shared onboarding step content for admin and staff.
 * Same flow: Welcome → Password → MFA → Complete. Only labels differ by variant.
 */
export default function OnboardingStepContent({
  variant = 'admin',
  currentStep,
  setCurrentStep,
  mustChange,
  mustMfa,
  currentUser,
  form,
  handleCredentialsFinish,
  submitting,
  checkingMfa,
  mfaEnabled,
  onComplete,
  passwordExpired = false,
}) {
  const { token } = theme.useToken()
  const [passwordValue, setPasswordValue] = useState('')
  const labels = LABELS[variant] || LABELS.admin

  // STEP 0: Welcome
  if (currentStep === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <SecurityScanOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 24 }} />
        <Title level={4}>{labels.welcomeTitle}</Title>
        <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 32 }}>
          {labels.welcomeMessage}
        </Paragraph>
        <Button type="primary" onClick={() => setCurrentStep(mustChange ? 1 : 2)} style={{ minWidth: 200 }}>
          Get Started
        </Button>
      </div>
    )
  }

  // STEP 1: Set new password (password only; username is derived server-side or from currentUser)
  if (currentStep === 1) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {passwordExpired && (
          <Alert
            type="warning"
            message="Password expired"
            description="Your password has expired (90-day policy). Please set a new, secure password."
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {passwordExpired
            ? 'Choose a new password that meets the security requirements below.'
            : 'Your temporary password was used to sign you in. Please set a new, secure password.'}
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={handleCredentialsFinish} autoComplete="off">
          <Form.Item name="password" label="New Password" rules={passwordRules}>
            <Input.Password 
              placeholder="Enter new password" 
              onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
            />
          </Form.Item>
          <PasswordStrengthIndicator value={passwordValue} />
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['password']}
            rules={confirmPasswordRules}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button type="primary" htmlType="submit"  block loading={submitting}>
              Set Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }

  // STEP 2: MFA Setup
  if (currentStep === 2) {
    if (checkingMfa) {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Spin tip="Checking MFA status..." />
          </div>
        </div>
      )
    }
    if (mfaEnabled) {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Alert
              type="success"
              message="MFA is already enabled"
              description="You can proceed."
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Button type="primary" onClick={() => setCurrentStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <MfaSetup embedded onComplete={() => setCurrentStep(3)} />
      </div>
    )
  }

  // STEP 3: Complete
  if (currentStep === 3) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 24 }} />
          <Title level={4}>Setup Complete!</Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 32 }}>
            {labels.completeMessage}
          </Paragraph>
          <Button type="primary" onClick={onComplete} style={{ minWidth: 200 }}>
            {labels.completeButton}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
