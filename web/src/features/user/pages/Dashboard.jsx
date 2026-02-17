import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Layout, Button, Space, Grid } from 'antd'
import { Link } from 'react-router-dom'
import { LogoutForm, DeletionScheduledBanner, useAuthSession } from "@/features/authentication"
import { UserWorkspaceGate } from "@/features/user"
import { AppSidebar as Sidebar } from '@/features/authentication'

const { useBreakpoint } = Grid

export default function Dashboard() {
  const { currentUser, role } = useAuthSession()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!currentUser) navigate('/login')
    if (currentUser && role === 'business_owner') navigate('/business')
    if (currentUser && role === 'admin') navigate('/admin/dashboard')
  }, [currentUser, role, navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout.Content style={{ padding: isMobile ? 16 : 24 }}>
        {/* Dev debug panel removed */}
        {currentUser && currentUser.deletionPending && (
          <>
            <Row gutter={[12, 12]} style={{ padding: isMobile ? 16 : 24 }}>
              <Col span={24}>
                <DeletionScheduledBanner />
              </Col>
            </Row>
            <Row gutter={[12, 12]} style={{ padding: isMobile ? 16 : 24 }}>
              <Col xs={24} sm={12} md={6}>
                <LogoutForm />
              </Col>
            </Row>
          </>
        )}

        {currentUser && !currentUser?.deletionPending && role === 'user' && (
          <UserWorkspaceGate />
        )}

        {/* Provider feature removed */}

      </Layout.Content>
    </Layout>
  )
}
