import React from 'react'
import { Form, Input, Card, Flex, Button, Typography } from 'antd'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.js"
import { firstNameRules, lastNameRules, phoneNumberRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput, sanitizePhonePaste, sanitizePhoneInput } from "@/shared/forms"

export default function EditUserProfileForm() {
  const initialValuesRef = React.useRef({})
  const hasSnapshotRef = React.useRef(false)
  const [, setDirty] = React.useState(false)

  const { form, isLoading, isSubmitting, handleFinish } = useEditUserProfileForm({
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
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            onKeyDown={preventNonNumericKeyDown}
            onPaste={sanitizePhonePaste}
            onInput={sanitizePhoneInput}
            placeholder="09XXXXXXXXX"
          />
        </Form.Item>
        <Flex justify="end">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>Save</Button>
        </Flex>
      </Form>
    </Card>
  )
}
