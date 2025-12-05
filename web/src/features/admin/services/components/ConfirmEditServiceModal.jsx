import React from 'react'
import { Modal, Descriptions, Typography } from 'antd'

export default function ConfirmEditServiceModal({ open, selected, values, onConfirm, onCancel, confirmLoading }) {
  const v = values || {}
  const pricingMode = v.pricingMode || selected?.pricingMode || 'fixed'
  const priceMin = v.priceMin ?? selected?.priceMin ?? null
  const priceMax = v.priceMax ?? selected?.priceMax ?? null
  const hourlyMin = v.hourlyRateMin ?? selected?.hourlyRateMin ?? null
  const hourlyMax = v.hourlyRateMax ?? selected?.hourlyRateMax ?? null

  return (
    <Modal
      open={open}
      title="Confirm Update Service"
      okText="Save Changes"
      cancelText="Cancel"
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
    >
      <Typography.Paragraph>
        You are about to update service {selected?.name ? `“${selected.name}”` : ''}. Please review the details.
      </Typography.Paragraph>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Name">{v.name ?? selected?.name ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Description">{v.description ?? selected?.description ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Category ID">{v.categoryId ?? selected?.categoryId ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Status">{v.status ?? selected?.status ?? '—'}</Descriptions.Item>
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
      </Descriptions>
    </Modal>
  )
}