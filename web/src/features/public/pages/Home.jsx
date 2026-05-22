import { Layout, Grid, theme } from 'antd'
import HomeHeader from '../components/HomeHeader'
import HeroSection from '../components/HeroSection'
import TransparencyDashboard from '../components/TransparencyDashboard'
import FaqSection from '../components/FaqSection'
import PermitFormsCarousel from '../components/PermitFormsCarousel'
import ApplicationProcessTimeline from '../components/ApplicationProcessTimeline'
import DownloadableFormsSection from '../components/DownloadableFormsSection'
import OfficeLocationSection from '../components/OfficeLocationSection'
import HomeFooter from '../components/HomeFooter'
import useLandingData from '../hooks/useLandingData.jsx'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const { Content } = Layout
const { useBreakpoint } = Grid

export default function Home() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [showHeader, setShowHeader] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const navigate = useNavigate()

  const navigateWithFade = useCallback((path) => {
    setIsExiting(true)
    setTimeout(() => {
      navigate(path)
    }, 300)
  }, [navigate])

  const {
    announcements,
    maintenanceStatus,
    permitForms,
    publicStats,
    announcementItems,
    hasAnnouncementPanel,
    defaultOpenKey,
  } = useLandingData()

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
  }, [isExiting])
  
  return (
    <>
      <HomeHeader visible={showHeader} onNavigate={navigateWithFade} />
      <Layout style={{
        minHeight: '100vh',
        background: token.colorBgContainer,
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
      }}>
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <HeroSection
          announcements={announcements}
          announcementItems={announcementItems}
          maintenanceStatus={maintenanceStatus}
          hasAnnouncementPanel={hasAnnouncementPanel}
          defaultOpenKey={defaultOpenKey}
          onNavigate={navigateWithFade}
        />
        <div style={{ height: '56px' }} />
        <TransparencyDashboard publicStats={publicStats} />
        <FaqSection />
        <div style={{ height: '56px' }} />
        {permitForms.isEnabled && permitForms.cards.length > 0 && (
          <PermitFormsCarousel
            cards={permitForms.cards}
            sectionDescription={permitForms.sectionDescription}
            screens={screens}
            token={token}
          />
        )}
        <div style={{ height: '56px' }} />
        <ApplicationProcessTimeline />
        <div style={{ height: '56px' }} />
        <DownloadableFormsSection />
        <div style={{ height: '56px' }} />
        <OfficeLocationSection />
      </Content>
      <HomeFooter />
    </Layout>
    </>
  )
}
