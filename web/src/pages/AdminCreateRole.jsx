import React from 'react'
import { Layout, Card, Form, Input, Button, Select, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export default function AdminCreateRole() {
  const noop = (e) => { e && e.preventDefault() }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0b0c1a' }}>
      <Layout.Content style={{ padding: 48 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ color: '#fff', marginBottom: 12 }}>
            <Title style={{ color: '#fff', margin: 0 }}>Create Role (Static)</Title>
            <Paragraph style={{ color: '#cfd4ff' }}>Static form for creating other roles</Paragraph>
            <div style={{ marginTop: 8 }}>
              <Link to="/admin"><Button type="default">Back</Button></Link>
            </div>
          </div>

          <Card bodyStyle={{ padding: 20, borderRadius: 8 }}>
            <Form layout="vertical" onFinish={noop}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a name' }]}>
                <Input placeholder="Full name" />
              </Form.Item>

              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter an email' }]}>
                <Input placeholder="email@example.com" />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter a password' }]}>
                <Input.Password placeholder="Password" />
              </Form.Item>

              <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Please select a role' }]}>
                <Select placeholder="Select role">
                  <Select.Option value="lgu-officer">LGU Officer</Select.Option>
                  <Select.Option value="lgu-manager">LGU Manager</Select.Option>
                  <Select.Option value="inspector">Inspector</Select.Option>
                  <Select.Option value="cs-officer">Customer Support Officer</Select.Option>
                </Select>
              </Form.Item>

              {/* Placeholders for messages (hidden by default) */}
              <div style={{ minHeight: 36 }}>
                <div id="create-role-success" style={{ display: 'none', color: 'green' }} />
                <div id="create-role-error" style={{ display: 'none', color: 'red' }} />
              </div>

              <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" htmlType="submit" onClick={noop}>Create</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Layout.Content>
    </Layout>
  )
}
