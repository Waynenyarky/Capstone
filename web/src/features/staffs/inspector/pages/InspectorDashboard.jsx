import React from 'react'
import { Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import { StaffLayout } from '../../components'

const { Title, Paragraph } = Typography

export default function InspectorDashboard() {
  return (
    <StaffLayout 
      title="Inspector" 
      description="Quick links for Inspector workspace."
      roleLabel="Inspector"
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
              <Title level={5} style={{ margin: 0 }}>Violations / Inspections</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Log or upload inspection reports</Paragraph>
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
