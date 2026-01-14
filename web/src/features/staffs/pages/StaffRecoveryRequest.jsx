import { Layout, Row, Col, Card, Divider, Typography } from 'antd'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { RecoveryRequestForm, RecoveryRequestStatus, TemporaryCredentialsLogin, TempLoginMfaPrompt } from '../components'
import { useState } from 'react'

const { Title, Text } = Typography

export default function StaffRecoveryRequest() {
  const [loggedInTemp, setLoggedInTemp] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={2} style={{ marginBottom: 8 }}>Account Recovery</Title>
            <Text type="secondary">Request admin-assisted recovery or use temporary credentials.</Text>
          </Col>

          <Col xs={24} md={14}>
            <Card title="Request Admin Review" bordered>
              <RecoveryRequestForm />
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card title="Recovery Status" bordered style={{ marginBottom: 16 }}>
              <RecoveryRequestStatus />
            </Card>
            <Card title="Temporary Credentials Login" bordered>
              <TemporaryCredentialsLogin onSuccess={() => setLoggedInTemp(true)} />
              {loggedInTemp && (
                <>
                  <Divider />
                  <TempLoginMfaPrompt onSetup={() => window.location.assign('/mfa/setup')} />
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
