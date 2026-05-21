import { Layout, theme } from 'antd'
import HomeHeader from '../components/HomeHeader'
import HeroSection from '../components/HeroSection'
import HomeFooter from '../components/HomeFooter'
import { useState, useEffect } from 'react'

const { Content } = Layout

export default function Home() {
  const { token } = theme.useToken()
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('[data-hero-section]')
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom
        setShowHeader(heroBottom <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      {showHeader && <HomeHeader />}
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <HeroSection />
      </Content>
      <HomeFooter />
    </Layout>
  )
}
