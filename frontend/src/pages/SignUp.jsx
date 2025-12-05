import React from 'react'
import { Layout, Tabs, Row, Col } from 'antd'
import { CustomerSignUpForm, ProviderSignUpForm } from '@/features/authentication'

export default function SignUp() {
  const items = [
    { key: 'customer', label: 'Customer', children: <CustomerSignUpForm /> },
    { key: 'provider', label: 'Provider', children: <ProviderSignUpForm /> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col xs={24} md={20} lg={16} xl={14}>
            <Tabs items={items} />
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}