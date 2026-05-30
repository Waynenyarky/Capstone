import { Layout, Button, Typography, Space, Grid, theme } from 'antd'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'

const { Header } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

export default function HomeHeader({ visible = true }) {
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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BizClearLogo width={screens.sm ? 40 : 32} />
        <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: token.colorPrimary, fontSize: screens.sm ? '20px' : '18px' }}>BizClear</Title>
      </div>
      <Space size={screens.sm ? 'middle' : 'small'}>
        <Button onClick={() => {}}>Log In</Button>
        <Button type="primary" onClick={() => {}}>{screens.sm ? 'Register Now' : 'Register'}</Button>
      </Space>
    </Header>
  )
}
