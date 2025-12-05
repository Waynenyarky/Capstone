import React from 'react'
import { Modal, Descriptions, Typography } from 'antd'

export default function ConfirmCreateServiceModal({ open, values, onConfirm, onCancel, confirmLoading }) {
  const v = values || {}
  const pricingMode = v.pricingMode || 'fixed'
  const priceMin = v.priceMin ?? null
  const priceMax = v.priceMax ?? null
  const hourlyMin = v.hourlyRateMin ?? null
  const hourlyMax = v.hourlyRateMax ?? null
  const hasImage = Array.isArray(v.image) ? v.image.length > 0 : false

  return (
    <Modal
      open={open}
      title="Confirm Create Service"
      okText="Create"
      cancelText="Cancel"
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
    >
      <Typography.Paragraph>
        Please confirm the details before creating this service.
      </Typography.Paragraph>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Name">{v.name || '—'}</Descriptions.Item>
        <Descriptions.Item label="Description">{v.description || '—'}</Descriptions.Item>
        <Descriptions.Item label="Category ID">{v.categoryId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Status">{v.status || '—'}</Descriptions.Item>
        <Descriptions.Item label="Pricing Mode">{pricingMode}</Descriptions.Item>
        {(pricingMode === 'fixed' || pricingMode === 'both') && (
          <Descriptions.Item label="Fixed Price Range">
            {priceMin ?? '—'} to {priceMax ?? '—'}
          </Descriptions.Item>
        )}
        {(pricingMode === 'hourly' || pricingMode === 'both') && (
          <Descriptions.Item label="Hourly Rate Range">
            {hourlyMin ?? '—'} to {hourlyMax ?? '—'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Image Provided">{hasImage ? 'Yes' : 'No'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}