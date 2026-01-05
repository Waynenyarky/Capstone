import React from 'react'
import { Layout, Row, Col } from 'antd'
import { AdminLoginForm } from '@/features/authentication'

export default function AdminLogin() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col style={{ width: 420 }}>
            <h2>Admin Login</h2>
            <AdminLoginForm />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
