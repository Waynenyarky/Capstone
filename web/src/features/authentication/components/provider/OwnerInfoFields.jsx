import React from 'react'
import { Form, Input, Typography } from 'antd'
import {
  firstNameRules,
  lastNameRules,
  emailRules,
  phoneNumberRules,
  signUpPasswordRules as passwordRules,
  signUpConfirmPasswordRules as confirmPasswordRules,
} from '@/features/authentication/validations'
import { preventNonNumericKeyDown } from '@/shared/forms'

export default function OwnerInfoFields() {
  return (
    <>
      <Typography.Text>Owner Information</Typography.Text>
      <Form.Item name="firstName" label="First Name" rules={firstNameRules}>
        <Input />
      </Form.Item>
      <Form.Item name="lastName" label="Last Name" rules={lastNameRules}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={emailRules}>
        <Input />
      </Form.Item>
      <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules}>
        <Input inputMode="numeric" onKeyDown={preventNonNumericKeyDown} />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={passwordRules}>
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        dependencies={["password"]}
        hasFeedback
        rules={confirmPasswordRules}
      >
        <Input.Password />
      </Form.Item>
    </>
  )
}