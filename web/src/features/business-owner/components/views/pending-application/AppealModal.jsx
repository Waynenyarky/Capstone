import { Modal, Form, Select, Input } from 'antd'

export default function AppealModal({ open, onCancel, onSubmit, submitting }) {
  const [form] = Form.useForm()

  const handleOk = () => {
    form.submit()
  }

  const handleCancel = () => {
    if (!submitting) {
      onCancel()
      form.resetFields()
    }
  }

  return (
    <Modal
      title="File Appeal"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Submit Appeal"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="appealType"
          label="Appeal Type"
          rules={[{ required: true, message: 'Please select an appeal type' }]}
          initialValue="rejection_appeal"
        >
          <Select
            placeholder="Select appeal type"
            options={[
              { value: 'rejection_appeal', label: 'Appeal Rejection Decision' },
              { value: 'wrong_assessment', label: 'Wrong Assessment' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="Appeal Details"
          rules={[{ required: true, message: 'Please provide appeal details' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Describe why you are appealing this rejection..."
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
