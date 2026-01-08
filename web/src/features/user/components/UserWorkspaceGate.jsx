import React from 'react'
import { Row, Col, Card, Typography } from 'antd'
import { LogoutForm, DeleteAccountFlow, LoggedInEmailChangeFlow, LoggedInPasswordChangeFlow } from "@/features/authentication"
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'

export default function UserWorkspaceGate() {
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <LogoutForm />
        </Col>
        <Col span={12}>
          <Card title="User Workspace" style={{ marginBottom: 12 }}>
            <Typography.Paragraph>
              Access workspace tools here. To edit your profile, open the Profile page from the sidebar.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <DeleteAccountFlow />
        <LoggedInEmailChangeFlow />
        <LoggedInPasswordChangeFlow />
        <Col span={8}>
          <LoggedInMfaManager />
        </Col>
      </Row>
    </>
  )
}
