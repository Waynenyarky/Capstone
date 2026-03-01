import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Modal, Input, Select } from 'antd'

const REASON_OPTIONS = [
  { value: 'staff_onboarding', label: 'Staff onboarding' },
  { value: 'security_rotation', label: 'Security rotation' },
  { value: 'forgot_password', label: 'Forgot password' },
  { value: 'account_compromise', label: 'Suspected account compromise' },
  { value: 'policy_compliance', label: 'Policy compliance' },
  { value: 'password_expired', label: 'Password expired' },
  { value: 'others', label: 'Others' },
]

export default function ResetPasswordModal({ open, onCancel, onOk, loading, form }) {
  const reasonType = Form.useWatch('reasonType', form)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const reason = values.reasonType === 'others'
        ? values.reasonOther
        : REASON_OPTIONS.find((o) => o.value === values.reasonType)?.label || values.reasonType
      form.setFieldsValue({ reason })
      await onOk()
    } catch {
      // Validation failed
    }
  }

  return (
    <Modal title="Reset Staff Password" open={open} onCancel={onCancel} onOk={handleOk} confirmLoading={loading} okText="Issue Temporary Password" destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ reasonType: undefined, reasonOther: '' }}>
        <Form.Item
          name="reasonType"
          label="Reason for reset"
          rules={[{ required: true, message: 'Select a reason' }]}
          extra="Required for audit trail"
        >
          <Select
            placeholder="Select a reason"
            allowClear
            options={REASON_OPTIONS}
          />
        </Form.Item>
        {reasonType === 'others' && (
          <Form.Item
            name="reasonOther"
            label="Please specify"
            rules={[{ required: true, message: 'Provide a reason' }, { min: 5, message: 'Reason must be at least 5 characters' }]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="Why are you resetting this account?" />
          </Form.Item>
        )}
        <Form.Item name="reason" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
