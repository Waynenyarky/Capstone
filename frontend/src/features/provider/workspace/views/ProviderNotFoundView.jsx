import React from 'react'
import { Row, Col, Card, Typography } from 'antd'
import { LogoutForm } from "@/features/authentication"

export default function ProviderNotFoundView() {
  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        <LogoutForm />
      </Col>
      <Col span={16}>
        <Card title="Provider Profile Not Found">
          <Typography.Text type="secondary">We couldn’t find your provider profile. Please try again later or contact support.</Typography.Text>
        </Card>
      </Col>
    </Row>
  )
}