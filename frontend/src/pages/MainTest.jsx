import React from 'react'
import { Layout, Typography, Button, Space } from 'antd'
import { useAuthSession } from '@/features/authentication'
import { useNavigate } from 'react-router-dom'

export default function MainPage() {
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()

  const handleLogout = React.useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          Main Page
        </Typography.Title>
        <Space>
          <Typography.Text style={{ color: '#fff' }}>
            {currentUser ? `Welcome, ${currentUser.name || currentUser.email}` : 'Welcome'}
          </Typography.Text>
          <Button onClick={handleLogout}>Logout</Button>
        </Space>
      </Layout.Header>

      <Layout.Content style={{ padding: 24 }}>
        <Typography.Paragraph>
          This is a simple main page shown after a successful login. Use this as a starting point for your authenticated landing page.
        </Typography.Paragraph>
      </Layout.Content>
    </Layout>
  )
}
