import { Form, DatePicker, Select, Input } from 'antd'
import dayjs from 'dayjs'
import { REASON_PRESET_OPTIONS, PRESET_REASONS, REASON_PRESET_OTHER } from '../constants/maintenance.constants.js'

const { TextArea } = Input

export default function MaintenanceFormFields({ form, whenToStart, validateScheduledStartAt, validateExpectedResumeAt, maintenanceActive, forceScheduleMode }) {
  const reasonPreset = Form.useWatch('reasonPreset', form)

  return (
    <>
      <Form.Item
        name="whenToStart"
        label="When to start"
        initialValue={forceScheduleMode ? 'scheduled' : 'now'}
        rules={[{ required: true, message: 'Please select when to start' }]}
      >
        <Select
          options={[
            { value: 'now', label: 'Start now (after approval)' },
            { value: 'scheduled', label: 'Schedule for date and time' },
          ]}
          disabled={maintenanceActive && !forceScheduleMode}
        />
      </Form.Item>

      {whenToStart === 'scheduled' && (
        <>
          <Form.Item
            name="scheduledStartAt"
            label="Scheduled start time"
            rules={[{ required: true, message: 'Please select a start time' }, { validator: validateScheduledStartAt }]}
          >
            <DatePicker
              showTime
              format="MMM D, YYYY HH:mm"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              minuteStep={15}
            />
          </Form.Item>

          <Form.Item
            name="expectedResumeAt"
            label="Expected resume time"
            dependencies={['scheduledStartAt']}
            rules={[{ required: true, message: 'Please select a resume time' }, ({ getFieldValue }) => ({
              validator: validateExpectedResumeAt(getFieldValue('scheduledStartAt'))
            })]}
          >
            <DatePicker
              showTime
              format="MMM D, YYYY HH:mm"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                const start = form.getFieldValue('scheduledStartAt')
                if (!start) return current && current < dayjs().startOf('day')
                return current && current < dayjs(start)
              }}
              minuteStep={15}
            />
          </Form.Item>
        </>
      )}

      <Form.Item
        name="reasonPreset"
        label="Reason preset"
        rules={[{ required: true, message: 'Please select a reason' }]}
      >
        <Select options={REASON_PRESET_OPTIONS} />
      </Form.Item>

      {reasonPreset === REASON_PRESET_OTHER ? (
        <Form.Item
          name="reason"
          label="Custom reason"
          rules={[{ required: true, message: 'Please provide a reason' }]}
        >
          <Input placeholder="Enter custom reason" />
        </Form.Item>
      ) : null}

      <Form.Item
        name="message"
        label="Maintenance message"
        rules={[{ required: true, message: 'Please provide a maintenance message' }]}
      >
        <TextArea
          rows={4}
          placeholder={reasonPreset && PRESET_REASONS[reasonPreset] ? PRESET_REASONS[reasonPreset] : 'Enter maintenance message'}
          maxLength={1000}
          showCount
        />
      </Form.Item>
    </>
  )
}
