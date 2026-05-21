import React, { useState } from 'react'
import { Modal, Typography, theme, Button, Space, Grid } from 'antd'
import { ShopOutlined, CalendarOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

const BUSINESS_TYPES = [
  {
    type: 'permit',
    title: 'Regular Business',
    description: 'For long-term operations',
    bestFor: ['Stores', 'Restaurants', 'Offices', 'Service businesses'],
  },
  {
    type: 'general_permit',
    title: 'Temporary Business',
    description: 'For short-term or seasonal operations',
    bestFor: ['Food stalls', 'Events', 'Pop-ups', 'Seasonal vendors'],
  },
]

export default function WelcomeModal({ visible, onSelect, onClose }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [currentPage, setCurrentPage] = useState(1)

  const handleNext = () => {
    setCurrentPage(2)
  }

  const handleSkip = () => {
    onClose()
  }

  const handleSelectBusiness = (type) => {
    onSelect(type)
    setCurrentPage(1)
  }

  const renderPage1 = () => (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Welcome to BizClear!
      </Title>
      <Paragraph style={{ marginBottom: 32, color: token.colorTextSecondary, lineHeight: 1.6 }}>
        BizClear is your digital gateway to smoother transactions with the BPLO office of Alaminos. 
        We simplify business permit applications, track your application status, and help you stay compliant 
        with local regulations—all in one convenient platform.
      </Paragraph>
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={handleSkip}>
          Skip
        </Button>
        <Button type="primary" onClick={handleNext} icon={<ArrowRightOutlined />}>
          Let&apos;s setup my first business
        </Button>
      </Space>
    </div>
  )

  const renderPage2 = () => (
    <div>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Select the type that best describes your business
      </Paragraph>

      <div style={{
        display: 'grid',
        gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : '1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        {BUSINESS_TYPES.map((business) => (
          <div
            key={business.type}
            role="button"
            tabIndex={0}
            onClick={() => handleSelectBusiness(business.type)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSelectBusiness(business.type)
              }
            }}
            style={{
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              padding: 24,
              transition: 'all 0.2s',
              background: token.colorBgContainer,
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = token.colorPrimary
              e.currentTarget.style.boxShadow = token.boxShadowTertiary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = token.colorBorder
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: token.borderRadiusLG,
              background: token.colorBgLayout,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {business.type === 'permit' ? (
                <ShopOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
              ) : (
                <CalendarOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
              )}
            </div>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>
              {business.title}
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              {business.description}
            </Text>
            <div style={{ textAlign: 'left' }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Best for:
              </Text>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: token.colorTextSecondary }}>
                {business.bestFor.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
        You can always add another business type later or remove one if you make a mistake.
      </Text>

      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={() => setCurrentPage(1)}>
          Back
        </Button>
      </Space>
    </div>
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .bottom-drawer-modal .ant-modal {
            margin: 0;
            max-width: 100%;
            bottom: 0;
            position: absolute;
            border-radius: 16px 16px 0 0;
          }
          .bottom-drawer-modal .ant-modal-content {
            border-radius: 16px 16px 0 0;
          }
        }
      `}</style>
      <Modal
        title={currentPage === 1 ? '' : 'Choose Your Business Type'}
        open={visible}
        onCancel={null}
        footer={null}
        width={screens.md ? 600 : '100%'}
        style={{
          maxWidth: screens.md ? 'none' : '100%',
          paddingBottom: screens.md ? 'auto' : 0,
          marginBottom: screens.md ? 'auto' : 0,
        }}
        bodyStyle={{
          maxHeight: screens.md ? '70vh' : '80vh',
          overflowY: 'auto',
          padding: screens.md ? '24px' : '20px',
        }}
        centered={screens.md}
        maskClosable={false}
        closable={false}
        wrapClassName={screens.md ? '' : 'bottom-drawer-modal'}
      >
        {currentPage === 1 ? renderPage1() : renderPage2()}
      </Modal>

    </>
  )
}
