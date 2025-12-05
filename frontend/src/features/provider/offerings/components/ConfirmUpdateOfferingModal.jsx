import React from 'react'
import { Modal, Descriptions, Typography, Tag } from 'antd'
import dayjs from 'dayjs'
import { WEEK_DAYS } from '@/features/provider/constants.js'

export default function ConfirmUpdateOfferingModal({
  open,
  offering,
  values,
  onConfirm,
  onCancel,
  confirmLoading,
  okDisabled,
}) {
  const v = values || {}
  const pricingMode = v.pricingMode || offering?.pricingMode || 'fixed'
  const fixedPrice = typeof v.fixedPrice === 'number' ? v.fixedPrice : offering?.fixedPrice ?? null
  const hourlyRate = typeof v.hourlyRate === 'number' ? v.hourlyRate : offering?.hourlyRate ?? null
  const emergencyAvailable = v.emergencyAvailable ?? !!offering?.emergencyAvailable
  const active = v.active ?? !!offering?.active

  const availabilityLines = WEEK_DAYS.map((day) => {
    const d = v?.availability?.[day] || {}
    const available = !!d.available
    const start = d.startTime ? dayjs(d.startTime).format('HH:mm') : null
    const end = d.endTime ? dayjs(d.endTime).format('HH:mm') : null
    const label = day.toUpperCase()
    if (!available) return `${label}: Not available`
    if (start && end) return `${label}: ${start}–${end}`
    if (start) return `${label}: from ${start}`
    if (end) return `${label}: until ${end}`
    return `${label}: Available`
  })

  return (
    <Modal
      open={open}
      title="Confirm Update Service"
      okText="Save Changes"
      cancelText="Cancel"
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !!okDisabled }}
      maskClosable={false}
    >
      <Typography.Paragraph>
        You are about to update your offering for {offering?.serviceName ? `“${offering.serviceName}”` : 'this service'}. Please review the summary.
      </Typography.Paragraph>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Service">{offering?.serviceName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Pricing Mode">{pricingMode}</Descriptions.Item>
        {(pricingMode === 'fixed' || pricingMode === 'both') && (
          <Descriptions.Item label="Fixed Price">{typeof fixedPrice === 'number' ? fixedPrice : '—'}</Descriptions.Item>
        )}
        {(pricingMode === 'hourly' || pricingMode === 'both') && (
          <Descriptions.Item label="Hourly Rate">{typeof hourlyRate === 'number' ? hourlyRate : '—'}</Descriptions.Item>
        )}
        <Descriptions.Item label="Emergency Available">
          {emergencyAvailable ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Active">
          {active ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Description">{v.providerDescription || offering?.providerDescription || '—'}</Descriptions.Item>
        <Descriptions.Item label="Weekly Availability">
          <Typography.Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
            {availabilityLines.join('\n')}
          </Typography.Paragraph>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}