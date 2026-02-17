import React from 'react'
import { Row, Col, Space, Collapse } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { TamperIncidentsPanel } from '@/features/admin'
import AIModelMetrics from '../components/AIModelMetrics'

export default function AdminDashboard() {
  return (
    <AdminLayout pageTitle="Admin Dashboard">
      <Row justify="center">
        <Col xs={24} lg={20} xl={18}>
          <p style={{ marginBottom: 16 }}>Role-based administration workspace. Use the sidebar to navigate.</p>
          <div style={{ marginTop: 16 }}>
            <TamperIncidentsPanel />
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
