import React from 'react'
import { Row, Col, Card, Typography } from 'antd'

export default function UserWorkspaceGate() {
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <Card title="User Workspace" style={{ marginBottom: 12 }}>
            <Typography.Paragraph>
              Welcome to your workspace! Manage your permit applications, view reports, and more.
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary">
               To manage your account settings (Profile, Security, Email, etc.), please visit the <strong>Profile & Settings</strong> page.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  )
}
