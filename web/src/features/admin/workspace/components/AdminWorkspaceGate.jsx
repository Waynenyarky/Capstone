import React from 'react'
import { Row, Col } from 'antd'
import { LogoutForm } from "@/features/authentication"
import { UsersTable } from "@/features/admin/users"

export default function AdminWorkspaceGate() {
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <LogoutForm />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <UsersTable />
        </Col>
      </Row>
    </>
  )
}
