import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Layout } from 'antd'
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
