import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Modal, Input, DatePicker, Select, Button, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

const ACTION_OPTIONS = [
  { value: 'enable', label: 'Enable maintenance mode' },
  { value: 'disable', label: 'Disable maintenance mode' },
]

const WHEN_TO_START_OPTIONS = [
  { value: 'now', label: 'Start now (after approval)' },
  { value: 'scheduled', label: 'Schedule for date and time' },
]

/** Predefined message keys; value 'other' means use custom message. */
export const MESSAGE_PRESET_OTHER = 'other'

export const MESSAGE_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: MESSAGE_PRESET_OTHER, label: 'Others' },
]

const PRESET_MESSAGES = {
  scheduled: 'We are currently performing scheduled maintenance. We apologize for the inconvenience and will be back shortly.',
  emergency: 'Our systems are undergoing emergency maintenance. Please check back later.',
  upgrade: 'We are performing a system upgrade to serve you better. Thank you for your patience.',
  outage: 'We are experiencing a temporary service outage. Our team is working to restore service as soon as possible.',
}

/** Resolve the message to send: preset text or custom when "Others" is selected. */
export function getMaintenanceMessage(values) {
  if (!values) return ''
  if (values.messagePreset === MESSAGE_PRESET_OTHER) return (values.message || '').trim()
  return values.messagePreset ? (PRESET_MESSAGES[values.messagePreset] || '') : ''
}

export default function RequestMaintenanceModal({ open, onCancel, form, onSubmit, submitting, maintenanceActive }) {
  const action = Form.useWatch('action', form)
  const whenToStart = Form.useWatch('whenToStart', form)
  const messagePreset = Form.useWatch('messagePreset', form)
  const isEnable = action === 'enable'
  const isScheduled = whenToStart === 'scheduled'
  const isMessageOther = messagePreset === MESSAGE_PRESET_OTHER

  React.useEffect(() => {
    if (open && maintenanceActive) {
      form.setFieldsValue({
        action: 'disable',
        whenToStart: undefined,
        scheduledStartAt: undefined,
        messagePreset: undefined,
        message: undefined,
        expectedResumeAt: undefined,
      })
    }
  }, [open, maintenanceActive, form])

  const isEndMaintenanceFlow = maintenanceActive

  return (
    <Modal
      title={isEndMaintenanceFlow ? 'Request to end maintenance' : 'Request maintenance change'}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={onSubmit}>
          {isEndMaintenanceFlow ? 'Request to end maintenance' : 'Submit for approval'}
        </Button>,
      ]}
      width={560}
      destroyOnHidden
    >
      {isEndMaintenanceFlow ? (
        <>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Text type="secondary">
              Submit a request to end maintenance mode. The request will require approval from two admins before the system returns to normal operation.
            </Text>
          </div>
          <Form form={form} layout="vertical" initialValues={{ action: 'disable' }}>
            <Form.Item name="action" hidden>
              <input type="hidden" readOnly />
            </Form.Item>
          </Form>
        </>
      ) : (
        <Form
          layout="vertical"
          form={form}
          style={{ marginTop: 16 }}
          initialValues={{ whenToStart: 'now' }}
        >
          <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Select action' }]}>
            <Select options={ACTION_OPTIONS} placeholder="Choose" />
          </Form.Item>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              Canceling maintenance is done by submitting a Disable request and getting approvals.
            </Text>
          </div>

          {isEnable && (
            <>
              <Form.Item
                name="whenToStart"
                label="When to start"
                rules={[{ required: true, message: 'Select when to start' }]}
              >
                <Select
                  options={WHEN_TO_START_OPTIONS}
                  placeholder="Choose"
                  onChange={() => form.setFieldValue('scheduledStartAt', undefined)}
                />
              </Form.Item>
              {isScheduled && (
                <Form.Item
                  name="scheduledStartAt"
                  label="Scheduled start date and time"
                  rules={[
                    { required: true, message: 'Select date and time' },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (value.isBefore(dayjs(), 'minute')) {
                          return Promise.reject(new Error('Start time must be in the future'))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="MMM D, YYYY h:mm A"
                    style={{ width: '100%' }}
                    disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
                    showNow={false}
                  />
                </Form.Item>
              )}
            </>
          )}

          <Form.Item
            name="messagePreset"
            label="Message"
            rules={[{ required: true, message: 'Select a message' }]}
            initialValue="scheduled"
          >
            <Select
              placeholder="Choose a message"
              options={MESSAGE_PRESET_OPTIONS}
              onChange={() => form.setFieldValue('message', undefined)}
            />
          </Form.Item>
          {isMessageOther && (
            <Form.Item
              name="message"
              label="Custom message"
              rules={[{ required: true, message: 'Enter a message' }, { max: 500, message: 'Max 500 characters' }]}
            >
              <Input.TextArea placeholder="Shown to users during maintenance" rows={3} />
            </Form.Item>
          )}
          <Form.Item name="expectedResumeAt" label="Expected resume time">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
