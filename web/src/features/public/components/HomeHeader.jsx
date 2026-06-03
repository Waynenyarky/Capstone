import { Layout, Button, Typography, Space, Grid, theme } from 'antd'
import { useLottie } from 'lottie-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'

const { Header } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

export default function HomeHeader({ visible = true, onNavigate, fadingOut = false }) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const [animationData, setAnimationData] = useState(null)
  
  useEffect(() => {
    fetch('/LogoLottie.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load logo animation:', err))
  }, [])
  
  const options = {
    animationData,
    loop: false,
    autoplay: false,
  }
  
  const { View, play, goToAndStop } = useLottie(options)
  
  const handleMouseEnter = () => {
    goToAndStop(0)
    play()
  }
  
  return (
    <Header style={{
      background: token.colorBgContainer,
      borderBottom: `1px solid ${token.colorBorder}`,
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
      opacity: fadingOut ? 0 : (visible ? 1 : 0),
      transform: fadingOut ? 'translateY(-20px)' : (visible ? 'translateY(0)' : 'translateY(-20px)'),
      transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      pointerEvents: fadingOut ? 'none' : (visible ? 'auto' : 'none'),
    }}>
      <div
        role="button"
        tabIndex={0}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => onNavigate?.('/')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onNavigate?.('/')
          }
        }}
        onMouseEnter={handleMouseEnter}
      >
        <div style={{ width: screens.sm ? 40 : 32, height: screens.sm ? 40 : 32 }}>
          {View}
        </div>
        <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: token.colorText, fontSize: screens.sm ? '20px' : '18px' }}>BizClear</Title>
      </div>
      <Space size={screens.sm ? 'middle' : 'small'}>
        <Button onClick={() => onNavigate?.('/login') }>Log In</Button>
        <Button type="primary" onClick={() => onNavigate?.('/sign-up')}>{screens.sm ? 'Apply Now' : 'Apply'}</Button>
      </Space>
    </Header>
  )
}
