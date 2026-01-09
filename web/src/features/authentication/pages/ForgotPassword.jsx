import React from 'react'
import { Layout, Row, Col } from 'antd'
import { PasswordResetFlow } from '@/features/authentication'

export default function ForgotPassword() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col xs={24} md={20} lg={16} xl={12}>
            <PasswordResetFlow />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
