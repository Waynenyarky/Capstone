import { Layout, theme } from 'antd'
import HomeHeader from '../components/HomeHeader'
import HeroSection from '../components/HeroSection'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout

export default function Home() {
  const { token } = theme.useToken()
  
  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      {/*<HomeHeader />*/}
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <HeroSection />
      </Content>
      <HomeFooter />
    </Layout>
  )
}
