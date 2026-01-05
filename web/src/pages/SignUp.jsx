import React from 'react'
import { Layout, Tabs, Row, Col, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { UserSignUpForm } from '@/features/authentication'

export default function SignUp() {
  const navigate = useNavigate()
  const items = [
    { key: 'user', label: 'User', children: <UserSignUpForm /> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col xs={24} md={20} lg={16} xl={14}>
            <div style={{ marginBottom: 12 }}>
              <Button onClick={() => navigate('/')} style={{ marginBottom: 12 }}>Back</Button>
            </div>
            <Tabs items={items} />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
