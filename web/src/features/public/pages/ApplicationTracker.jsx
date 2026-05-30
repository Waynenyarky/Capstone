import { useState } from 'react'
import { Typography, Input, Button, theme, Grid, Layout } from 'antd'
import HomeHeader from '../components/HomeHeader'
import FaqSection from '../components/FaqSection'
import HomeFooter from '../components/HomeFooter'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid
const { Content } = Layout

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
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader visible={true} />
      <Content style={{ padding: screens.md ? '120px 20px 60px' : '100px 16px 40px' }}>
        <div style={{
          maxWidth: 400,
          margin: '0 auto',
        }}>
          {!showResult ? (
            <div>
              <Title level={2} style={{ marginBottom: 16, fontSize: screens.md ? 32 : 24 }}>
                Application Tracker
              </Title>
              <Paragraph style={{ marginBottom: 32, lineHeight: 1.6, color: token.colorTextSecondary }}>
                Enter your receipt number to track the status of your business permit application.
              </Paragraph>

              <div style={{ marginBottom: 24 }}>
                <Text style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
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

            </div>
          ) : (
            <div>
              <Title level={2} style={{ marginBottom: 24, fontSize: screens.md ? 32 : 24 }}>
                Application Status
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
        <div style={{ marginTop: screens.md ? '60px' : '40px' }}>
          <FaqSection />
        </div>
      </Content>
      <HomeFooter />
    </Layout>
  )
}
