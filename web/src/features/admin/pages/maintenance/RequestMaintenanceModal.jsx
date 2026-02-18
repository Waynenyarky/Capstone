import React from 'react'
import { Modal, Form, Input, DatePicker, Select, Button, Typography } from 'antd'

const { Text } = Typography

const ACTION_OPTIONS = [
  { value: 'enable', label: 'Enable maintenance mode' },
  { value: 'disable', label: 'Disable maintenance mode' },
]

export default function RequestMaintenanceModal({ open, onCancel, form, onSubmit, submitting }) {
  return (
    <Modal
      title="Request maintenance change"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={onSubmit}>
          Submit for approval
        </Button>,
      ]}
      width={560}
      destroyOnClose
    >
      <Form layout="vertical" form={form} style={{ marginTop: 16 }}>
        <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Select action' }]}>
          <Select options={ACTION_OPTIONS} placeholder="Choose" />
        </Form.Item>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            Canceling maintenance is done by submitting a Disable request and getting approvals.
          </Text>
        </div>
        <Form.Item name="message" label="Message" rules={[{ max: 500 }]}>
          <Input.TextArea placeholder="Shown to users during maintenance" rows={3} />
        </Form.Item>
        <Form.Item name="expectedResumeAt" label="Expected resume time">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
