import React from 'react'
import { Row, Col, Button, Space, Collapse, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { RobotOutlined } from '@ant-design/icons'
import { AdminWorkspaceGate } from '@/features/admin'
import AdminLayout from '../components/AdminLayout'
import { SecurityAlertsWidget, TamperIncidentsPanel } from '@/features/admin'
import AIModelMetrics from '../components/AIModelMetrics'

const { Title } = Typography

export default function AdminDashboard() {
  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      headerActions={
        <Space>
          <Link to="/admin/create-role">
            <Button type="primary">Create Role (Static)</Button>
          </Link>
          <Link to="/admin/full">
            <Button>Open Full Dashboard</Button>
          </Link>
        </Space>
      }
    >
      <Row justify="center">
        <Col xs={24} lg={20} xl={18}>
          <p>Role-based administration workspace.</p>
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
    </AdminLayout>
  )
}
