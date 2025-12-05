import React from 'react'
import { Form, Input, Card, Flex, Button, Typography } from 'antd'
import { useEditCustomerProfileForm } from "@/features/customer/hooks/useEditCustomerProfileForm.js"
import { firstNameRules, lastNameRules, phoneNumberRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from "@/shared/forms"

export default function EditCustomerProfileForm() {
  const initialValuesRef = React.useRef({})
  const hasSnapshotRef = React.useRef(false)
  const [isDirty, setDirty] = React.useState(false)

  const { form, isLoading, isSubmitting, handleFinish } = useEditCustomerProfileForm({
    onSubmit: () => {
      try {
        initialValuesRef.current = form.getFieldsValue(true)
        setDirty(false)
      } catch (err) {
        void err
      }
    }
  })
  const { currentUser } = useAuthSession()

  const handleValuesChange = React.useCallback((_, allValues) => {
    try {
      const dirty = JSON.stringify(allValues) !== JSON.stringify(initialValuesRef.current)
      setDirty(dirty)
    } catch (err) {
      void err
    }
  }, [])

  React.useEffect(() => {
    if (!isLoading && !hasSnapshotRef.current) {
      try {
        initialValuesRef.current = form.getFieldsValue(true)
        hasSnapshotRef.current = true
        setDirty(false)
      } catch (err) {
        void err
      }
    }
  }, [isLoading, form])

  return (
    <Card title="Edit Profile">
      <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isLoading} onValuesChange={handleValuesChange}>
        <Typography.Text type="secondary">Email: {currentUser?.email || '-'}</Typography.Text>
        <Form.Item name="firstName" label="First Name" rules={firstNameRules}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={lastNameRules}>
          <Input />
        </Form.Item>
        <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules}>
          <Input inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} />
        </Form.Item>
        <Flex justify="end">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting || isLoading || !isDirty}>Save Changes</Button>
        </Flex>
      </Form>
    </Card>
  )
}