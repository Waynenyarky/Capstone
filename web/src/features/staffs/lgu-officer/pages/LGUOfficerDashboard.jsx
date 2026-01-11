import React from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import Sidebar from '@/features/authentication/components/Sidebar'
import TopBar from '@/features/business-owner/components/TopBar'

const { Title, Paragraph } = Typography

export default function LGUOfficerDashboard() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <Layout>
        <TopBar title="LGU Officer Workspace" roleLabel="LGU Officer" />
        <Layout.Content style={{ padding: 32 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
              <Title level={2}>LGU Officer</Title>
              <Paragraph type="secondary">Quick links for LGU Officer workspace.</Paragraph>
              <div style={{ marginTop: 12 }}>
                <Link to="/">
                  <Button type="default">Back</Button>
                </Link>
              </div>
            </div>

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
        </div>
      </Layout.Content>
      </Layout>
    </Layout>
  )
}
