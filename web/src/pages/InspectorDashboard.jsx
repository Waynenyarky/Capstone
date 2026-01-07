import React from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import Sidebar from '@/features/authentication/components/Sidebar'

const { Title, Paragraph } = Typography

export default function InspectorDashboard() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Layout.Sider width={260} style={{ background: '#fff' }}>
        <Sidebar />
      </Layout.Sider>
      <Layout.Content style={{ padding: 32 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <Title level={2}>Inspector</Title>
            <Paragraph type="secondary">Quick links for Inspector workspace.</Paragraph>
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
                  <Title level={5} style={{ margin: 0 }}>Violations / Inspections</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>Log or upload inspection reports</Paragraph>
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
