import React from 'react'
import { Form, Input, Card, Flex, Button, Typography } from 'antd'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.js"
import { firstNameRules, lastNameRules, phoneNumberRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from "@/shared/forms"

export default function EditUserProfileForm({ embedded = false }) {
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

  const content = (
    <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isLoading} onValuesChange={handleValuesChange}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Email: <Typography.Text strong>{currentUser?.email || '-'}</Typography.Text>
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item name="firstName" label="First Name" rules={firstNameRules} style={{ marginBottom: 24 }}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={lastNameRules} style={{ marginBottom: 24 }}>
          <Input size="large" />
        </Form.Item>
      </div>
      <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules} style={{ marginBottom: 24 }}>
        <Input
          size="large"
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
        <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} disabled={isSubmitting}>Save Changes</Button>
      </Flex>
    </Form>
  )

  if (embedded) return content

  return (
    <Card title="Edit Profile">
      {content}
    </Card>
  )
}
