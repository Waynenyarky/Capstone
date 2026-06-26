import { useState } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography, theme, Steps } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { CheckCircleOutlined, RocketOutlined, LockOutlined } from '@ant-design/icons'
import { passwordRules, confirmPasswordRules } from '@/features/authentication/utils/validations/changePasswordRules.js'
import MfaSetup from '@/features/authentication/mfa/components/MfaSetup.jsx'
import PasswordStrengthIndicator from '@/features/authentication/components/PasswordStrengthIndicator.jsx'

const { Title, Paragraph } = Typography

const LABELS = {
  admin: {
    welcomeTitle: (firstName) => `Welcome, ${firstName || 'Administrator'}`,
    welcomeMessage: 'To keep your account secure, we\'ll guide you through a quick setup. You\'ll set a new password and enable two-factor authentication (MFA) to protect your administrative access.',
    completeMessage: 'Your account is ready. You can now access the admin dashboard.',
    completeButton: 'Go to Admin Dashboard',
  },
  staff: {
    welcomeTitle: (firstName) => `Welcome, ${firstName || 'Staff'}`,
    welcomeMessage: 'To keep your account secure, we\'ll guide you through a quick setup. You\'ll set a new password and enable two-factor authentication (MFA) to protect your staff access.',
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
  form,
  handleCredentialsFinish,
  submitting,
  checkingMfa,
  mfaEnabled,
  onComplete,
  passwordExpired = false,
  onBack,
  currentUser,
  mode = 'onboarding', // 'onboarding' | 'password-expired' | 'mfa-only'
  onMfaSkip, // Callback when MFA is skipped (for business owners)
}) {
  const { token } = theme.useToken()
  const [passwordValue, setPasswordValue] = useState('')
  const labels = LABELS[variant] || LABELS.admin
  const firstName = currentUser?.firstName

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
    } else {
      window.history.back()
    }
  }

  const stepsItems = mode === 'password-expired'
    ? [
        { title: 'Password' },
        { title: 'Complete' },
      ]
    : mode === 'mfa-only'
    ? [
        { title: 'MFA' },
        { title: 'Complete' },
      ]
    : [
        { title: 'Welcome' },
        { title: 'Password' },
        { title: 'MFA' },
        { title: 'Complete' },
      ]

  const stepContent = (() => {
    // STEP 0: Welcome (only for onboarding mode)
    if (currentStep === 0 && mode === 'onboarding') {
      return (
        <>
          <div style={{ marginBottom: 24 }}>
            <RocketOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
          </div>
          <Title level={4}>{labels.welcomeTitle(firstName)}</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center' }}>
            {labels.welcomeMessage}
          </Paragraph>
          <Button type="primary" onClick={() => setCurrentStep(mustChange ? 1 : 2)} block style={{ marginTop: 16 }}>
            Get Started
          </Button>
        </>
      )
    }

    // STEP 0: Password expired welcome (for password-expired mode)
    if (currentStep === 0 && mode === 'password-expired') {
      return (
        <>
          <div style={{ marginBottom: 24 }}>
            <LockOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
          </div>
          <Title level={4}>Password Expired</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center' }}>
            Your password has expired (90-day policy). Please set a new password to continue.
          </Paragraph>
          <Button type="primary" onClick={() => setCurrentStep(1)} block style={{ marginTop: 16 }}>
            Continue
          </Button>
        </>
      )
    }

    // STEP 1: Set new password (password only; username is derived server-side or from currentUser)
    // Only show for onboarding and password-expired modes, not mfa-only
    if (currentStep === 1 && mode !== 'mfa-only') {
      return (
        <>
          <Title level={4}>{mode === 'password-expired' ? 'Change Your Password' : 'Set Your Own Password'}</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
            {mode === 'password-expired'
              ? 'Choose a new password that meets the security requirements below.'
              : 'Your temporary password was used to sign you in. Please set a new, secure password.'}
          </Paragraph>
          <div style={{ textAlign: 'left' }}>
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
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="text" onClick={handleBack}>
              Back
            </Button>
          </div>
        </>
      )
    }

    // STEP 2: MFA Setup (onboarding mode) or STEP 0: MFA Setup (mfa-only mode)
    if ((currentStep === 2 && mode === 'onboarding') || (currentStep === 0 && mode === 'mfa-only')) {
      if (checkingMfa) {
        return (
          <>
            <div style={{ padding: '48px 24px' }}>
              <LottieSpinner size="large" tip="Checking MFA status..." />
            </div>
            <div style={{ marginTop: 24 }}>
              <Button type="text" onClick={handleBack}>
                Back
              </Button>
            </div>
          </>
        )
      }
      if (mfaEnabled) {
        return (
          <>
            <div style={{ padding: '24px 0' }}>
              <Title level={4}>MFA Already Enabled</Title>
              <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                Your account already has two-factor authentication set up.
              </Paragraph>
              <Button type="primary" onClick={() => setCurrentStep(mode === 'mfa-only' ? 1 : 3)} block style={{ marginTop: 16 }}>
                Continue
              </Button>
            </div>
            <div style={{ marginTop: 24 }}>
              <Button type="text" onClick={handleBack}>
                Back
              </Button>
            </div>
          </>
        )
      }
      return (
        <>
          <MfaSetup
            onComplete={() => setCurrentStep(mode === 'mfa-only' ? 1 : 3)}
            onSkip={onMfaSkip}
            allowSkip={false}
          />
          <div style={{ marginTop: 24 }}>
            {mode === 'mfa-only' ? (
              <Button type="text" onClick={onMfaSkip}>
                Skip for now
              </Button>
            ) : (
              <Button type="text" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
        </>
      )
    }

    // STEP 3: Complete (onboarding mode) or STEP 2: Complete (password-expired mode) or STEP 1: Complete (mfa-only mode)
    if (currentStep === 3 || (currentStep === 2 && mode === 'password-expired') || (currentStep === 1 && mode === 'mfa-only')) {
      return (
        <>
          <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
            </div>
            <Title level={4}>{mode === 'password-expired' ? 'Password Updated!' : 'Setup Complete!'}</Title>
            <Button type="primary" onClick={onComplete} block style={{ marginTop: 16 }}>
              {labels.completeButton}
            </Button>
          </div>
        </>
      )
    }

    return null
  })()

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: '24px 0' }}>
      {mode !== 'password-expired' && mode !== 'mfa-only' && currentStep > 0 && currentStep < 3 && (
        <Steps
          type="inline"
          current={currentStep}
          items={stepsItems}
          style={{ marginBottom: 32 }}
        />
      )}
      {stepContent}
    </div>
  )
}
