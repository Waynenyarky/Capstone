import React from 'react'
import { Row, Col, Card, Typography } from 'antd'
import { ProviderOnboardingForm } from "@/features/provider"

export default function ProviderOnboardingView({ reload }) {
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <Card title="Provider Onboarding">
            <Typography.Paragraph>
              Let’s set up the services you want to offer. You can configure pricing, availability, and emergency options. You may complete this now or return later.
            </Typography.Paragraph>
            <ProviderOnboardingForm onCompleted={reload} />
          </Card>
        </Col>
      </Row>
    </>
  )
}