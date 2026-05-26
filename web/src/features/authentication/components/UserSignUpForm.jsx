// UserSignUpForm.jsx — Two-step signup: Account info → PIS fields
import React, { useState, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Checkbox, Typography, Row, Col, Grid, Select, DatePicker, Divider, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import dayjs from 'dayjs'

import { useUserSignUp, useUserSignUpFlow, useMaintenanceStatus } from '@/features/authentication/hooks'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx'
import { SignUpVerificationForm } from '@/features/authentication'
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
} from '@/features/authentication/validations'
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
import { findProvinceByName, findCityByName, findBarangayByName } from '@/shared/services/psgcService'
import TurnstileWidget from './TurnstileWidget.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

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

const DEMO_PASSWORD = 'TempPass123!'

function getDemoPrefill() {
  return {
    firstName: 'Mark Stephen',
    lastName: 'Diaz',
    middleName: 'Cabalsi',
    suffix: '',
    email: 'stephendiaz.syv@gmail.com',
    phoneNumber: '09957811767',
    password: DEMO_PASSWORD,
    confirmPassword: DEMO_PASSWORD,
    termsAndConditions: true,
    sex: 'male',
    maritalStatus: 'single',
    dateOfBirth: dayjs().subtract(30, 'year'),
    placeOfBirth: 'Manila',
    nationality: 'Filipino',
    highestEducationalAttainment: 'college',
    fatherName: 'José Dela Cruz',
    motherName: 'Maria Dela Cruz',
    distinctiveMark: '',
  }
}

async function resolveDemoAddress() {
  const province = await findProvinceByName('Pangasinan')
  if (!province) return null
  const city = await findCityByName('Alaminos City', province.code)
  if (!city) {
    return {
      streetAddress: '123 Rizal St',
      postalCode: '2404',
      province: province.code,
      provinceName: province.name,
      city: undefined,
      cityName: '',
      barangay: undefined,
      barangayName: '',
    }
  }
  const barangay = await findBarangayByName('Poblacion', city.code)
  return {
    streetAddress: '123 Rizal St',
    postalCode: '2404',
    province: province.code,
    provinceName: province.name,
    city: city.code,
    cityName: city.name,
    barangay: barangay?.code ?? '',
    barangayName: barangay?.name ?? '',
  }
}

function getInvalidPrefill() {
  return {
    firstName: 'A',
    lastName: '',
    middleName: '',
    suffix: '',
    email: 'not-an-email',
    phoneNumber: '12',
    password: 'weak',
    confirmPassword: 'different',
    termsAndConditions: false,
    sex: undefined,
    maritalStatus: undefined,
    dateOfBirth: dayjs().add(1, 'year'),
    placeOfBirth: '',
    nationality: '',
    highestEducationalAttainment: undefined,
    fatherName: 'X',
    motherName: '',
    distinctiveMark: '',
    address: {
      streetAddress: '',
      postalCode: 'abc',
      province: undefined,
      provinceName: '',
      city: undefined,
      cityName: '',
      barangay: undefined,
      barangayName: '',
    },
  }
}

