import React, { useState } from 'react'
import { Modal, Form, Select, Input, Upload, Button, message, Alert } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

export default function AppealModal({ open, onCancel, onSubmit }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      await onSubmit(values)
      message.success('Appeal submitted successfully!')
      form.resetFields()
      onCancel()
    } catch {
      message.error('Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="File an Appeal / Dispute"
      onCancel={onCancel}
      footer={null}
      destroyOnHidden={true}
    >
      <Alert 
        message="Blockchain Record" 
        description="Your appeal and its timestamp will be permanently recorded." 
        type="warning" 
        showIcon 
        style={{ marginBottom: 16 }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item label="Appeal Type" name="type" rules={[{ required: true }]}>
          <Select placeholder="Select Type">
            <Option value="Permit Rejection">Permit Rejection</Option>
            <Option value="Fine Dispute">Fine Dispute</Option>
            <Option value="Inspection Dispute">Inspection Dispute</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Reference Number" name="referenceNumber" rules={[{ required: true }]} help="e.g. Application ID or Violation Ticket #">
          <Input placeholder="Enter Reference Number" />
        </Form.Item>

        <Form.Item label="Reason for Appeal" name="reason" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="Explain why you are contesting this decision..." />
        </Form.Item>

        <Form.Item label="Supporting Documents" name="documents" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
          <Upload listType="picture">
            <Button icon={<UploadOutlined />}>Upload Evidence</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Submit Appeal
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
