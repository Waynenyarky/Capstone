import React from 'react'
import { Layout, Row, Col, Button } from 'antd'
import { LoginForm } from '@/features/authentication'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleLoginSuccess = React.useCallback((user) => {
    // Generic login should never finalize admin sessions; redirect them to admin login
    const role = String(user?.role || '').toLowerCase()
    if (role === 'admin') { navigate('/admin/login'); return }
    if (role === 'business_owner') { navigate('/business'); return }
    navigate('/dashboard')
  }, [navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col>
            <div style={{ marginBottom: 12 }}>
              <Button onClick={() => navigate('/')} style={{ marginBottom: 12 }}>Back</Button>
            </div>
            <LoginForm onSubmit={handleLoginSuccess} />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
