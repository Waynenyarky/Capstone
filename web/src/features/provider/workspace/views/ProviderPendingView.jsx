import React from 'react'
import { Row, Col, Card, Typography } from 'antd'
import { LogoutForm } from "@/features/authentication"

export default function ProviderPendingView() {
  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        <LogoutForm />
      </Col>
      <Col span={16}>
        <Card title="Provider Application Pending">
          <Typography.Paragraph>
            Thank you for submitting your application. Our staff will review it shortly.
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            Please come back later once your application has been reviewed.
          </Typography.Text>
        </Card>
      </Col>
    </Row>
  )
}