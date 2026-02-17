// UserSignUpForm.jsx — Two-step signup: Account info → PIS fields
import React, { useState, useCallback } from 'react'
import { Form, Input, Button, Checkbox, Typography, Row, Col, Grid, Steps, Select, DatePicker, Modal, Divider } from 'antd'
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
import {
  pisMaritalStatusRules,
  pisDateOfBirthRules,
  pisPlaceOfBirthRules,
  pisNationalityRules,
  pisFatherNameRules,
  pisMotherNameRules,
  pisEducationRules,
  pisStreetRules,
  pisBarangayRules,
  pisCityRules,
  pisProvinceRules,
  pisZipCodeRules,
  pisSpouseNameRules,
} from '@/features/authentication/utils/validations/pisRules'

import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from '@/shared/forms'
import LinkExistingAccountModal from './LinkExistingAccountModal.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

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
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [passwordValue, setPasswordValue] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [linkModalOpen, setLinkModalOpen] = useState(false)

  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useUserSignUpFlow()
  const { form, handleFinish, isSubmitting } = useUserSignUp({
    onBegin: ({ email, serverData }) => {
      verifyEmail({ email, devCode: serverData?.devCode })
    },
    onSubmit: () => {
      navigate('/login')
    },
  })

  const maritalStatus = Form.useWatch('maritalStatus', form)

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
        onFinish={handleFinish}
        size="default"
        requiredMark={false}
        style={{ maxWidth: currentStep === 0 ? 300 : 480, width: '100%' }}
      >
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: 12, textAlign: 'center' }}>
          Register An Account
        </Title>

        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Account' },
            { title: 'Personal Info' },
          ]}
        />

        {/* ── Step 1: Account Information ── */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
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
            dependencies={['password']}
            hasFeedback
            rules={signUpConfirmPasswordRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Input.Password placeholder="Confirm password" variant="filled" />
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
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>
            Complete your Personal Information Sheet. This is required before applying for a permit.
            You may also complete this later from your profile.
          </Text>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name={['address', 'street']} label="Street Address" rules={pisStreetRules}>
                <Input placeholder="House/Bldg No. & Street" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name={['address', 'barangay']} label="Barangay" rules={pisBarangayRules}>
                <Input placeholder="Barangay" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name={['address', 'city']} label="City/Municipality" rules={pisCityRules}>
                <Input placeholder="City/Municipality" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name={['address', 'province']} label="Province" rules={pisProvinceRules}>
                <Input placeholder="Province" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name={['address', 'zipCode']} label="Zip Code" rules={pisZipCodeRules}>
                <Input placeholder="e.g. 2500" maxLength={4} variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="maritalStatus" label="Marital Status" rules={pisMaritalStatusRules}>
                <Select placeholder="Select status" options={MARITAL_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dateOfBirth" label="Date of Birth" rules={pisDateOfBirthRules}>
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="placeOfBirth" label="Place of Birth" rules={pisPlaceOfBirthRules}>
                <Input placeholder="Place of birth" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nationality" label="Nationality" rules={pisNationalityRules}>
                <Input placeholder="e.g. Filipino" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="highestEducationalAttainment" label="Education" rules={pisEducationRules}>
                <Select placeholder="Select education level" options={EDUCATION_OPTIONS} />
              </Form.Item>
            </Col>
            {maritalStatus === 'married' && (
              <Col xs={24} sm={12}>
                <Form.Item name="spouseName" label="Spouse Name" rules={pisSpouseNameRules}>
                  <Input placeholder="Full name of spouse" variant="filled" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={12}>
              <Form.Item name="fatherName" label="Father's Name" rules={pisFatherNameRules}>
                <Input placeholder="Full name of father" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="motherName" label="Mother's Name" rules={pisMotherNameRules}>
                <Input placeholder="Full name of mother" variant="filled" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="distinctiveMark" label="Distinctive Mark (optional)">
                <Input placeholder="e.g. scar on left hand" variant="filled" />
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

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button
              type="link"
              onClick={() => {
                // Skip PIS — submit without PIS fields
                handleFinish(form.getFieldsValue(true))
              }}
              style={{ fontSize: 13, color: '#8c8c8c' }}
            >
              Skip for now (complete later)
            </Button>
          </div>
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
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button
            type="link"
            onClick={() => setLinkModalOpen(true)}
            style={{ padding: 0, fontSize: 13, color: '#595959' }}
          >
            I already have a permit
          </Button>
        </div>
      </Form>

      <LinkExistingAccountModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
      />
    </div>
  )
}
