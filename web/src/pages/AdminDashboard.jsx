import React from 'react'
import { Layout, Row, Col, Button, Space } from 'antd'
import { Link } from 'react-router-dom'
import { AdminWorkspaceGate } from '@/features/admin'

export default function AdminDashboard() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <h2>Admin Dashboard</h2>
            <p>Role-based administration workspace.</p>
            <Space style={{ marginBottom: 12 }}>
              <Link to="/admin/create-role"><Button type="primary">Create Role (Static)</Button></Link>
              <Link to="/admin/full"><Button>Open Full Dashboard</Button></Link>
            </Space>
            <AdminWorkspaceGate />
          </Col>
        </Row>
      </Layout.Content>
    </Layout> 
  )
}
