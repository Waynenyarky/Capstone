import React from 'react'
import { Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import { StaffLayout } from '../../views/components'

const { Title, Paragraph } = Typography

export default function LGUOfficerDashboard() {
  return (
    <StaffLayout 
      title="LGU Officer" 
      description="Quick links for LGU Officer workspace."
      roleLabel="LGU Officer"
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
              <Title level={5} style={{ margin: 0 }}>Permit Applications (Review)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Review permit applications</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Cessation (Review)</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Review cessations</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Violations / Inspections</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Log and review inspections</Paragraph>
              <div style={{ marginTop: 8 }}>
                <Button>Open</Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card hoverable styles={{ body: { padding: 12 } }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>Appeals</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Submit or track appeals</Paragraph>
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
