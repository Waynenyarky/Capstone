import { Layout, Button, Typography, Space, Grid } from 'antd'
import { Link } from 'react-router-dom'
import { LoginOutlined } from '@ant-design/icons'
import BizClearLogo from '@/logo/BizClear.png'

const { Header } = Layout
const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function HomeHeader() {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
        <div style={{
          width: '80px', // Larger than header height to overflow slightly if needed, or just max out visually
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '-10px', // Pull it slightly left if it's too big
          zIndex: 1
        }}>
          <img 
            src={BizClearLogo} 
            alt="BizClear Logo"
            fetchPriority="high"
            style={{ 
              height: '100%', 
              width: '100%',
              objectFit: 'cover' // Changed to cover to fill the circle, or use 'contain' if you want the whole logo visible inside
            }} 
          />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: '#003a70', fontSize: screens.sm ? '20px' : '18px' }}>BizClear</Title>
          <Text type="secondary" style={{ fontSize: '11px', letterSpacing: '0.5px', display: screens.xs ? 'none' : 'block' }}>DAGUPAN CITY PORTAL</Text>
        </div>
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
