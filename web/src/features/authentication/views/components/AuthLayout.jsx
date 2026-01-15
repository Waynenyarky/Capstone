import React from 'react'
import { Layout, Row, Col, Typography, ConfigProvider, theme, Button, Card, Grid } from 'antd'
import { ArrowLeftOutlined, SafetyCertificateOutlined, ScheduleOutlined, SyncOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import BizClearLogo from '@/logo/BizClear.png'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

/**
 * AuthLayout Component
 * Implements a split-screen design for authentication pages.
 * Left side: Branding/Marketing content with a professional blue theme.
 * Right side: The authentication form (Login, SignUp, etc.) on a clean white background.
 */
export default function AuthLayout({ 
  children, 
  title = "BizClear",
  subtitle = "DAGUPAN CITY PORTAL",
  description = "Welcome to the BizClear Portal of Dagupan City. Securely manage your business permits, schedule inspections, and stay compliant with local regulations—all in one place.",
  formMaxWidth = 440 // Default width for form container
}) {
  const navigate = useNavigate();
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isTablet = screens.md && !screens.lg

  const { token } = theme.useToken()

  const features = [
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 24 }} />,
      title: "Permit Application",
      desc: "Submit new business permit applications digitally. Upload requirements and track status in real-time."
    },
    {
      icon: <ScheduleOutlined style={{ fontSize: 24 }} />,
      title: "Inspection Scheduling",
      desc: "Schedule and monitor inspections. Receive digital updates and results directly in the system."
    },
    {
      icon: <SyncOutlined style={{ fontSize: 24 }} />,
      title: "Permit Renewal",
      desc: "Renew existing permits before expiry. Automated reminders and simplified renewal tracking."
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', height: isMobile ? 'auto' : '100vh', overflow: 'hidden', background: '#fff' }}>
      <Row style={{ 
        height: isMobile ? 'auto' : '100%', 
        minHeight: isMobile ? '100vh' : '100%',
        margin: 0
      }}>
        {/* Left Side - Branding (Hidden on Mobile) */}
        {!isMobile && (
          <Col 
            md={12} lg={12} 
            style={{ 
              background: 'radial-gradient(circle at 50% -20%, #0050b3 0%, transparent 40%), linear-gradient(135deg, #001529 0%, #003a70 100%)',
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '40px 60px',
              position: 'relative',
              overflow: 'hidden',
              height: '100%'
            }}
          >
          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("https://gw.alipayobjects.com/zos/rmsportal/FfdJeJRQWjEeGTpqgBKj.png") center top no-repeat', opacity: 0.1, pointerEvents: 'none' }} />

          {/* Top Navigation */}
          <div style={{ zIndex: 2 }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
              style={{ color: 'white', padding: 0, fontSize: 16 }}
            >
              Back to Home
            </Button>
            
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
               {/* Logo Icon matching Home */}
               <div style={{ 
                 width: 50, 
                 height: 50, 
                 background: '#fff', 
                 borderRadius: '12px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 boxShadow: '0 4px 12px rgba(0, 58, 112, 0.4)',
                 border: '1px solid rgba(255,255,255,0.1)',
                 overflow: 'hidden',
                 padding: '0px' // Add slight padding so it doesn't touch edges uncomfortably
               }}>
                  <img 
                    src={BizClearLogo} 
                    alt="BizClear Logo" 
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      objectFit: 'cover',
                      transform: 'scale(1.2)' // Zoom in the image slightly to make it appear larger
                    }} 
                  />
               </div>
               <div>
                 <Text strong style={{ color: 'white', fontSize: 20, display: 'block', lineHeight: 1 }}>{title}</Text>
                 <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: '0.5px' }}>{subtitle}</Text>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: 40 }}>
            <Title style={{ color: '#fff', fontSize: 48, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
              Streamlined <br/> Business Compliance
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, maxWidth: 500, marginBottom: 40, lineHeight: 1.8 }}>
              {description}
            </Paragraph>
            
            {/* Feature Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {features.map((feature, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16
                }}>
                  <div style={{ 
                    color: 'white', 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: 8, 
                    borderRadius: 8,
                    display: 'flex' 
                  }}>
                    {feature.icon}
                  </div>
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 16, display: 'block', marginBottom: 4 }}>{feature.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.4 }}>{feature.desc}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
             <span>© 2026 City Government of Dagupan. All Rights Reserved.</span>
             <div style={{ display: 'flex', gap: 24 }}>
                <Link to="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: 'inherit' }}>Terms of Service</Link>
                <a href="#" style={{ color: 'inherit' }}>Support</a>
             </div>
          </div>
        </Col>
        )}

        {/* Right Side - Form Container */}
        <Col 
          xs={24} md={12} lg={12} 
          style={{ 
            background: '#fff',
            height: isMobile ? 'auto' : '100vh',
            minHeight: isMobile ? '100vh' : '100%',
            overflowY: isMobile ? 'auto' : 'auto',
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: isMobile ? 'flex-start' : 'center',
            order: isMobile ? -1 : 0 // Ensure form appears first on mobile
          }}
        >
          {/* Mobile Header - Compact */}
          {isMobile && (
            <div style={{ 
              padding: '16px 20px 12px',
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background: '#fff',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              {/* Logo and Branding */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  background: '#003a70', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 58, 112, 0.2)',
                  overflow: 'hidden',
                  padding: '2px',
                  flexShrink: 0
                }}>
                  <img 
                    src={BizClearLogo} 
                    alt="BizClear Logo" 
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      objectFit: 'cover'
                    }} 
                  />
                </div>
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.2, color: '#001529' }}>{title}</Text>
                  <Text style={{ fontSize: 9, letterSpacing: '0.3px', color: '#8c8c8c', lineHeight: 1.2 }}>{subtitle}</Text>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ 
            width: '100%', 
            maxWidth: isMobile ? '100%' : (isTablet ? Math.min(formMaxWidth, 600) : formMaxWidth), 
            margin: 'auto', 
            paddingTop: isMobile ? '24px' : (isTablet ? '40px' : '60px'),
            paddingRight: isMobile ? '20px' : (isTablet ? '32px' : '60px'),
            paddingBottom: isMobile ? '24px' : (isTablet ? '40px' : '60px'),
            paddingLeft: isMobile ? '20px' : (isTablet ? '32px' : '60px'),
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isMobile ? 'flex-start' : 'center'
          }}>
            {/* Mobile Back Button - Inside Form Content */}
            {isMobile && (
              <div style={{ marginBottom: 20 }}>
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/')}
                  style={{ 
                    padding: '4px 8px',
                    fontSize: 15,
                    color: '#001529',
                    display: 'flex',
                    alignItems: 'center',
                    height: 'auto'
                  }}
                >
                  Back
                </Button>
              </div>
            )}
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#003a70',
                  borderRadius: 8,
                },
                components: {
                   Button: {
                      controlHeightLG: isMobile ? 48 : 50,
                      fontSizeLG: isMobile ? 15 : 16,
                      fontWeight: 600,
                      borderRadiusLG: 8,
                   },
                   Input: {
                      controlHeightLG: isMobile ? 48 : 50,
                      paddingInlineLG: isMobile ? 14 : 16,
                      fontSizeLG: isMobile ? 15 : 16,
                      colorBgContainer: '#fff',
                      activeBorderColor: '#003a70',
                      borderRadiusLG: 8,
                   },
                   Typography: {
                     fontSizeHeading2: isMobile ? 26 : 30,
                   }
                }
              }}
            >
              {children}
            </ConfigProvider>
          </div>
        </Col>
      </Row>
    </Layout>
  )
}
