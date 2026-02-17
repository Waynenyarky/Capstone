import { Form, Modal, DatePicker, Select, Input, Typography } from 'antd'
import dayjs from 'dayjs'
import { DEACTIVATE_REASON_TEMPLATES } from '../constants'

export default function DeactivateFormModal({
  open,
  form,
  reasonTemplate,
  onReasonTemplateChange,
  onCancel,
  onOk,
  confirmLoading,
}) {
  return (
    <Modal
      title="Deactivate Form"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Deactivate"
      okButtonProps={{ danger: true }}
      confirmLoading={confirmLoading}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ reasonTemplate: 'maintenance' }}>
        <Form.Item
          name="deactivatedUntil"
          label="Available again on"
          rules={[{ required: true, message: 'Please set when the form will be available again' }]}
        >
          <DatePicker
            showTime={{ format: 'h:mm A' }}
            format="MMM D, YYYY h:mm A"
            style={{ width: '100%' }}
            disabledDate={(d) => !d || d.isBefore(dayjs(), 'minute')}
            placeholder="Select date and time"
          />
        </Form.Item>
        <Form.Item
          name="reasonTemplate"
          label="Message to show business owners"
          rules={[{ required: true }]}
        >
          <Select
            options={DEACTIVATE_REASON_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={onReasonTemplateChange}
            placeholder="Select a message"
          />
        </Form.Item>
        {reasonTemplate === 'custom' && (
          <Form.Item
            name="reason"
            label="Custom message"
            rules={[{ required: true, message: 'Please enter a custom message' }]}
          >
            <Input.TextArea
              placeholder="Enter the message business owners will see..."
              rows={3}
            />
          </Form.Item>
        )}
        <Form.Item noStyle shouldUpdate>
          {() => {
            const template = form.getFieldValue('reasonTemplate')
            const customReason = form.getFieldValue('reason')
            const templateObj = DEACTIVATE_REASON_TEMPLATES.find((t) => t.value === template)
            const previewMessage =
              template === 'custom'
                ? customReason || 'Your custom message will appear here.'
                : templateObj?.message || ''
            if (!previewMessage) return null
            return (
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Preview — business owners will see:
                </Typography.Text>
                <div
                  style={{
                    padding: 16,
                    minHeight: 80,
                    background: 'var(--ant-color-fill-quaternary)',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {previewMessage}
                </div>
              </div>
            )
          }}
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        Business owners will see a message and cannot proceed with registration until the form is reactivated.
      </Typography.Text>
    </Modal>
  )
}
