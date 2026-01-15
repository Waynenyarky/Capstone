import React from 'react'
import { Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import { StaffLayout } from '../../views/components'

const { Title, Paragraph } = Typography

export default function LGUManagerDashboard() {
  return (
    <StaffLayout 
      title="LGU Manager" 
      description="Quick links for LGU Manager workspace."
      roleLabel="LGU Manager"
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
              <Title level={5} style={{ margin: 0 }}>Reports / Analytics</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>View reports and analytics</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Permit Applications (Overview)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Overview of permit applications</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Cessation (Overview)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Overview of cessations</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Violations / Inspections (Overview)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Overview of inspections and violations</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Appeals (Overview)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Overview of appeals</Paragraph>
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
