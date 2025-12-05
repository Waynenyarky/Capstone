import React from 'react'
import { Form, Checkbox, Flex, Button } from 'antd'
import { termsRules } from '@/features/authentication/validations'

export default function TermsAndSubmit({ isSubmitting }) {
  return (
    <>
      <Form.Item name="termsAndConditions" valuePropName="checked" rules={termsRules}>
        <Checkbox>Accept Terms and Conditions</Checkbox>
      </Form.Item>
      <Flex justify="end">
        <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
          Review & Send Code
        </Button>
      </Flex>
    </>
  )
}