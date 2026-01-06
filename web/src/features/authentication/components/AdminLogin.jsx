import React from 'react'
import { Layout, Row, Col, Button } from 'antd'
import { AdminLoginForm } from '@/features/authentication'
import { Link } from 'react-router-dom'

export default function AdminLogin() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col style={{ width: 420 }}>
            <h2>Admin Login</h2>
            <div style={{ marginBottom: 12 }}>
              <Link to="/">
                <Button type="default">Back</Button>
              </Link>
            </div>
            <AdminLoginForm />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
