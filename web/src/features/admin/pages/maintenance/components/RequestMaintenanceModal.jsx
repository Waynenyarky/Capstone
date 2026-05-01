import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Modal, Input, DatePicker, Select, Button, Typography, Drawer, Collapse, Tag, Divider } from 'antd'
import dayjs from 'dayjs'
import { getMaintenanceConflicts } from '../../../services'
import { get } from '@/lib/http.js'

const { Text, Paragraph, Title } = Typography

const WHEN_TO_START_OPTIONS = [
  { value: 'now', label: 'Start now (after approval)' },
  { value: 'scheduled', label: 'Schedule for date and time' },
]

/** Predefined reason keys; value 'other' means use custom reason. */
export const REASON_PRESET_OTHER = 'other'

export const REASON_PRESET_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled maintenance' },
  { value: 'emergency', label: 'Emergency maintenance' },
  { value: 'upgrade', label: 'System upgrade' },
  { value: 'outage', label: 'Temporary outage' },
  { value: REASON_PRESET_OTHER, label: 'Others' },
]

const PRESET_REASONS = {
  scheduled: 'Scheduled maintenance',
  emergency: 'Emergency maintenance',
  upgrade: 'System upgrade',
  outage: 'Temporary outage',
}

const PRESET_MESSAGES = {
  scheduled: 'We are currently performing scheduled maintenance to improve our services. During this time, the system will be temporarily unavailable. We apologize for any inconvenience this may cause and appreciate your patience. Service will be restored as soon as the maintenance is complete. Please check back later for updates.',
  emergency: 'Our systems are undergoing emergency maintenance to address a critical system issue. Our technical team is working diligently to resolve the matter as quickly as possible. We apologize for the unexpected interruption and appreciate your understanding. Service will be restored once the issue is resolved.',
  upgrade: 'We are performing a system upgrade to enhance our platform and provide you with better service. During this upgrade, the system will be temporarily unavailable. We apologize for any inconvenience and thank you for your patience. The upgraded system will be available shortly.',
  outage: 'We are currently experiencing a temporary service outage due to unforeseen technical difficulties. Our team is actively working to identify and resolve the issue. We sincerely apologize for the disruption and are working to restore full service as soon as possible. Thank you for your patience and understanding.',
}

export function getMaintenanceMessage(values) {
  if (!values) return ''
  return (values.message || '').trim()
}

