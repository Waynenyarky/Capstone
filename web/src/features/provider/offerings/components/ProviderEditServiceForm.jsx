import React from 'react'
import { Card, Typography } from 'antd'
import OfferingFormCard from "@/features/provider/offerings/components/OfferingFormCard.jsx"

export default function ProviderEditServiceForm({ selectedId, offerings = [], serviceMap = {}, isSubmitting, updateOffering }) {
  const selected = offerings.find((o) => String(o.id) === String(selectedId))

  if (!selected) {
    return (
      <Card title="Edit Service" size="small">
        <Typography.Text type="secondary">Select a service from the table to edit its details.</Typography.Text>
      </Card>
    )
  }

  const service = serviceMap[selected.serviceId]
  return (
    <OfferingFormCard
      offering={selected}
      service={service}
      isSubmitting={isSubmitting}
      updateOffering={updateOffering}
    />
  )
}