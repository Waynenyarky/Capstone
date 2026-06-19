import { useState } from 'react'
import { Typography, Input, Button, theme, Grid, Layout, Pagination } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import HomeHeader from '../components/HomeHeader'
import { BusinessCard, BusinessProfile, ReportBusinessModal } from './business-search/components'
import { MOCK_BUSINESSES } from './business-search/constants/businessSearch.constants.js'
import ZipperReveal from '@/shared/components/MosaicArt.jsx'
import PanAnimation from '@/shared/components/PanAnimation.jsx'
import BlurFade from '@/shared/components/BlurFade.jsx'

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
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredBusinesses = MOCK_BUSINESSES.filter(business =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = () => {
    // Filter mock businesses based on search query
    setCurrentPage(1)
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

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, filteredBusinesses.length)

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader visible={true} />
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Two Panel Design */}
        <div
          style={{
            width: '100vw',
            height: screens.md ? 'calc(100vh - 64px)' : 'auto',
            display: 'flex',
            flexDirection: screens.md ? 'row' : 'column',
          }}
        >
          {/* Left Panel - Form (40% on desktop, 100% on mobile) */}
          <div style={{
            width: screens.md ? '40%' : '100%',
            background: token.colorBgContainer,
            padding: screens.md ? '16px 32px 32px 32px' : '16px 24px 32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            overflowY: 'auto',
          }}>
            {!showProfile ? (
              <BlurFade delay={0.2} duration={0.5} fullHeight={false}>
                <div style={{ width: '100%', maxWidth: 400 }}>
                  <Title level={2} style={{ marginBottom: 16, marginTop: 120, fontSize: screens.md ? 32 : 24 }}>
                    Business Search
                  </Title>
                  <Paragraph style={{ marginBottom: 32, lineHeight: 1.6, color: token.colorTextSecondary }}>
                    Search for verified businesses in Alaminos City
                  </Paragraph>

                  <div style={{ marginBottom: 24 }}>
                    <Text style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                      Enter a Business Name
                    </Text>
                    <Input
                      size="middle"
                      placeholder="Search by business name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      prefix={<SearchOutlined />}
                      style={{ marginBottom: 16 }}
                    />
                    <Button
                      type="primary"
                      size="middle"
                      onClick={handleSearch}
                      block
                    >
                      Search
                    </Button>
                  </div>

                  <div style={{
                    marginBottom: screens.md ? 32 : 24,
                  }}>
                    {paginatedBusinesses.length > 0 ? (
                      paginatedBusinesses.map((business) => (
                        <BusinessCard
                          key={business.id}
                          business={business}
                          onClick={handleBusinessClick}
                          token={token}
                          screens={screens}
                        />
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: token.colorTextSecondary }}>
                        <Text>No businesses found matching "{searchQuery}"</Text>
                      </div>
                    )}

                    {filteredBusinesses.length > 0 && (
                      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Showing {startIndex}-{endIndex} of {filteredBusinesses.length}
                        </Text>
                        <Pagination
                          current={currentPage}
                          total={filteredBusinesses.length}
                          pageSize={pageSize}
                          showSizeChanger={false}
                          onChange={handlePageChange}
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </BlurFade>
            ) : (
              <BlurFade delay={0.2} duration={0.5} fullHeight={false}>
                <div style={{ width: '100%' }}>
                  <BusinessProfile
                    business={selectedBusiness}
                    onReport={handleReport}
                    onBack={handleBackToResults}
                    token={token}
                    screens={screens}
                  />
                </div>
              </BlurFade>
            )}
          </div>

          {/* Right Panel - Art (60% on desktop, hidden on mobile) */}
          {screens.md && (
            <ZipperReveal
              screens={screens}
              style={{
                width: '60%',
                height: '100%',
              }}
            >
              <PanAnimation
                imageUrl="/Mosaic.png"
                direction="southeast"
                speed={30}
                screens={screens}
              />
            </ZipperReveal>
          )}
        </div>
      </Content>
      
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
