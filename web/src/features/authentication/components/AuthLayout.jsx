import React from 'react'
import { Layout, Row, Col, Typography, ConfigProvider, Button, Card } from 'antd'
import { ArrowLeftOutlined, SafetyCertificateOutlined, FileProtectOutlined, BankOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

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
  description = "BizClear is a secure digital system that helps local government units manage business permits, inspections, violations, and appeals in a clear, transparent, and efficient way by using AI to assist in document validation and blockchain technology to ensure records are tamper-proof, traceable, and trustworthy.",
  formMaxWidth = 440 // Default width for form container
}) {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BankOutlined style={{ fontSize: 24 }} />,
      title: "Efficient LGU Management",
      desc: "Streamline permits, inspections, violations, and appeals in a clear and transparent way."
    },
    {
      icon: <FileProtectOutlined style={{ fontSize: 24 }} />,
      title: "AI-Powered Validation",
      desc: "Intelligent document analysis to assist and accelerate the validation process."
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 24 }} />,
      title: "Blockchain Security",
      desc: "Tamper-proof, traceable, and trustworthy records ensuring data integrity."
    }
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Row style={{ height: '100%' }}>
        {/* Left Side - Branding */}
        <Col 
          xs={0} md={12} lg={12} 
          style={{ 
            background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)', // Professional Blue Gradient
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 60px',
            position: 'relative',
            overflow: 'hidden',
            height: '100%'
          }}
        >
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
               {/* Placeholder Logo Icon */}
               <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/assets/bizclear-logo-white.png" alt="Logo" style={{ width: 24 }} />
               </div>
               <div>
                 <Text strong style={{ color: 'white', fontSize: 18, display: 'block', lineHeight: 1 }}>{title}</Text>
                 <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Project Management Platform</Text>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: 40 }}>
            <Title style={{ color: '#fff', fontSize: 48, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
              Join Our <br/> Enterprise Platform
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, maxWidth: 500, marginBottom: 40 }}>
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
             <span>© 2025 {title}. All rights reserved.</span>
             <div style={{ display: 'flex', gap: 24 }}>
                <a href="#" style={{ color: 'inherit' }}>Privacy</a>
                <a href="#" style={{ color: 'inherit' }}>Terms</a>
                <a href="#" style={{ color: 'inherit' }}>Support</a>
             </div>
          </div>
        </Col>

        {/* Right Side - Form Container */}
        <Col 
          xs={24} md={12} lg={12} 
          style={{ 
            background: '#f0f2f5', 
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
                  colorPrimary: '#3182ce',
                  borderRadius: 8,
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                  fontSize: 14,
                  colorText: '#1f2937',
                },
                components: {
                   Button: {
                      controlHeightLG: 50,
                      fontSizeLG: 16,
                      fontWeight: 600,
                      defaultBg: '#fff',
                      borderRadiusLG: 8,
                   },
                   Input: {
                      controlHeightLG: 50,
                      paddingInlineLG: 16,
                      fontSizeLG: 16,
                      colorBgContainer: '#fff',
                      activeBorderColor: '#3182ce',
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
