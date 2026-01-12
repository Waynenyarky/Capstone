import React from 'react'
import { Layout, Card, Form, Button, Typography, Row, Col, Tag } from 'antd'
import { Link } from 'react-router-dom'
import useProfile from '@/features/authentication/hooks/useProfile'
import AppSidebar from './AppSidebar'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'

const { Title, Paragraph, Text } = Typography

export default function Profile() {
  const { user } = useProfile()
  const noop = (e) => { e && e.preventDefault() }
  const editableStyle = { border: '1px dashed rgba(0,0,0,0.12)', padding: 8, borderRadius: 6, background: '#fff' }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout.Content style={{ padding: 40, background: '#f6f8fb' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Title level={3}>Profile</Title>
            <Paragraph type="secondary">All fields are visible. Editable fields are visually indicated but do not submit changes.</Paragraph>
          </div>

          <Card styles={{ body: { padding: 20 } }}>
            <Form layout="vertical" onFinish={noop}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Name">
                    <div style={editableStyle}>
                      <Text strong>{user.name}</Text>
                    </div>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Email">
                    <div style={{ padding: 8 }}>
                      <Text>{user.email}</Text>
                    </div>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Role">
                    <div style={{ padding: 8 }}>
                      <Tag color="blue">{user.role}</Tag>
                    </div>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="MFA Status">
                    <div style={{ padding: 8 }}>
                      {user.mfaEnabled ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>}
                    </div>
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Fields with dashed border are editable visually.</Text>
              </div>

              <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button style={{ marginRight: 8 }} onClick={noop}>Cancel</Button>
                <Button type="primary" onClick={noop}>Save</Button>
              </Form.Item>
            </Form>
          </Card>

          <div style={{ marginTop: 24 }}>
            <EditUserProfileForm />
          </div>
        </div>
      </Layout.Content>
    </Layout>
  )
}
