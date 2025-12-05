import React from 'react'
import { Row, Col, Card, Spin } from 'antd'

export default function ProviderLoadingView() {
  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={24}>
        <Card>
          <Spin />
        </Card>
      </Col>
    </Row>
  )
}