export default function UserSignUpForm({ extraContent }) {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [passwordValue, setPasswordValue] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const turnstileRef = React.useRef(null)
  const turnstileSiteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) || ''
  const maintenance = useMaintenanceStatus()

  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useUserSignUpFlow()
  const { form, handleFinish, isSubmitting } = useUserSignUp({
    getCaptchaToken: turnstileSiteKey ? () => turnstileRef.current?.getToken?.() ?? '' : undefined,
    onBegin: ({ email, serverData }) => {
      verifyEmail({ email, devCode: serverData?.devCode })
    },
    onSubmit: () => {
      navigate('/login')
    },
  })

  const showPrefillButton = import.meta.env.DEV === true

  const handleFillDemoData = useCallback(async () => {
    const values = getDemoPrefill()
    form.setFieldsValue(values)
    setPasswordValue(values.password)
    const address = await resolveDemoAddress()
    if (address) {
      form.setFieldsValue({ address })
    }
  }, [form])

  const handleFillInvalidData = useCallback(() => {
    const values = getInvalidPrefill()
    form.setFieldsValue(values)
    setPasswordValue(values.password)
    setCurrentStep(0)
  }, [form])

  // Validate step 1 fields before proceeding to step 2
  const handleNextStep = useCallback(async () => {
    try {
      await form.validateFields([
        'firstName', 'lastName', 'email', 'phoneNumber',
        'password', 'confirmPassword', 'termsAndConditions',
      ])
      setCurrentStep(1)
    } catch {
      // Validation errors will be shown by the form
    }
  }, [form])

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
          <Form.Item name="firstName" label="First Name" rules={firstNameRules}>
            <Input placeholder="First name"/>
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={lastNameRules}>
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name" rules={middleNameRules}>
            <Input placeholder="Middle name" />
          </Form.Item>
          <Form.Item name="suffix" label="Suffix (optional)" rules={suffixRules}>
            <Input placeholder="e.g. Jr., Sr., III" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={emailRules}>
            <Input placeholder="Email address" />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules}>
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
            label="Password"
            rules={passwordRules}
            extra="Password must be at least 12 characters long to proceed to Personal Info."
          >
            <Input.Password
              placeholder="Create password"
              onChange={(e) => setPasswordValue(e?.target?.value ?? '')}
            />
          </Form.Item>
          <PasswordStrengthIndicator value={passwordValue} minLength={12} />
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
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
              <Link to="/terms" style={{ color: '#001529', textDecoration: 'underline' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: '#001529', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: isMobile ? 16 : 20 }}>
            <Button type="primary" onClick={handleNextStep} block size="default">
              Next: Personal Information
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
              <Form.Item name="sex" label="Sex" rules={pisSexRules}>
                <Select placeholder="Select sex" options={SEX_OPTIONS} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="maritalStatus" label="Marital Status" rules={pisMaritalStatusRules}>
                <Select placeholder="Select status" options={MARITAL_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="dateOfBirth" label="Date of Birth" rules={pisDateOfBirthRules}>
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="placeOfBirth" label="Place of Birth" rules={pisPlaceOfBirthRules}>
                <Input placeholder="Place of birth" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="nationality" label="Nationality" rules={pisNationalityRules}>
                <Input placeholder="e.g. Filipino" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="highestEducationalAttainment" label="Education" rules={pisEducationRules}>
                <Select placeholder="Select education level" options={EDUCATION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="fatherName" label="Father's Name" rules={pisFatherNameRules}>
                <Input placeholder="Full name of father" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="motherName" label="Mother's Name" rules={pisMotherNameRules}>
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
              <Button block onClick={() => setCurrentStep(0)}>
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
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          >
            <Text strong style={{ display: 'block', color: '#1f2937', fontSize: 14, marginBottom: 4 }}>
              Why we ask for this information
            </Text>
            <Text style={{ display: 'block', color: '#4b5563', fontSize: 13, lineHeight: 1.5 }}>
              We use your details only to create and protect your account, verify your identity, and process permit-related requests in this system.
            </Text>
            <Text style={{ display: 'block', color: '#4b5563', fontSize: 13, lineHeight: 1.5 }}>
              For full details on handling and protection of your data, please see our <Link to="/privacy" style={{ color: '#001529', textDecoration: 'underline' }}>Privacy Policy</Link>.
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
            style={{ padding: 0, fontWeight: 600, color: '#001529' }}
            className="auth-link-hover"
          >
            Login
          </Button>
        </div>

        {showPrefillButton && (
          <div style={{ textAlign: 'center', marginBottom: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button type="link" onClick={handleFillDemoData} style={{ fontSize: 13, color: '#8c8c8c' }}>
              Fill demo data
            </Button>
            <Button type="link" onClick={handleFillInvalidData} style={{ fontSize: 13, color: '#8c8c8c' }}>
              Fill invalid data
            </Button>
          </div>
        )}

      </Form>
    </div>
  )
}
