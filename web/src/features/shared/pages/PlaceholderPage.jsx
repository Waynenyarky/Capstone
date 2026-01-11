import React from 'react'
import { Layout, Typography, Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Content } = Layout

export default function PlaceholderPage({ title = "Under Construction" }) {
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <Content style={{ padding: 32 }}>
        <div style={{ background: '#fff', padding: 48, borderRadius: 8, minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Result
            status="404"
            title={title}
            subTitle="This page is currently under development."
            extra={<Button type="primary" onClick={() => navigate(-1)}>Go Back</Button>}
          />
        </div>
      </Content>
    </Layout>
  )
}
