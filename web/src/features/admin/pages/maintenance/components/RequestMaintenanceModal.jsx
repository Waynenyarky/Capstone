import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Modal, Button, Typography, Drawer, Input, Select } from 'antd'
import { useMaintenanceConflictDetection } from '../hooks/useMaintenanceConflictDetection.js'
import MaintenanceFormFields from './MaintenanceFormFields.jsx'
import MaintenancePreview from './MaintenancePreview.jsx'
import { REASON_PRESET_OPTIONS, REASON_PRESET_OTHER } from '../constants/maintenance.constants.js'

const { Text } = Typography

export default function RequestMaintenanceModal({ open, onCancel, form, onSubmit, submitting, maintenanceActive, isMobile = false, forceScheduleMode = false }) {
  const [formValues, setFormValues] = React.useState({})
  const action = Form.useWatch('action', form)
  const whenToStart = Form.useWatch('whenToStart', form) || (forceScheduleMode ? 'scheduled' : undefined)
  const reasonPreset = Form.useWatch('reasonPreset', form)
  const isEnable = action === 'enable'
  const isScheduled = whenToStart === 'scheduled'
  const isReasonOther = reasonPreset === REASON_PRESET_OTHER
  const scheduledStartAt = Form.useWatch('scheduledStartAt', form)
  const expectedResumeAt = Form.useWatch('expectedResumeAt', form)
  const message = Form.useWatch('message', form)

  const {
    conflicts,
    currentMaintenance,
    hasConflict,
    validateScheduledStartAt,
    validateExpectedResumeAt,
  } = useMaintenanceConflictDetection(open, maintenanceActive, forceScheduleMode)

  React.useEffect(() => {
    if (open && maintenanceActive && !forceScheduleMode) {
      form.setFieldsValue({
        action: 'disable',
        whenToStart: undefined,
        scheduledStartAt: undefined,
        reasonPreset: undefined,
        reason: undefined,
        message: undefined,
      })
    }
  }, [open, maintenanceActive, forceScheduleMode, form])

  React.useEffect(() => {
    if (open && !maintenanceActive) {
      form.setFieldsValue({ action: 'enable' })
    }
  }, [open, maintenanceActive, form])

  React.useEffect(() => {
    if (open) {
      setFormValues(form.getFieldsValue())
    }
  }, [open, form, action, whenToStart, reasonPreset, scheduledStartAt, expectedResumeAt, message])

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values)
    })
  }

  const content = (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="action"
          label="Action"
          rules={[{ required: true, message: 'Please select an action' }]}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" value="enable" checked={isEnable} onChange={() => form.setFieldsValue({ action: 'enable' })} />
              <span>Enable maintenance mode</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" value="disable" checked={!isEnable} onChange={() => form.setFieldsValue({ action: 'disable' })} />
              <span>Disable maintenance mode</span>
            </label>
          </div>
        </Form.Item>

        {!maintenanceActive || forceScheduleMode ? (
          <MaintenanceFormFields
            form={form}
            whenToStart={whenToStart}
            validateScheduledStartAt={validateScheduledStartAt}
            validateExpectedResumeAt={validateExpectedResumeAt}
            maintenanceActive={maintenanceActive}
            forceScheduleMode={forceScheduleMode}
            isMobile={isMobile}
          />
        ) : (
          <div>
            <Form.Item
              name="reasonPreset"
              label="Reason"
              rules={[{ required: true, message: 'Please select a reason' }]}
            >
              <Select options={REASON_PRESET_OPTIONS} />
            </Form.Item>
            {isReasonOther && (
              <Form.Item
                name="reason"
                label="Custom reason"
                rules={[{ required: true, message: 'Please provide a reason' }]}
              >
                <Input placeholder="Enter custom reason" />
              </Form.Item>
            )}
            <Form.Item
              name="message"
              label="Maintenance message"
              rules={[{ required: true, message: 'Please provide a maintenance message' }]}
            >
              <Input.TextArea rows={4} placeholder="Enter maintenance message" maxLength={1000} showCount />
            </Form.Item>
          </div>
        )}

        {isScheduled && hasConflict(scheduledStartAt, expectedResumeAt) && (
          <div style={{ marginTop: 16, padding: 12, background: token.colorErrorBg, border: `1px solid ${token.colorErrorBorder}`, borderRadius: 6 }}>
            <Text type="danger">Warning: This schedule overlaps with an existing maintenance request. Please choose a different time.</Text>
          </div>
        )}

        <MaintenancePreview formValues={formValues} />
      </Form>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer
        title={isEnable ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
        placement="bottom"
        height="80%"
        open={open}
        onClose={onCancel}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleOk} loading={submitting}>
              Submit
            </Button>
          </div>
        }
      >
        {content}
      </Drawer>
    )
  }

  return (
    <Modal
      title={isEnable ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      width={600}
    >
      {content}
    </Modal>
  )
}