export default function RequestMaintenanceModal({ open, onCancel, form, onSubmit, submitting, maintenanceActive, isMobile = false, forceScheduleMode = false }) {
  const action = Form.useWatch('action', form)
  const whenToStart = Form.useWatch('whenToStart', form) || (forceScheduleMode ? 'scheduled' : undefined)
  const reasonPreset = Form.useWatch('reasonPreset', form)
  const isEnable = action === 'enable'
  const isScheduled = whenToStart === 'scheduled'
  const isReasonOther = reasonPreset === REASON_PRESET_OTHER
  const scheduledStartAt = Form.useWatch('scheduledStartAt', form)
  const expectedResumeAt = Form.useWatch('expectedResumeAt', form)
  const message = Form.useWatch('message', form)
  const [conflicts, setConflicts] = React.useState([])
  const [currentMaintenance, setCurrentMaintenance] = React.useState({ active: false, scheduled: false })
  const [formValues, setFormValues] = React.useState({})

  const hasConflict = React.useCallback((startValue, endValue) => {
    if (!startValue || !endValue) return false
    const start = dayjs(startValue)
    const end = dayjs(endValue)
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return false
    return conflicts.some((conflict) => {
      // Skip current active maintenance from conflict check
      if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
        const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
        const conflictEnd = dayjs(conflict.endAt || conflict.expectedResumeAt)
        if (conflictEnd.isValid() && conflictEnd.isSame(currentResumeAt)) return false
      }
      const cStart = dayjs(conflict.startAt || conflict.scheduledStartAt)
      const cEnd = dayjs(conflict.endAt || conflict.expectedResumeAt)
      if (!cStart.isValid() || !cEnd.isValid()) return false
      return start.isBefore(cEnd) && cStart.isBefore(end)
    })
  }, [conflicts, maintenanceActive, currentMaintenance])

  const MIN_MAINTENANCE_DURATION_HOURS = 1
  const MAX_MAINTENANCE_DURATION_DAYS = 7
  const MAX_SCHEDULING_HORIZON_DAYS = 30

  // Note: Complex time slot disabling in Ant Design DatePicker is difficult
  // because it requires disabling specific hours/minutes across arbitrary date ranges.
  // The backend validation already prevents overlapping requests, so visual blocking
  // is deferred for now in favor of simpler validation-based approach.

  React.useEffect(() => {
    let alive = true
    async function loadConflicts() {
      if (!open || (maintenanceActive && !forceScheduleMode)) {
        if (alive) setConflicts([])
        return
      }
      try {
        const from = dayjs().startOf('day')
        const to = dayjs().add(90, 'day').endOf('day')
        const result = await getMaintenanceConflicts(from.toISOString(), to.toISOString())
        if (!alive) return
        setConflicts(Array.isArray(result?.conflicts) ? result.conflicts : [])
      } catch {
        if (alive) setConflicts([])
      }
    }
    loadConflicts()
    return () => {
      alive = false
    }
  }, [open, maintenanceActive, forceScheduleMode])

  React.useEffect(() => {
    let alive = true
    async function fetchMaintenanceStatus() {
      if (!open) return
      try {
        const maintenance = await get('/api/maintenance/status', { skipAuth: true }).catch(() => ({ active: false, scheduled: false }))
        if (!alive) return
        setCurrentMaintenance({
          active: !!maintenance?.active,
          scheduled: !!maintenance?.scheduled,
          expectedResumeAt: maintenance?.expectedResumeAt || null,
        })
      } catch {
        if (alive) setCurrentMaintenance({ active: false, scheduled: false })
      }
    }
    fetchMaintenanceStatus()
    return () => {
      alive = false
    }
  }, [open])

  React.useEffect(() => {
    if (open && maintenanceActive && !forceScheduleMode) {
      form.setFieldsValue({
        action: 'disable',
        whenToStart: undefined,
        scheduledStartAt: undefined,
        reasonPreset: undefined,
        reason: undefined,
        message: undefined,
        expectedResumeAt: undefined,
      })
    } else if (open && (!maintenanceActive || forceScheduleMode)) {
      form.resetFields()
      const initialPreset = 'scheduled'
      form.setFieldsValue({
        action: 'enable',
        whenToStart: forceScheduleMode && maintenanceActive ? 'scheduled' : 'now',
        scheduledStartAt: undefined,
        expectedResumeAt: undefined,
        reasonPreset: initialPreset,
        reason: PRESET_REASONS[initialPreset],
        message: PRESET_MESSAGES[initialPreset],
      })
    }
  }, [open, maintenanceActive, form, forceScheduleMode])

  React.useEffect(() => {
    if (!open) return
    const values = form.getFieldsValue()
    setFormValues(values)
  }, [open, form])

  const isEndMaintenanceFlow = maintenanceActive && !forceScheduleMode

  const content = (
    <>
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
          initialValues={{ whenToStart: 'now', action: 'enable' }}
        >
          {(!maintenanceActive || forceScheduleMode) && (
            <Form.Item name="action" hidden>
              <input type="hidden" readOnly />
            </Form.Item>
          )}

          {isEnable && (
            <>
              {forceScheduleMode && (
                <Form.Item name="whenToStart" hidden>
                  <input type="hidden" readOnly />
                </Form.Item>
              )}
              {!forceScheduleMode && (
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
              )}
              {(isScheduled || (forceScheduleMode && maintenanceActive)) && (
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
                        // Check maximum scheduling horizon
                        const maxDate = dayjs().add(MAX_SCHEDULING_HORIZON_DAYS, 'day')
                        if (value.isAfter(maxDate)) {
                          return Promise.reject(new Error(`Maintenance cannot be scheduled more than ${MAX_SCHEDULING_HORIZON_DAYS} days in advance`))
                        }
                        // Check if start time overlaps with current active maintenance
                        if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
                          const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
                          if (value.isBefore(currentResumeAt)) {
                            return Promise.reject(new Error('Start time must be after the current maintenance session ends'))
                          }
                        }
                        if (expectedResumeAt && hasConflict(value, expectedResumeAt)) {
                          return Promise.reject(new Error('Selected schedule overlaps with an existing pending or approved maintenance request. Please choose another time slot.'))
                        }
                        // Check minimum duration
                        if (expectedResumeAt) {
                          const durationHours = expectedResumeAt.diff(value, 'hour', true)
                          if (durationHours < MIN_MAINTENANCE_DURATION_HOURS) {
                            return Promise.reject(new Error(`Maintenance duration must be at least ${MIN_MAINTENANCE_DURATION_HOURS} hour(s)`))
                          }
                          // Check maximum duration
                          const durationDays = expectedResumeAt.diff(value, 'day', true)
                          if (durationDays > MAX_MAINTENANCE_DURATION_DAYS) {
                            return Promise.reject(new Error(`Maintenance duration cannot exceed ${MAX_MAINTENANCE_DURATION_DAYS} day(s)`))
                          }
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
                    disabledDate={(d) => {
                      if (!d) return false
                      const now = dayjs()
                      const maxDate = dayjs().add(MAX_SCHEDULING_HORIZON_DAYS, 'day')
                      if (d.isBefore(now, 'day') || d.isAfter(maxDate)) return true
                      if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
                        const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
                        if (d.isBefore(currentResumeAt, 'day')) return true
                      }
                      return false
                    }}
                    showNow={false}
                  />
                </Form.Item>
              )}
            </>
          )}

          <Form.Item
            name="reasonPreset"
            label="Reason"
            rules={[{ required: true, message: 'Select a reason' }]}
            initialValue="scheduled"
          >
            <Select
              placeholder="Choose a reason"
              options={REASON_PRESET_OPTIONS}
              onChange={(value) => {
                if (value !== REASON_PRESET_OTHER) {
                  form.setFieldValue('reason', PRESET_REASONS[value] || '')
                }
              }}
            />
          </Form.Item>
          {isReasonOther && (
            <Form.Item
              name="reason"
              label="Custom reason"
              rules={[{ required: true, message: 'Enter a reason' }, { max: 100, message: 'Max 100 characters' }]}
            >
              <Input placeholder="Short reason (e.g., Emergency maintenance)" />
            </Form.Item>
          )}
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Enter a message' }, { max: 500, message: 'Max 500 characters' }]}
          >
            <Input.TextArea placeholder="Detailed message shown to users" rows={3} />
          </Form.Item>
          <Form.Item
            name="expectedResumeAt"
            label="Expected resume time"
            rules={[
              { required: true, message: 'Select expected resume time' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  if (value.isBefore(dayjs(), 'minute')) {
                    return Promise.reject(new Error('Resume time must be in the future'))
                  }
                  // Check for conflicts with existing maintenance
                  const startValue = (isScheduled || forceScheduleMode) ? scheduledStartAt : dayjs()
                  if (startValue && hasConflict(startValue, value)) {
                    return Promise.reject(new Error('Selected schedule overlaps with an existing pending or approved maintenance request. Please choose another time slot.'))
                  }
                  // Check if resume time overlaps with current active maintenance
                  if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
                    const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
                    if (value.isBefore(currentResumeAt)) {
                      return Promise.reject(new Error('Resume time must be after the current maintenance session ends'))
                    }
                  }
                  // Check minimum duration
                  if (startValue) {
                    const durationHours = value.diff(startValue, 'hour', true)
                    if (durationHours < MIN_MAINTENANCE_DURATION_HOURS) {
                      return Promise.reject(new Error(`Maintenance duration must be at least ${MIN_MAINTENANCE_DURATION_HOURS} hour(s)`))
                    }
                    // Check maximum duration
                    const durationDays = value.diff(startValue, 'day', true)
                    if (durationDays > MAX_MAINTENANCE_DURATION_DAYS) {
                      return Promise.reject(new Error(`Maintenance duration cannot exceed ${MAX_MAINTENANCE_DURATION_DAYS} day(s)`))
                    }
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
              disabledDate={(d) => {
                if (!d) return false
                const now = dayjs()
                const maxDate = dayjs().add(MAX_SCHEDULING_HORIZON_DAYS, 'day').add(MAX_MAINTENANCE_DURATION_DAYS, 'day')
                if (d.isBefore(now, 'day') || d.isAfter(maxDate)) return true
                if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
                  const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
                  if (d.isBefore(currentResumeAt, 'day')) return true
                }
                return false
              }}
              showNow={false}
            />
          </Form.Item>

          {isEnable && !currentMaintenance.active && (
            <>
              <div style={{ marginTop: 16 }}>
                <Text style={{ marginBottom: 12, display: 'block' }}>Live Landing Page Preview</Text>
                <Collapse
                  items={[
                    {
                      key: 'maintenance-preview',
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{isScheduled ? 'Scheduled Maintenance' : 'Maintenance Underway'}</span>
                          <Tag color="blue" size="small">PREVIEW</Tag>
                        </div>
                      ),
                      children: (
                        <div>
                          <Paragraph style={{ marginBottom: 12 }}>
                            {formValues.message || message || 'No message'}
                          </Paragraph>
                          {isScheduled && (formValues.scheduledStartAt || scheduledStartAt) && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                              Starts: {dayjs(formValues.scheduledStartAt || scheduledStartAt).format('MMM D, YYYY h:mm A')}
                            </Text>
                          )}
                          {!isScheduled && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                              Starts: After approval
                            </Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 0 }}>
                            Expected resume time: {formValues.expectedResumeAt || expectedResumeAt ? dayjs(formValues.expectedResumeAt || expectedResumeAt).format('MMM D, YYYY h:mm A') : 'Not set'}
                          </Text>
                        </div>
                      ),
                    },
                  ]}
                  defaultActiveKey={['maintenance-preview']}
                  style={{ background: '#fafafa' }}
                />
              </div>
            </>
          )}
        </Form>
      )}
    </>
  )

  const footer = [
    <Button key="cancel" onClick={onCancel}>
      Cancel
    </Button>,
    <Button key="submit" type="primary" loading={submitting} onClick={onSubmit}>
      {isEndMaintenanceFlow ? 'Request to end maintenance' : 'Submit for approval'}
    </Button>,
  ]

  const mobileFooter = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      {footer}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        title={isEndMaintenanceFlow ? 'Request to end maintenance' : 'Request maintenance change'}
        open={open}
        onClose={onCancel}
        footer={mobileFooter}
        placement="bottom"
        height={isEndMaintenanceFlow ? '50%' : '100%'}
        destroyOnClose
      >
        {content}
      </Drawer>
    )
  }

  return (
    <Modal
      title={isEndMaintenanceFlow ? 'Request to end maintenance' : 'Request maintenance change'}
      open={open}
      onCancel={onCancel}
      footer={footer}
      width={560}
      destroyOnHidden
    >
      {content}
    </Modal>
  )
}
