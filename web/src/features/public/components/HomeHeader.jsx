import { Layout, Button, Typography, Space, Grid, theme } from 'antd'
import { Link } from 'react-router-dom'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'

const { Header } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

export default function HomeHeader() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  return (
    <Header style={{
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: screens.md ? '0 48px' : '0 16px',
      height: '72px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BizClearLogo width={screens.sm ? 40 : 32} />
        <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: token.colorPrimary, fontSize: screens.sm ? '20px' : '18px' }}>BizClear</Title>
      </div>
      <Space size={screens.sm ? 'middle' : 'small'}>
        <Link to="/login">
          <Button>Log In</Button>
        </Link>
        <Link to="/sign-up">
          <Button type="primary">{screens.sm ? 'Register Now' : 'Register'}</Button>
        </Link>
      </Space>
    </Header>
  )
}
