import { Layout, Button, Typography, Space, theme, Grid } from 'antd'
import { Link } from 'react-router-dom'
import { BankOutlined, LoginOutlined } from '@ant-design/icons'

const { Header } = Layout
const { Title, Text } = Typography
const { useToken } = theme
const { useBreakpoint } = Grid

export default function HomeHeader() {
  const { token } = useToken()
  const screens = useBreakpoint()

  return (
    <Header style={{ 
      background: '#fff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: screens.md ? '0 50px' : '0 16px', 
      height: '72px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          background: 'linear-gradient(135deg, #003a70 0%, #0050b3 100%)', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 58, 112, 0.25)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <BankOutlined style={{ fontSize: '26px', color: '#fff' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: '#003a70', fontSize: screens.sm ? '20px' : '18px' }}>BizClear</Title>
          <Text type="secondary" style={{ fontSize: '11px', letterSpacing: '0.5px', display: screens.xs ? 'none' : 'block' }}>DAGUPAN CITY PORTAL</Text>
        </div>
      </div>
      <Space size={screens.sm ? 'middle' : 'small'}>
        <Link to="/login">
          <Button type="text" icon={<LoginOutlined />}>Log In</Button>
        </Link>
        <Link to="/sign-up">
          <Button type="primary" style={{ background: '#003a70' }}>{screens.sm ? 'Register Business' : 'Register'}</Button>
        </Link>
      </Space>
    </Header>
  )
}
