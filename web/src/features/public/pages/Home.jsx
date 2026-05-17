import { Layout, theme } from 'antd'
import HomeHeader from '../components/HomeHeader'
import HeroSection from '../components/HeroSection'
import ApplicationProcessTimeline from '../components/ApplicationProcessTimeline'
import DownloadableFormsSection from '../components/DownloadableFormsSection'
import OfficeLocationSection from '../components/OfficeLocationSection'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout

export default function Home() {
  const { token } = theme.useToken()
  
  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader />
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <HeroSection />
        <div style={{ height: '56px' }} />
        <ApplicationProcessTimeline />
        <div style={{ height: '56px' }} />
        <DownloadableFormsSection />
        <div style={{ height: '56px' }} />
        <OfficeLocationSection />
      </Content>
      <HomeFooter />
    </Layout>
  )
}
