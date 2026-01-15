/**
 * Presentation Component: AnalyticsDashboard
 * Pure presentation - no business logic
 */
import React from 'react'
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd'
import { BarChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AnalyticsDashboard({ analytics, loading }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Analytics Overview</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Applications"
              value={analytics.totalApplications || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Approved"
              value={analytics.approved || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Pending Review"
              value={analytics.pending || 0}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
