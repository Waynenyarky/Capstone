import React from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import Sidebar from '@/features/authentication/components/Sidebar'

const { Title, Paragraph } = Typography

export default function AdminFullDashboard() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 32 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <Title level={2}>Admin — Full Access</Title>
            <Paragraph type="secondary">Access all administration panels from here.</Paragraph>
            <div style={{ marginTop: 12 }}>
              <Link to="/admin"><Button type="default">Back</Button></Link>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Dashboard</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>System overview and metrics</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>User Management</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage user accounts and roles</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Permit Applications</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>View and manage permit applications</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Cessation</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage cessations and related workflow</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Payments</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Review and reconcile payments</Paragraph>
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
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage violations and inspection records</Paragraph>
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
                  <Paragraph type="secondary" style={{ margin: 0 }}>Review and manage appeals</Paragraph>
                  <div style={{ marginTop: 8 }}>
                    <Button>Open</Button>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card hoverable styles={{ body: { padding: 12 } }}>
                <Space direction="vertical">
                  <Title level={5} style={{ margin: 0 }}>Reports / Analytics</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Generate reports and analytics</Paragraph>
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
                  <Paragraph type="secondary" style={{ margin: 0 }}>Manage admin profile and MFA</Paragraph>
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
