import { Layout, Typography, Space, Divider, Row, Col, Grid } from 'antd'
import { Link } from 'react-router-dom'
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'

const { Footer } = Layout
const { Text, Title } = Typography
const { useBreakpoint } = Grid

export default function HomeFooter() {
  const screens = useBreakpoint()

  return (
    <Footer style={{ 
      background: '#001529', 
      color: 'rgba(255,255,255,0.45)', 
      padding: screens.md ? '60px 24px 40px' : '40px 20px 30px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* Main Info */}
          <Col xs={24} md={8}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '8px', fontSize: '18px' }}>
                  BizClear Portal
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.6 }}>
                  The Official Business Permit & Licensing System of Dagupan City, Pangasinan
                </Text>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <SafetyCertificateOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500 }}>
                  Verified Government Portal
                </Text>
              </div>
            </Space>
          </Col>

          {/* Contact Information */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '16px', fontSize: '16px' }}>
              Contact Information
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <PhoneOutlined style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '2px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', display: 'block' }}>
                    <strong>(075) 522-1234</strong>
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    Local: 1234
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MailOutlined style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '2px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', display: 'block' }}>
                    <strong>bplo@dagupan.gov.ph</strong>
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    support@bizclear.dagupan.gov.ph
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '2px' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', display: 'block' }}>
                    City Hall, Dagupan City
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    Pangasinan, Philippines 2400
                  </Text>
                </div>
              </div>
            </Space>
          </Col>

          {/* Quick Links & Credentials */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '16px', fontSize: '16px' }}>
              Quick Links
            </Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Link 
                to="/" 
                style={{ 
                  color: 'rgba(255,255,255,0.75)', 
                  fontSize: '13px',
                  display: 'block',
                  textDecoration: 'none',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.95)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.75)'}
              >
                Home
              </Link>
              <Link 
                to="/terms" 
                style={{ 
                  color: 'rgba(255,255,255,0.75)', 
                  fontSize: '13px',
                  display: 'block',
                  textDecoration: 'none',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.95)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.75)'}
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                style={{ 
                  color: 'rgba(255,255,255,0.75)', 
                  fontSize: '13px',
                  display: 'block',
                  textDecoration: 'none',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.95)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.75)'}
              >
                Privacy Policy
              </Link>
              <a 
                href="https://www.dagupan.gov.ph" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'rgba(255,255,255,0.75)', 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.95)'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.75)'}
              >
                <GlobalOutlined style={{ fontSize: '12px' }} />
                Official City Website
              </a>
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0 24px' }} />

        {/* Bottom Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: screens.xs ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: screens.xs ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <div>
            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>City Government of Dagupan</strong>
            </Text>
            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Business Permit & Licensing Office (BPLO)
            </Text>
          </div>
          <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 City Government of Dagupan. All Rights Reserved.
          </Text>
        </div>
      </div>
    </Footer>
  )
}
