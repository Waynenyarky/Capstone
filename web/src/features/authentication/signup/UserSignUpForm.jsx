// UserSignUpForm.jsx — Two-step signup: Account info → PIS fields
import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Checkbox, Typography, Row, Col, Grid, Select, DatePicker, Divider, message, theme } from 'antd'
import { useNavigate, Link } from 'react-router-dom'

import { useUserSignUp, useUserSignUpFlow, useMaintenanceStatus, useResendSignupCode } from '@/features/authentication/hooks'
import PasswordStrengthIndicator from '@/features/authentication/components/PasswordStrengthIndicator.jsx'
import VerificationForm from '@/features/authentication/components/VerificationForm.jsx'
import {
  emailRules,
  firstNameRules,
  lastNameRules,
  middleNameRules,
  suffixRules,
  phoneNumberRules,
  signUpPasswordRules as passwordRules,
  signUpConfirmPasswordRules,
  termsRules,
} from '@/features/authentication/utils/validations'
import {
  pisSexRules,
  pisMaritalStatusRules,
  pisDateOfBirthRules,
  pisPlaceOfBirthRules,
  pisNationalityRules,
  pisFatherNameRules,
  pisMotherNameRules,
  pisEducationRules,
} from '@/features/authentication/utils/validations/pisRules'

import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from '@/shared/forms'
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'
import TurnstileWidget from '@/features/authentication/components/TurnstileWidget.jsx'
import { usePasswordStrength } from '../utils/signup/usePasswordStrength.js'
import { useStepNavigation } from '../utils/signup/useStepNavigation.js'
import { useDemoDataPrefill } from '../utils/signup/useDemoDataPrefill.js'

const { Title, Text } = Typography
const { useBreakpoint } = Grid
const { useToken } = theme

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
]

const EDUCATION_OPTIONS = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'high_school', label: 'High School' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'college', label: 'College' },
  { value: 'postgraduate', label: 'Postgraduate' },
]

