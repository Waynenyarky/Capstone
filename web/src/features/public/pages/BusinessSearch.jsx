import { useState } from 'react'
import { Typography, Input, Button, theme, Grid, Layout } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import HomeHeader from '../components/HomeHeader'
import FaqSection from '../components/FaqSection'
import HomeFooter from '../components/HomeFooter'
import { BusinessCard, BusinessProfile, ReportBusinessModal } from './business-search/components'
import { MOCK_BUSINESSES } from './business-search/constants/businessSearch.constants.js'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid
const { Content } = Layout

export default function BusinessSearch() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const handleSearch = () => {
    // No functionality for now - just show mock results
  }

  const handleBusinessClick = (business) => {
    setSelectedBusiness(business)
    setShowProfile(true)
  }

  const handleReport = () => {
    setShowReportModal(true)
  }

  const handleReportSubmit = () => {
    // No functionality for now
    setShowReportModal(false)
  }

  const handleReportCancel = () => {
    setShowReportModal(false)
  }

  const handleBackToResults = () => {
    setShowProfile(false)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader visible={true} />
      <Content style={{ padding: screens.md ? '120px 20px 60px' : '100px 16px 40px' }}>
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{
            marginBottom: screens.md ? 40 : 32,
          }}>
            <Title level={2} style={{ marginBottom: 8, textAlign: 'center' }}>
              Business Search
            </Title>
            <Paragraph style={{ marginBottom: 32, textAlign: 'center', color: token.colorTextSecondary }}>
              Search for verified businesses in Alaminos City
            </Paragraph>

            <Input
              size="large"
              placeholder="Search by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>

          {!showProfile ? (
            <div style={{
              marginBottom: screens.md ? 60 : 48,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Showing {MOCK_BUSINESSES.length} businesses
                </Text>
              </div>

              {MOCK_BUSINESSES.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onClick={handleBusinessClick}
                  token={token}
                  screens={screens}
                />
              ))}
            </div>
          ) : (
            <div style={{
              marginBottom: screens.md ? 40 : 32,
            }}>
              <BusinessProfile
                business={selectedBusiness}
                onReport={handleReport}
                onBack={handleBackToResults}
                token={token}
                screens={screens}
              />
            </div>
          )}

          <div style={{ marginTop: screens.md ? '60px' : '40px' }}>
            <FaqSection />
          </div>
        </div>
      </Content>
      <HomeFooter />
      
      <ReportBusinessModal
        visible={showReportModal}
        onSubmit={handleReportSubmit}
        onCancel={handleReportCancel}
        screens={screens}
        token={token}
      />
    </Layout>
  )
}
