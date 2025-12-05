import React from 'react'
import { Row, Col, Layout } from 'antd'
import { LoginForm, CustomerSignUpForm, ProviderSignUpForm, LogoutForm, PasswordResetFlow } from "@/features/authentication"
import { useAuthSession } from "@/features/authentication"
import { ProviderWorkspaceGate } from "@/features/provider"
import { DeletionScheduledBanner } from "@/features/authentication"
import { CustomerWorkspaceGate } from "@/features/customer"
import { AdminWorkspaceGate } from "@/features/admin"


export default function Dashboard() {
  const { currentUser, role } = useAuthSession()


  return (
    <Layout>
      {!currentUser && (
        <>
          <Row gutter={[12, 12]} style={{ padding: 24 }}>
            <Col span={8}>
              <LoginForm />
            </Col>
            <Col span={8}>
              <CustomerSignUpForm />
            </Col>
            <Col span={8}>
              <ProviderSignUpForm />
            </Col>
          </Row>
          <PasswordResetFlow />
        </>
      )}


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


      {currentUser && !currentUser?.deletionPending && role === 'customer' && (
        <>
          <CustomerWorkspaceGate />
        </>
      )}


      {currentUser && !currentUser?.deletionPending && role === 'provider' && (
        <>
          <ProviderWorkspaceGate />
        </>
      )}


      {currentUser && role === 'admin' && (
        <>
          <AdminWorkspaceGate />
        </>
      )}


    </Layout>
  )
}