export default function UserSignUpForm({ extraContent }) {
  const { token } = useToken()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const turnstileRef = React.useRef(null)
  const turnstileSiteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) || ''
  const maintenance = useMaintenanceStatus()

  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useUserSignUpFlow()
  const resendHook = useResendSignupCode({ email: emailForVerify, cooldownSec: 60 })
  const { form, handleFinish, isSubmitting } = useUserSignUp({
    getCaptchaToken: turnstileSiteKey ? () => turnstileRef.current?.getToken?.() ?? '' : undefined,
    onBegin: ({ email, serverData }) => {
      verifyEmail({ email, devCode: serverData?.devCode })
    },
    onSubmit: () => {
      navigate('/login')
    },
  })

  const { passwordValue, setPasswordValue } = usePasswordStrength('')
  const { currentStep, handleNextStep, handlePreviousStep } = useStepNavigation(form)

  const showPrefillButton = import.meta.env.DEV === true
  const { handleFillDemoData, handleFillInvalidData } = useDemoDataPrefill(form, setPasswordValue, handlePreviousStep)

  if (step === 'verify') {
    return (
      <VerificationForm
        title="Verify Your Email"
        email={emailForVerify}
        devCode={devCodeForVerify}
        onSubmit={handleVerificationSubmit}
        verificationType="signup"
        maxWidth={480}
        onResend={resendHook.handleResend}
        isResending={resendHook.isSending}
        isCooling={resendHook.isCooling}
        remaining={resendHook.remaining}
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

      <Form
        name="userSignUp"
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          // Check maintenance mode before proceeding with registration
          if (maintenance.active) {
            message.warning('Registration is temporarily unavailable due to maintenance. Please try again later.')
            return
          }
          
          try {
            await handleFinish(values)
          } finally {
            turnstileRef.current?.reset?.()
          }
        }}
        size="default"
        requiredMark="*"
        style={{ maxWidth: 500, width: '100%' }}
      >
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: 48, textAlign: 'center' }}>
          Register An Account
        </Title>

        {/* ── Step 1: Account Information ── */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <Form.Item name="firstName" label={<span>First Name<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={firstNameRules}>
            <Input placeholder="First name"/>
          </Form.Item>
          <Form.Item name="lastName" label={<span>Last Name<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={lastNameRules}>
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item name="middleName" label={<span>Middle Name<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={middleNameRules}>
            <Input placeholder="Middle name" />
          </Form.Item>
          <Form.Item name="suffix" label="Suffix (optional)" rules={suffixRules}>
            <Input placeholder="e.g. Jr., Sr., III" />
          </Form.Item>
          <Form.Item name="email" label={<span>Email<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={emailRules}>
            <Input placeholder="Email address" />
          </Form.Item>
          <Form.Item name="phoneNumber" label={<span>Phone Number<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={phoneNumberRules}>
            <Input
              placeholder="Mobile number"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={preventNonNumericKeyDown}
              onPaste={sanitizePhonePaste}
              onInput={sanitizePhoneInput}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span>Password<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>}
            rules={passwordRules}
          >
            <Input.Password
              placeholder="Create password"
              onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
            />
          </Form.Item>
          <PasswordStrengthIndicator value={passwordValue} minLength={12} />
          <Form.Item
            name="confirmPassword"
            label={<span>Confirm Password<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>}
            dependencies={['password']}
            hasFeedback
            rules={signUpConfirmPasswordRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
          <Form.Item
            name="termsAndConditions"
            valuePropName="checked"
            rules={termsRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Checkbox style={{ fontSize: isMobile ? 13 : undefined }}>
              I have read and agree to the{' '}
              <Link to="/terms" style={{ color: token.colorPrimary, textDecoration: 'underline' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: token.colorPrimary, textDecoration: 'underline' }}>Privacy Policy</Link>.
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: isMobile ? 16 : 20 }}>
            <Button type="primary" onClick={handleNextStep} block size="default">
              Continue
            </Button>
          </Form.Item>
        </div>

        {/* ── Step 2: PIS (Personal Information Sheet) ── */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          
          <Row gutter={0}>
            <PhilippineAddressFields form={form} required namePrefix="address" />
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="sex" label={<span>Sex<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisSexRules}>
                <Select placeholder="Select sex" options={SEX_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="maritalStatus" label={<span>Marital Status<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisMaritalStatusRules}>
                <Select placeholder="Select status" options={MARITAL_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="dateOfBirth" label={<span>Date of Birth<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisDateOfBirthRules}>
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="placeOfBirth" label={<span>Place of Birth<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisPlaceOfBirthRules}>
                <Input placeholder="Place of birth" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="nationality" label={<span>Nationality<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisNationalityRules}>
                <Input placeholder="e.g. Filipino" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="highestEducationalAttainment" label={<span>Education<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisEducationRules}>
                <Select placeholder="Select education level" options={EDUCATION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="fatherName" label={<span>Father&apos;s Name<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisFatherNameRules}>
                <Input placeholder="Full name of father" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="motherName" label={<span>Mother&apos;s Name<span style={{ color: token.colorError, marginLeft: 4 }}>*</span></span>} rules={pisMotherNameRules}>
                <Input placeholder="Full name of mother" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="distinctiveMark" label="Distinctive Mark (optional)">
                <Input placeholder="e.g. scar on left hand" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={12}>
              <Button block onClick={handlePreviousStep}>
                Back
              </Button>
            </Col>
            <Col xs={12}>
              <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
                Create Account
              </Button>
            </Col>
          </Row>

          <div
            style={{
              marginTop: 20,
              marginBottom: 8,
              padding: '12px 14px',
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 8,
            }}
          >
            <Text strong style={{ display: 'block', color: token.colorTextHeading, fontSize: 14, marginBottom: 4 }}>
              Why we ask for this information
            </Text>
            <Text style={{ display: 'block', color: token.colorTextSecondary, fontSize: 13, lineHeight: 1.5 }}>
              We use your details only to create and protect your account, verify your identity, and process permit-related requests in this system.
            </Text>
            <Text style={{ display: 'block', color: token.colorTextSecondary, fontSize: 13, lineHeight: 1.5 }}>
              For full details on handling and protection of your data, please see our <Link to="/privacy" style={{ color: token.colorPrimary, textDecoration: 'underline' }}>Privacy Policy</Link>.
            </Text>
          </div>

          {turnstileSiteKey ? (
            <Row gutter={16}>
              <Col xs={24} style={{ marginTop: isMobile ? 20 : 24, marginBottom: 0, display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

        </div>

        {/* ── Footer links ── */}
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Button
            type="link"
            onClick={() => navigate('/login')}
            style={{ padding: 0, fontWeight: 600, color: token.colorPrimary }}
            className="auth-link-hover"
          >
            Login
          </Button>
        </div>

        {showPrefillButton && (
          <div style={{ textAlign: 'center', marginBottom: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button type="link" onClick={handleFillDemoData} style={{ fontSize: 13, color: token.colorTextTertiary }}>
              Fill demo data
            </Button>
            <Button type="link" onClick={handleFillInvalidData} style={{ fontSize: 13, color: token.colorTextTertiary }}>
              Fill invalid data
            </Button>
          </div>
        )}

      </Form>
    </div>
  )
}
