import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Layout, Button, Space } from 'antd'
import { Link } from 'react-router-dom'
import { LogoutForm, DeletionScheduledBanner, useAuthSession } from "@/features/authentication"
import { UserWorkspaceGate } from "@/features/user"
import { AdminWorkspaceGate } from "@/features/admin"


export default function Dashboard() {
  const { currentUser, role } = useAuthSession()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!currentUser) navigate('/login')
  }, [currentUser, navigate])


  return (
    <Layout>
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
        <>
          <UserWorkspaceGate />
          <div style={{ padding: 24 }}>
            <Space>
              <Link to="/profile-static"><Button>View Profile (Static)</Button></Link>
            </Space>
          </div>
        </>
      )}


      {/* Provider feature removed */}


      {currentUser && role === 'admin' && (
        <>
          <AdminWorkspaceGate />
        </>
      )}

    </Layout>
  )
}
