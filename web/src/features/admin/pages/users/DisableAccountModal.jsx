import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Modal, Input, Select } from 'antd'

const REASON_OPTIONS = [
  { value: 'leave_of_absence', label: 'Leave of absence' },
  { value: 'policy_violation', label: 'Policy violation' },
  { value: 'security_concern', label: 'Security concern' },
  { value: 'termination', label: 'Termination' },
  { value: 'role_change_pending', label: 'Role change pending' },
  { value: 'others', label: 'Others' },
]

export default function DisableAccountModal({ open, onCancel, onOk, loading, form }) {
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
    <Modal
      title="Disable Staff Account"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Disable Account"
      okButtonProps={{ danger: true }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ reasonType: undefined, reasonOther: '' }}>
        <Form.Item
          name="reasonType"
          label="Reason for disabling"
          rules={[{ required: true, message: 'Select a reason' }]}
          extra="Required for audit trail. The user will not be able to log in until the account is re-enabled."
        >
          <Select placeholder="Select a reason" allowClear options={REASON_OPTIONS} />
        </Form.Item>
        {reasonType === 'others' && (
          <Form.Item
            name="reasonOther"
            label="Please specify"
            rules={[
              { required: true, message: 'Provide a reason' },
              { min: 5, message: 'Reason must be at least 5 characters' },
            ]}
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="Why are you disabling this account?"
            />
          </Form.Item>
        )}
        <Form.Item name="reason" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
