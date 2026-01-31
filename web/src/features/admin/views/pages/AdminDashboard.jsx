import React from 'react'
import { Layout, Row, Col, Button, Space, Collapse, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { RobotOutlined } from '@ant-design/icons'
import { AdminWorkspaceGate } from '@/features/admin'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { SecurityAlertsWidget, TamperIncidentsPanel } from '@/features/admin'
import AIModelMetrics from '../components/AIModelMetrics'

const { Title } = Typography

export default function AdminDashboard() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col xs={24} lg={20} xl={18}>
            <h2>Admin Dashboard</h2>
            <p>Role-based administration workspace.</p>
            <Space style={{ marginBottom: 12 }}>
              <Link to="/admin/create-role"><Button type="primary">Create Role (Static)</Button></Link>
              <Link to="/admin/full"><Button>Open Full Dashboard</Button></Link>
            </Space>
            <AdminWorkspaceGate />
            <div style={{ marginTop: 16 }}>
              <SecurityAlertsWidget alerts={[]} />
              <div style={{ marginTop: 12 }}>
                <TamperIncidentsPanel />
              </div>
            </div>

            {/* AI Model Metrics Section */}
            <div style={{ marginTop: 24 }}>
              <Collapse
                defaultActiveKey={['ai-metrics']}
                items={[
                  {
                    key: 'ai-metrics',
                    label: (
                      <Space>
                        <RobotOutlined />
                        <span>AI Model Monitoring</span>
                      </Space>
                    ),
                    children: <AIModelMetrics />,
                  },
                ]}
              />
            </div>
          </Col>
        </Row>
      </Layout.Content>
    </Layout> 
  )
}
