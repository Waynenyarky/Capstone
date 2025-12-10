import React from 'react'
import { Layout, Row, Col, Button } from 'antd'
import { AdminWorkspaceGate } from '@/features/admin'

export default function AdminDashboard() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <h2>Admin Dashboard</h2>
            <p>Role-based administration workspace.</p>
            <AdminWorkspaceGate />
          </Col>
        </Row>
      </Layout.Content>
    </Layout> 
  )
}
