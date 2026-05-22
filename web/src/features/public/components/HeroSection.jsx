import React, { useState } from 'react'
import { Typography, Grid, theme, Card, Button, Modal, Collapse, Space, Drawer } from 'antd'
import { NotificationOutlined, WarningOutlined } from '@ant-design/icons'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'
import BlurFade from '@/shared/components/BlurFade.jsx'
import ZipperReveal from '@/shared/components/MosaicArt.jsx'
import PanAnimation from '@/shared/components/PanAnimation.jsx'
import { BENTO_CARDS } from '@/features/public/constants/landing.constants.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function HeroSection({
  announcementItems,
  announcements,
  maintenanceStatus,
  hasAnnouncementPanel,
  defaultOpenKey,
  onNavigate,
}) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false)

  // Filter bento cards based on maintenance status
  const visibleBentoCards = BENTO_CARDS.filter(card => {
    if (maintenanceStatus?.active) {
      // Hide these cards during maintenance
      const hiddenIds = ['apply-now', 'track-application', 'business-search', 'office-location']
      return !hiddenIds.includes(card.id)
    }
    return true
  })

  return (
    <div
      data-hero-section
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: screens.md ? 'row' : 'column',
      }}
    >
      {/* Left Panel - Art (60% on desktop, remaining space on mobile) */}
      <ZipperReveal
        screens={screens}
        style={{
          width: screens.md ? '60%' : '100%',
          height: screens.md ? '100%' : 'auto',
          flex: screens.md ? 'none' : 1,
          minHeight: screens.md ? 'none' : '120px',
        }}
      >
        <PanAnimation
          imageUrl="/Mosaic.png"
          direction="southeast"
          speed={30}
          screens={screens}
        />
      </ZipperReveal>

      {/* Right Panel - Content (40% on desktop, 100% on mobile) */}
      <div style={{
        width: screens.md ? '40%' : '100%',
        background: token.colorBgContainer,
        padding: screens.md ? '32px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        flex: screens.md ? 'none' : '0 0 auto',
      }}>
        {/* Bento Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridAutoRows: screens.md ? '140px' : '120px',
          gap: screens.md ? 12 : 8,
          paddingTop: screens.md ? 0 : 24,
        }}>
          {visibleBentoCards.map((card, index) => (
            <div
              key={card.id}
              style={{
                gridColumn: card.span === 24 ? 'span 2' : 'span 1',
                gridRow: card.isTall ? 'span 2' : 'span 1',
                height: '100%',
              }}
            >
              <BlurFade delay={index * 0.1} duration={0.5}>
                <Card
                size="small"
                style={{
                  height: '100%',
                  background: token.colorBgContainer,
                  border: (card.link || card.scrollTo) && screens.md && hoveredCard === card.id
                    ? `1px solid ${token.colorPrimary}`
                    : `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadiusLG,
                  cursor: (card.link || card.scrollTo) ? 'pointer' : 'default',
                  transition: screens.md ? 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' : 'none',
                  boxShadow: (card.link || card.scrollTo) && screens.md && hoveredCard === card.id
                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                    : 'none',
                  transform: (card.link || card.scrollTo) && screens.md && hoveredCard === card.id ? 'scale(1.02)' : 'scale(1)',
                }}
                bodyStyle={{
                  padding: screens.md ? 16 : 12,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                }}
                onMouseEnter={screens.md ? () => setHoveredCard(card.id) : undefined}
                onMouseLeave={screens.md ? () => setHoveredCard(null) : undefined}
                onClick={() => {
                  if (card.link) {
                    if (onNavigate) { onNavigate(card.link) } else { window.location.href = card.link }
                  } else if (card.scrollTo) {
                    const element = document.getElementById(card.scrollTo)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }
                }}
              >
                {card.icon === 'bizclear' ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transition: 'transform 0.3s ease-out',
                  }}>
                    <BizClearLogo width={screens.md ? 32 : 28} style={{ marginBottom: 8 }} />
                    <Title level={5} style={{ margin: 0, fontSize: screens.md ? 20 : 18 }}>
                      {card.title}
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {card.description}
                    </Text>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}>
                    {React.createElement(card.icon, {
                      style: { fontSize: screens.md ? 24 : 20, color: token.colorTextSecondary, marginBottom: 8 }
                    })}
                    <Title level={5} style={{ margin: 0 }}>
                      {card.title}
                    </Title>
                    {card.description && (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {card.description}
                      </Text>
                    )}
                    {(card.link || card.scrollTo) && (
                      <div style={{
                        maxHeight: screens.md && hoveredCard === card.id ? 30 : 0,
                        overflow: 'hidden',
                        transition: screens.md ? 'max-height 0.15s ease-out' : 'none',
                      }}>
                        <Text
                          style={{
                            display: 'block',
                            marginTop: 8,
                            color: token.colorPrimary,
                            fontSize: 12,
                            fontWeight: 500,
                            opacity: screens.md && hoveredCard === card.id ? 1 : 0,
                            transform: screens.md && hoveredCard === card.id ? 'translateY(0)' : 'translateY(10px)',
                            transition: screens.md ? 'opacity 0.15s ease-out, transform 0.15s ease-out' : 'none',
                          }}
                        >
                          {card.linkText || 'Learn more →'}
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              </BlurFade>
            </div>
          ))}
        </div>

        {/* Maintenance Card */}
        {maintenanceStatus?.active && (
          <BlurFade delay={visibleBentoCards.length * 0.1} duration={0.5} fullHeight={false}>
            <Card
              size="small"
              style={{
                width: '100%',
                marginTop: screens.md ? 12 : 8,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
              }}
              bodyStyle={{
                padding: screens.md ? 16 : 12,
                paddingTop: screens.md ? 48 : 32,
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
              }}
            >
              <WarningOutlined style={{ fontSize: screens.md ? 24 : 20, color: token.colorTextSecondary, marginBottom: 8 }} />
              <Title level={5} style={{ margin: 0 }}>
                {maintenanceStatus.active ? 'System Maintenance' : 'Scheduled Maintenance'}
              </Title>
              <Text style={{ display: 'block', marginTop: 4, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {(maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
              </Text>
              {maintenanceStatus.scheduledStartAt && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Starting at: {dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}
                </Text>
              )}
              {maintenanceStatus.expectedResumeAt && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                  Back online at: {dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}
                </Text>
              )}
            </Card>
          </BlurFade>
        )}

        {/* Announcements Card */}
        {hasAnnouncementPanel && (
          <BlurFade delay={(visibleBentoCards.length + (maintenanceStatus?.active ? 1 : 0)) * 0.1} duration={0.5} fullHeight={false}>
            <Card
              size="small"
              style={{
                width: '100%',
                marginTop: screens.md ? 12 : 8,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
              }}
              bodyStyle={{ padding: screens.md ? '16px 16px 16px 16px' : '12px', paddingTop: screens.md ? 48 : 32 }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <NotificationOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                  Announcements
                </Title>
              </div>

              {announcementItems.length > 0 && (
                <Space.Compact direction="vertical" style={{ width: '100%' }}>
                  {announcements.slice(0, 2).map((ann, idx) => (
                    <Button
                      key={`announcement-btn-${idx}`}
                      type="default"
                      size="small"
                      onClick={() => setAnnouncementsModalOpen(true)}
                      style={{
                        textAlign: 'left',
                        height: 'auto',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'flex-start',
                        whiteSpace: 'normal',
                      }}
                    >
                      {ann.title}
                    </Button>
                  ))}
                  <Button
                    type="default"
                    size="small"
                    onClick={() => setAnnouncementsModalOpen(true)}
                    style={{
                      textAlign: 'left',
                      height: 'auto',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      justifyContent: 'flex-start',
                      whiteSpace: 'normal',
                    }}
                  >
                    View all {announcementItems.length} announcements →
                  </Button>
                </Space.Compact>
              )}
            </Card>
          </BlurFade>
        )}
      </div>

      {/* All Announcements Modal/Drawer */}
      {screens.md ? (
        <Modal
          title="All Announcements"
          open={announcementsModalOpen}
          onCancel={() => setAnnouncementsModalOpen(false)}
          footer={null}
          width={600}
          styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcementItems.length > 0 && (
              <Collapse
                items={announcementItems}
                defaultActiveKey={defaultOpenKey}
                style={{ background: token.colorBgContainer }}
              />
            )}
          </div>
        </Modal>
      ) : (
        <Drawer
          title="All Announcements"
          placement="bottom"
          open={announcementsModalOpen}
          onClose={() => setAnnouncementsModalOpen(false)}
          height="100%"
          styles={{ body: { paddingTop: 12 } }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcementItems.length > 0 && (
              <Collapse
                items={announcementItems}
                defaultActiveKey={defaultOpenKey}
                style={{ background: token.colorBgContainer }}
              />
            )}
          </div>
        </Drawer>
      )}
    </div>
  )
}
