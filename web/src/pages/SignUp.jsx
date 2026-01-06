// SignUp.jsx — BizClear themed two-column signup page
import React from 'react'
import { Layout, Row, Col, Button, Typography } from 'antd'
import { UserSignUpForm } from '@/features/authentication'

const { Title, Paragraph } = Typography

export default function SignUp() {

  return (
    <Layout style={{ minHeight: '100vh', background: '#060617' }}>
      <Layout.Content style={{ padding: '48px 40px' }}>
        <Row gutter={[32, 32]} justify="space-between" align="middle">
          <Col xs={24} md={14} lg={16}>
            <div style={{ color: '#fff', padding: '40px 24px' }}>
              <div style={{ maxWidth: 720 }}>
                <Title style={{ color: '#fff', marginTop: 12, lineHeight: 1.02 }}>BizClear</Title>
                <Paragraph style={{ color: '#cfd4ff', fontSize: 16 }}>
                  A Blockchain-Enhanced Business Permit Processing and Inspection Tracking System with AI-assisted document validation
                </Paragraph>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10} lg={8}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: 30 }}>
              <div style={{ width: '100%', maxWidth: 600, background: 'linear-gradient(180deg,#17123a,#2b1a54)', padding: 22, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', color: '#fff' }}>
                <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <UserSignUpForm />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  )
}
