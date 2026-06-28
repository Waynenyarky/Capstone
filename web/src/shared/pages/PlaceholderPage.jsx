import { Layout, Button, Result, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Content } = Layout

export default function PlaceholderPage({ title = "Under Construction" }) {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Content style={{ padding: 32 }}>
        <div style={{ background: '#fff', padding: 48, borderRadius: token.borderRadiusLG, minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
