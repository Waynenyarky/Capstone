import React from 'react'
import { Layout, Row, Col, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <h2>Admin Dashboard (Placeholder)</h2>
            <p>This page should be protected by role-based checks (frontend guard + backend enforcement).</p>
            <Button onClick={() => navigate('/')}>Home</Button>
          </Col>
        </Row>
      </Layout.Content>
    </Layout> 
  )
}
