import React, { useMemo } from 'react'
import { Modal, Descriptions, Typography, Tag } from 'antd'

export default function ConfirmAddServicesModal({
  open,
  selectedIds = [],
  availableServices = [],
  onConfirm,
  onCancel,
  confirmLoading,
}) {
  const selected = useMemo(() => {
    const set = new Set((selectedIds || []).map(String))
    return (availableServices || []).filter((s) => set.has(String(s.id)))
  }, [selectedIds, availableServices])

  return (
    <Modal
      open={open}
      title="Confirm Add Services"
      okText="Add Services"
      cancelText="Cancel"
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: (selectedIds || []).length === 0 }}
      maskClosable={false}
    >
      <Typography.Paragraph>
        You are about to add the following services to your offerings. You can configure pricing and availability after adding.
      </Typography.Paragraph>
      {selected.length === 0 ? (
        <Typography.Text type="secondary">No services selected.</Typography.Text>
      ) : (
        <Descriptions column={1} bordered size="small">
          {selected.map((s) => (
            <Descriptions.Item key={String(s.id)} label={s.name}>
              <Typography.Text>
                Pricing: {s.pricingMode}{' '}
                {typeof s.priceMin === 'number' && typeof s.priceMax === 'number' ? (
                  <>
                    • Fixed range: {s.priceMin}–{s.priceMax}{' '}
                  </>
                ) : null}
                {typeof s.hourlyRateMin === 'number' && typeof s.hourlyRateMax === 'number' ? (
                  <>
                    • Hourly range: {s.hourlyRateMin}–{s.hourlyRateMax}
                  </>
                ) : null}
              </Typography.Text>
              {s.categoryName ? <div><Tag>{s.categoryName}</Tag></div> : null}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
    </Modal>
  )
}