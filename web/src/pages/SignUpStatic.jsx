import React from 'react'
import { Layout, Card, Form, Input, Button, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

export default function SignUpStatic() {
  const noopSubmit = (e) => {
    e && e.preventDefault()
    // intentionally non-functional placeholder
  }

  const labelCol = { span: 24 }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0b1a' }}>
      <Layout.Content style={{ padding: 48 }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ color: '#fff', marginBottom: 18 }}>
            <Title style={{ color: '#fff', margin: 0 }}>Static Sign Up</Title>
            <Paragraph style={{ color: '#cfd4ff' }}>A non-functional static sign-up form for UI/testing.</Paragraph>
            <div style={{ marginTop: 12 }}>
              <Link to="/">
                <Button type="default">Back</Button>
              </Link>
            </div>
          </div>

          <Card bodyStyle={{ padding: 20, borderRadius: 8 }}>
            <Form layout="vertical" onFinish={noopSubmit} labelCol={labelCol}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
                <Input placeholder="Full name" />
              </Form.Item>

              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email' }]}>
                <Input placeholder="email@example.com" />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter a password' }]}>
                <Input.Password placeholder="Password" />
              </Form.Item>

              <Form.Item label="Confirm Password" name="confirmPassword" dependencies={["password"]} rules={[{ required: true, message: 'Please confirm your password' }]}>
                <Input.Password placeholder="Confirm password" />
              </Form.Item>

              <Form.Item label="Contact info" name="contact" rules={[{ required: true, message: 'Please enter contact info' }]}>
                <Input placeholder="Phone or other contact details" />
              </Form.Item>

              {/* Hidden fixed role (non-editable) */}
              <Form.Item name="role" initialValue="Business Owner" style={{ display: 'none' }}>
                <Input type="hidden" />
              </Form.Item>

              {/* Placeholders for messages (rendered but empty by default) */}
              <div style={{ minHeight: 36 }}>
                <div id="signup-success" style={{ display: 'none', color: 'green' }} />
                <div id="signup-error" style={{ display: 'none', color: 'red' }} />
              </div>

              <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" htmlType="submit" onClick={noopSubmit}>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Layout.Content>
    </Layout>
  )
}
