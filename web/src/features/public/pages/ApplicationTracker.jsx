import React, { useState } from 'react'
import { Typography, Input, Button, theme, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

const MOCK_APPLICATION = {
  referenceNumber: 'BPLO-2024-001234',
  status: 'Under Review',
  statusColor: 'warning',
  submittedDate: 'May 15, 2024',
  businessName: 'Sample Business Corp',
  businessType: 'Regular Business',
}

export default function ApplicationTracker() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const navigate = useNavigate()
  const [referenceNumber, setReferenceNumber] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [currentApplication, setCurrentApplication] = useState(null)

  const handleCheckStatus = () => {
    // No functionality for now - just show mock result
    setCurrentApplication(MOCK_APPLICATION)
    setShowResult(true)
  }

  const handleReset = () => {
    setReferenceNumber('')
    setShowResult(false)
    setCurrentApplication(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: token.colorBgLayout,
      padding: screens.md ? '40px 20px' : '20px 16px',
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '48px 40px' : '32px 24px',
          boxShadow: token.boxShadow,
        }}>
          {!showResult ? (
            <div>
              <Title level={2} style={{ marginBottom: 8, fontSize: screens.md ? 32 : 24 }}>
                Case Status Online
              </Title>
              <Title level={3} style={{ marginBottom: 24, fontSize: screens.md ? 24 : 20, color: token.colorPrimary }}>
                Check Case Status
              </Title>
              <Paragraph style={{ marginBottom: 32, lineHeight: 1.6, color: token.colorTextSecondary }}>
                Use this tool to track the status of a business permit application, petition, or request.
              </Paragraph>
              <Paragraph style={{ marginBottom: 32, lineHeight: 1.6, color: token.colorTextSecondary }}>
                The receipt number is a unique 13-character identifier that consists of three letters and 10 numbers. Omit dashes (&ldquo;-&rdquo;) when entering a receipt number. However, you can include all other characters, including asterisks (&ldquo;*&rdquo;), if they are listed on your notice as part of the receipt number. When a receipt number is entered, the &ldquo;Check Status&rdquo; button will be enabled and you can check the status.
              </Paragraph>

              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                  Enter a Receipt Number
                </Text>
                <Input
                  size="large"
                  placeholder="EAC1234567890"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCheckStatus}
                  disabled={!referenceNumber}
                  block
                >
                  Check Status
                </Button>
              </div>

              <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${token.colorBorder}` }}>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Already have an Account? <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0, height: 'auto' }}>Login</Button>
                </Text>
                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                  Case Status Online account logins will now be routed through the MyAccount service. Existing account holders can find updated login instructions here.
                </Paragraph>
              </div>
            </div>
          ) : (
            <div>
              <Title level={2} style={{ marginBottom: 24, fontSize: screens.md ? 32 : 24 }}>
                Case Status
              </Title>

              <div style={{
                padding: 24,
                background: token.colorBgLayout,
                borderRadius: token.borderRadius,
                marginBottom: 24,
              }}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Receipt Number
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentApplication?.referenceNumber || referenceNumber}
                  </Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Status
                  </Text>
                  <Text strong style={{ fontSize: 16, color: token.colorWarning }}>
                    {currentApplication?.status || 'Under Review'}
                  </Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Submitted Date
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentApplication?.submittedDate || 'May 15, 2024'}
                  </Text>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Business Name
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentApplication?.businessName || 'Sample Business Corp'}
                  </Text>
                </div>
              </div>

              <Button onClick={handleReset} block size="large">
                Check Another Case
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
