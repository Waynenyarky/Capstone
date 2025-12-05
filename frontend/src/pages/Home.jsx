import { Layout, Button, Flex, Typography } from 'antd'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
        <Flex style={{ width: '100%' }} justify="space-between" align="center">
          <Typography.Text style={{ color: '#fff', fontWeight: 600 }}>Home Care</Typography.Text>
          <Flex gap="small">
            <Link to="/login"><Button>Login</Button></Link>
            <Link to="/sign-up"><Button type="primary">Sign Up</Button></Link>
          </Flex>
        </Flex>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        {/* TODO: Add hero/sections later. Keeping minimal for now. */}
      </Layout.Content>
    </Layout>
  )
}