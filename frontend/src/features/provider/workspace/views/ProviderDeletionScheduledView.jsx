import React from 'react'
import { Row, Col } from 'antd'
import { LogoutForm } from "@/features/authentication"
import { DeletionScheduledBanner } from "@/features/authentication"

export default function ProviderDeletionScheduledView() {
  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        <LogoutForm />
      </Col>
      <Col span={16}>
        <DeletionScheduledBanner />
      </Col>
    </Row>
  )
}