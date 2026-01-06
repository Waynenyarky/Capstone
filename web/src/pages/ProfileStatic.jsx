import React from 'react'
import { Layout, Card, Form, Input, Button, Typography, Row, Col, Tag } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

export default function ProfileStatic() {
  // static example values
  const user = {
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.com',
    role: 'Business Owner',
    mfaEnabled: true,
  }

  const noop = (e) => { e && e.preventDefault() }

  const editableStyle = { border: '1px dashed rgba(0,0,0,0.12)', padding: 8, borderRadius: 6, background: '#fff' }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f6f8fb' }}>
      <Layout.Content style={{ padding: 40 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Title level={3}>Profile (Static)</Title>
            <Paragraph type="secondary">All fields are visible. Editable fields are visually indicated but do not submit changes.</Paragraph>
            <div style={{ marginTop: 8 }}>
              <Link to="/dashboard"><Button type="default">Back</Button></Link>
            </div>
          </div>

          <Card bodyStyle={{ padding: 20 }}>
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

              {/* Visual editable indicators for email and name (no submission) */}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Fields with dashed border are editable visually.</Text>
              </div>

              <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button style={{ marginRight: 8 }} onClick={noop}>Cancel</Button>
                <Button type="primary" onClick={noop}>Save</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Layout.Content>
    </Layout>
  )
}
