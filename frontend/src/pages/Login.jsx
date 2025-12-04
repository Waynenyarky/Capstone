import React from 'react'
import { Layout, Row, Col } from 'antd'
import { LoginForm } from '@/features/authentication'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleLoginSuccess = React.useCallback((user) => {
    // Navigate to the main page after a successful login/verification
    navigate('/main')
  }, [navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <LoginForm onSubmit={handleLoginSuccess} />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}