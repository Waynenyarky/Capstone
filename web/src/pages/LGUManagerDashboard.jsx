import React from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export default function LGUManagerDashboard() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Layout.Content style={{ padding: 32 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <Title level={2}>LGU Manager</Title>
            <Paragraph type="secondary">Quick links for LGU Manager workspace.</Paragraph>
            <div style={{ marginTop: 12 }}>
              <Link to="/">
                <Button type="default">Back</Button>
              </Link>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
              <Card hoverable bodyStyle={{ padding: 12 }}>
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
        </div>
      </Layout.Content>
    </Layout>
  )
}
