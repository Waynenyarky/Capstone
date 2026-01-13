import React from 'react'
import { Layout, Row, Col, Typography, ConfigProvider, theme, Button, Card } from 'antd'
import { ArrowLeftOutlined, SafetyCertificateOutlined, ScheduleOutlined, SyncOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import BizClearLogo from '@/logo/BizClear.png'

const { Title, Paragraph, Text } = Typography

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
  illustration, // Optional
  formMaxWidth = 440 // Default width for form container
}) {
  const navigate = useNavigate();

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
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Row style={{ height: '100%' }}>
        {/* Left Side - Branding */}
        <Col 
          xs={0} md={12} lg={12} 
          style={{ 
            background: 'radial-gradient(circle at 50% -20%, #0050b3 0%, transparent 40%), linear-gradient(135deg, #001529 0%, #003a70 100%)', // Home Page Gradient
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

        {/* Right Side - Form Container */}
        <Col 
          xs={24} md={12} lg={12} 
          style={{ 
            background: '#fff', // Match Home background
            height: '100%',
            overflowY: 'auto',
            display: 'flex', 
            flexDirection: 'column'
          }}
        >
          <div style={{ width: '100%', maxWidth: formMaxWidth, margin: 'auto', padding: '60px' }}>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#003a70', // Match Home primary color
                  borderRadius: 8,
                  // Removed explicit font family to match Home's default
                },
                components: {
                   Button: {
                      controlHeightLG: 50,
                      fontSizeLG: 16,
                      fontWeight: 600,
                      // defaultBg: '#fff', // Let it inherit or default
                      borderRadiusLG: 8,
                   },
                   Input: {
                      controlHeightLG: 50,
                      paddingInlineLG: 16,
                      fontSizeLG: 16,
                      colorBgContainer: '#fff',
                      activeBorderColor: '#003a70',
                      borderRadiusLG: 8,
                   },
                   Typography: {
                     fontSizeHeading2: 30,
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
