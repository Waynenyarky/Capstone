/**
 * Presentation Component: InspectionForm
 * Pure presentation - no business logic
 */
import React from 'react'
import { Form, Input, DatePicker, Select, Button, Space, Typography } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Title } = Typography

export default function InspectionForm({ loading, onSubmit, initialValues }) {
  const [form] = Form.useForm()

  const handleSubmit = (values) => {
    onSubmit?.(values)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="findings"
        label="Findings"
        rules={[{ required: true, message: 'Please enter findings' }]}
      >
        <TextArea rows={4} placeholder="Enter inspection findings..." />
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notes"
      >
        <TextArea rows={3} placeholder="Additional notes..." />
      </Form.Item>

      <Form.Item
        name="conductedDate"
        label="Conducted Date"
        rules={[{ required: true, message: 'Please select conducted date' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
          Submit Inspection
        </Button>
      </Form.Item>
    </Form>
  )
}
