import { Button, Typography, Space, Badge, Grid } from 'antd'
import { Link } from 'react-router-dom'
import { UserAddOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function HeroSection() {
  const screens = useBreakpoint()

  return (
    <div style={{ 
      background: 'radial-gradient(circle at 50% -20%, #0050b3 0%, transparent 40%), linear-gradient(135deg, #001529 0%, #003a70 100%)',
      padding: screens.md ? '100px 50px' : '64px 24px',
      textAlign: 'center',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative pattern via CSS gradient - no external image for faster LCP */}
      
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Badge.Ribbon text="Official Portal" color="#faad14" style={{ top: -12, scale: 1.1 }}>
          <div style={{ padding: '40px' }}>
            <Title level={1} style={{ 
              color: '#fff', 
              marginBottom: '24px', 
              fontSize: screens.md ? '56px' : '36px', 
              fontWeight: 800,
              letterSpacing: '-1px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              Streamlined Business Compliance
            </Title>
            
            <Paragraph style={{ 
              fontSize: screens.md ? '20px' : '16px', 
              color: 'rgba(255,255,255,0.9)', 
              marginBottom: '40px', 
              lineHeight: 1.8,
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}>
              Welcome to the <b>BizClear Portal</b> of Dagupan City. 
              Securely manage your business permits, schedule inspections, and stay compliant with local regulations—all in one place.
            </Paragraph>

            <Space size="middle" direction={screens.xs ? 'vertical' : 'horizontal'} style={{ width: screens.xs ? '100%' : 'auto' }}>
              <Link to="/sign-up" style={{ width: '100%' }}>
                <Button type="primary" size="large" icon={<UserAddOutlined />} block={screens.xs} style={{ 
                  height: '56px', 
                  padding: screens.xs ? '0 24px' : '0 48px', 
                  fontSize: '18px', 
                  borderRadius: '12px',
                  background: '#faad14',
                  borderColor: '#faad14',
                  color: '#001529',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(250, 173, 20, 0.4)'
                }}>
                  Get Started
                </Button>
              </Link>
              <Link to="/login" style={{ width: '100%' }}>
                <Button ghost size="large" block={screens.xs} style={{ 
                  height: '56px', 
                  padding: screens.xs ? '0 24px' : '0 48px', 
                  fontSize: '18px', 
                  borderRadius: '12px',
                  fontWeight: 600,
                  borderWidth: '2px'
                }}>
                  Access Account
                </Button>
              </Link>
            </Space>
          </div>
        </Badge.Ribbon>
      </div>
    </div>
  )
}
