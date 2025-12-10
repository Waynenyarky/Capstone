import React from 'react'
import { Layout, Row, Col, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { AdminWorkspaceGate } from '@/features/admin'

export default function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <h2>Admin Dashboard</h2>
            <p>Role-based administration workspace.</p>
            <div style={{ marginBottom: 12 }}>
              <Button onClick={() => navigate('/')}>Home</Button>
            </div>
            <AdminWorkspaceGate />
          </Col>
        </Row>
      </Layout.Content>
    </Layout> 
  )
}
