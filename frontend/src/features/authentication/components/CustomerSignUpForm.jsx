import { Form, Input, Card, Flex, Button, Checkbox } from 'antd'
import { useCustomerSignUp, useCustomerSignUpFlow } from "@/features/authentication/hooks"
import { emailRules, firstNameRules, lastNameRules, phoneNumberRules, signUpPasswordRules as passwordRules, signUpConfirmPasswordRules, termsRules } from "@/features/authentication/validations"
import React from 'react'
import { SignUpVerificationForm } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from "@/shared/forms"
 

export default function CustomerSignUpForm() {
  const { step, emailForVerify, devCodeForVerify, verifyEmail, handleVerificationSubmit } = useCustomerSignUpFlow()
  const { form, handleFinish, isSubmitting, prefillDemo } = useCustomerSignUp({
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

  return (
    <Card title="Customer Sign Up" extra={<Button onClick={prefillDemo}>Prefill Demo</Button>}>
        <Form name="customerSignUp" form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
            name="firstName"
            label="First Name"
            rules={firstNameRules}
            >
              <Input />
            </Form.Item>
            <Form.Item
            name="lastName"
            label="Last Name"
            rules={lastNameRules}
            >
              <Input />
            </Form.Item>
            <Form.Item
            name="email"
            label="Email"
            rules={emailRules}
            >
              <Input />
            </Form.Item>
            <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={phoneNumberRules}
            >
              <Input inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} />
            </Form.Item>
            <Form.Item
            name="password"
            label="Password"
            rules={passwordRules}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              hasFeedback
              rules={signUpConfirmPasswordRules}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="termsAndConditions"
              valuePropName="checked"
              rules={termsRules}
            >
              <Checkbox>Accept Terms and Conditions</Checkbox>
            </Form.Item>
            <Flex justify="end">
                <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Send Verification Code</Button>
            </Flex>
        </Form>
    </Card>
  )
}
