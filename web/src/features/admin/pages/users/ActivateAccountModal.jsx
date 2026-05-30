import { Form } from '@/shared/components/AppForm'
import { Modal, Input, Select } from 'antd'

const REASON_OPTIONS = [
  { value: 'return_from_leave', label: 'Return from leave' },
  { value: 'policy_resolved', label: 'Policy issue resolved' },
  { value: 'security_cleared', label: 'Security concern cleared' },
  { value: 'role_change_completed', label: 'Role change completed' },
  { value: 'reinstatement', label: 'Reinstatement' },
  { value: 'others', label: 'Others' },
]

export default function ActivateAccountModal({ open, onCancel, onOk, loading, form }) {
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
      title="Activate Staff Account"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Activate Account"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ reasonType: undefined, reasonOther: '' }}>
        <Form.Item
          name="reasonType"
          label="Reason for activation"
          rules={[{ required: true, message: 'Select a reason' }]}
          extra="Required for audit trail. The user will be able to log in again."
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
              placeholder="Why are you activating this account?"
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
