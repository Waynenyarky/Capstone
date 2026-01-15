import React from 'react'
import { Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import { StaffLayout } from '../../views/components'

const { Title, Paragraph } = Typography

export default function CSODashboard() {
  return (
    <StaffLayout 
      title="Customer Support Officer" 
      description="Quick links for Customer Support workspace."
      roleLabel="CSO"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Dashboard</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Overview and stats</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Link to="/dashboard"><Button type="primary">Open</Button></Link>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Customer Support / Inquiry</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Handle customer inquiries and tickets</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Profile / Settings</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Manage profile and MFA</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </StaffLayout>
  )
}
