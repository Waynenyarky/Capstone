import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Layout, Button, Space } from 'antd'
import { Link } from 'react-router-dom'
import { LogoutForm, DeletionScheduledBanner, useAuthSession } from "@/features/authentication"
import { UserWorkspaceGate } from "@/features/user"
import { AdminWorkspaceGate } from "@/features/admin"
import Sidebar from '@/features/authentication/components/Sidebar'


export default function Dashboard() {
  const { currentUser, role } = useAuthSession()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!currentUser) navigate('/login')
    if (currentUser && role === 'business_owner') navigate('/business')
  }, [currentUser, role, navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={260} style={{ background: '#fff' }}>
        <Sidebar />
      </Layout.Sider>
      <Layout.Content>
        {/* Dev debug panel removed */}
        {currentUser && currentUser.deletionPending && (
          <>
            <Row gutter={[12, 12]} style={{ padding: 24 }}>
              <Col span={24}>
                <DeletionScheduledBanner />
              </Col>
            </Row>
            <Row gutter={[12, 12]} style={{ padding: 24 }}>
              <Col span={6}>
                <LogoutForm />
              </Col>
            </Row>
          </>
        )}

        {currentUser && !currentUser?.deletionPending && role === 'user' && (
          <UserWorkspaceGate />
        )}

        {/* Provider feature removed */}

        {currentUser && role === 'admin' && (
          <>
            <AdminWorkspaceGate />
          </>
        )}
      </Layout.Content>
    </Layout>
  )
}
