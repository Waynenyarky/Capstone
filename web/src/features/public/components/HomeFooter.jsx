import { Layout, Typography, Space, Divider } from 'antd'
import { Link } from 'react-router-dom'

const { Footer } = Layout
const { Text } = Typography

export default function HomeFooter() {
  return (
    <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.45)', padding: '40px 0' }}>
      <Space direction="vertical" size="small">
        <Text strong style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>BizClear Portal</Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)' }}>The Official Business Permit System of Dagupan City</Text>
        
        <Space size="middle" style={{ marginTop: 8 }}>
          <Link to="/terms" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Terms of Service</Link>
          <Text style={{ color: 'rgba(255,255,255,0.25)' }}>|</Text>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Privacy Policy</Link>
        </Space>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0', width: '200px', minWidth: '200px' }} />
        <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>© 2026 City Government of Dagupan. All Rights Reserved.</Text>
      </Space>
    </Footer>
  )
}
