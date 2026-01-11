import { Layout } from 'antd'
import HomeHeader from '../components/HomeHeader'
import HeroSection from '../components/HeroSection'
import ServicesSection from '../components/ServicesSection'
import FAQSection from '../components/FAQSection'
import HowItWorksSection from '../components/HowItWorksSection'
import InfoSection from '../components/InfoSection'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <HomeHeader />
      
      <Content>
        <HeroSection />
        <ServicesSection />
        
        {/* New Professional Sections */}
        <FAQSection />
        <HowItWorksSection />
        
        <InfoSection />
      </Content>

      <HomeFooter />
    </Layout>
  )
}
