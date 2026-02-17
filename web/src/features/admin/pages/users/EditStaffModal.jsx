import React from 'react'
import { Modal, Form, Input, Select, Switch } from 'antd'

const REASON_OPTIONS = [
  { value: 'correction_typo', label: 'Correction of typo or error' },
  { value: 'legal_name_change', label: 'Legal name change' },
  { value: 'contact_update', label: 'Contact information update' },
  { value: 'role_reassignment', label: 'Role or office reassignment' },
  { value: 'compliance', label: 'Compliance or policy correction' },
  { value: 'staff_request', label: 'Staff member request' },
  { value: 'others', label: 'Others' },
]

export default function EditStaffModal({ open, onCancel, onOk, loading, form, officeGroupsState, roleOptionsState }) {
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
    <Modal title="Edit Staff Account" open={open} onCancel={onCancel} onOk={handleOk} confirmLoading={loading} okText="Save Changes" destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ reasonType: undefined, reasonOther: '' }}>
        <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
          <Input placeholder="First name" />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
          <Input placeholder="Last name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Enter email' }, { type: 'email', message: 'Enter a valid email' }]}>
          <Input placeholder="email@example.com" />
        </Form.Item>
        <Form.Item name="phoneNumber" label="Contact Number" rules={[{ min: 7, message: 'Enter a valid number' }]}>
          <Input placeholder="+63..." />
        </Form.Item>
        <Form.Item name="office" label="Office" rules={[{ required: true, message: 'Select an office' }]}>
          <Select
            placeholder="Select office"
            showSearch
            optionFilterProp="label"
            options={(officeGroupsState || []).map((g) => ({ label: g.label, options: g.options.map((o) => ({ value: o.value, label: o.label })) }))}
          />
        </Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
          <Select placeholder="Select role" options={roleOptionsState} />
        </Form.Item>
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          name="reasonType"
          label="Reason for change"
          rules={[{ required: true, message: 'Select a reason' }]}
          extra="Required for audit trail"
        >
          <Select placeholder="Select a reason" allowClear options={REASON_OPTIONS} />
        </Form.Item>
        {reasonType === 'others' && (
          <Form.Item
            name="reasonOther"
            label="Please specify"
            rules={[{ required: true, message: 'Provide a reason' }, { min: 5, message: 'Reason must be at least 5 characters' }]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="Explain the reason for this change..." />
          </Form.Item>
        )}
        <Form.Item name="reason" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
