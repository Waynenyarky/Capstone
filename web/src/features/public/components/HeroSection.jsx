import { Typography, Grid, theme, Collapse, Card, Button } from 'antd'
import { NotificationOutlined, DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { useState, useEffect, useRef, useCallback } from 'react'
import { get } from '@/lib/http.js'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

function PermitFormsCarousel({ cards, sectionDescription, screens, token }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const handleScroll = useCallback(() => {
    updateScrollState()
  }, [updateScrollState])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => updateScrollState())
    observer.observe(el)
    return () => observer.disconnect()
  }, [cards, updateScrollState])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.offsetWidth || 340
    el.scrollBy({ left: direction === 'left' ? -cardWidth - 16 : cardWidth + 16, behavior: 'smooth' })
  }

  return (
    <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '24px 28px' : '18px 14px',
          background: token.colorBgLayout,
        }}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            marginBottom: 8,
            textAlign: 'left',
          }}
        >
          Permit Forms
        </Title>
        {sectionDescription && (
          <Paragraph
            type="secondary"
            style={{
              marginBottom: 16,
              textAlign: 'left',
            }}
          >
            {sectionDescription}
          </Paragraph>
        )}
        <div style={{ position: 'relative' }}>
          <style>{`.hero-permit-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div
            ref={scrollRef}
            className="hero-permit-scroll"
            onScroll={handleScroll}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 16,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              paddingBottom: 8,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {cards.map((card) => {
              const reqs = card.requirements?.filter(Boolean) || []
              return (
                <div
                  key={card.cardId || card._id}
                  style={{
                    flex: '0 0 auto',
                    width: screens.md ? 'calc(33.333% - 11px)' : screens.sm ? 'calc(50% - 8px)' : '100%',
                    minWidth: screens.md ? 320 : 'auto',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Card
                    title={card.title || 'Untitled'}
                    size="small"
                    style={{ display: 'flex', flexDirection: 'column', minWidth: 320, height: '100%' }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                  >
                    {card.description && (
                      <Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13 }}>
                        {card.description}
                      </Paragraph>
                    )}
                    {reqs.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                          Requirements:
                        </Text>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                          {reqs.map((req, i) => (
                            <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {card.downloadableFile?.cid && (
                      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          href={card.downloadableFile.cid.startsWith('http')
                            ? card.downloadableFile.cid
                            : `${import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'}${card.downloadableFile.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Form
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
          {(canScrollLeft || canScrollRight) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                size="small"
              />
              <Button
                icon={<RightOutlined />}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                size="small"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function HeroSection() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const [announcements, setAnnouncements] = useState([])
  const [maintenanceStatus, setMaintenanceStatus] = useState({ active: false, scheduled: false })
  const [permitForms, setPermitForms] = useState({ cards: [], sectionDescription: '', isEnabled: false })

  const faqItems = [
    {
      key: 'faq-1',
      label: 'How long does permit processing usually take?',
      children: (
        <Paragraph style={{ marginBottom: 0 }}>
          Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.
        </Paragraph>
      ),
    },
    {
      key: 'faq-2',
      label: 'Can I submit my application even if one document is pending?',
      children: (
        <Paragraph style={{ marginBottom: 0 }}>
          You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.
        </Paragraph>
      ),
    },
    {
      key: 'faq-3',
      label: 'How will I know if my permit status changes?',
      children: (
        <Paragraph style={{ marginBottom: 0 }}>
          Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.
        </Paragraph>
      ),
    },
    {
      key: 'faq-4',
      label: 'What should I do if my application is returned for correction?',
      children: (
        <Paragraph style={{ marginBottom: 0 }}>
          Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.
        </Paragraph>
      ),
    },
  ]

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [res, maintenance, permitFormsRes] = await Promise.all([
          get('/api/admin/announcements', { skipAuth: true }),
          getMaintenanceStatus().catch(() => ({ active: false, scheduled: false })),
          get('/api/admin/permit-forms', { skipAuth: true }).catch(() => null),
        ])

        const rawAnnouncements = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.announcements)
              ? res.announcements
              : []

        const published = rawAnnouncements.filter((a) => {
          const isPublished = a?.status ? a.status === 'published' : true
          const isActive = a?.isActive !== false
          return isPublished && isActive
        })

        const publishedFallback = rawAnnouncements.filter((a) => {
          const isPublished = a?.status ? a.status === 'published' : true
          return isPublished
        })

        setAnnouncements(published.length > 0 ? published : publishedFallback)
        setMaintenanceStatus({
          active: !!maintenance?.active,
          scheduled: !!maintenance?.scheduled,
          message: maintenance?.message || '',
          expectedResumeAt: maintenance?.expectedResumeAt || null,
          scheduledStartAt: maintenance?.scheduledStartAt || null,
        })
        if (permitFormsRes && permitFormsRes.isEnabled !== false && permitFormsRes.cards?.length > 0) {
          setPermitForms({
            cards: permitFormsRes.cards || [],
            sectionDescription: permitFormsRes.sectionDescription || '',
            isEnabled: true,
          })
        }
      } catch {
        setAnnouncements([])
        setMaintenanceStatus({ active: false, scheduled: false })
      }
    }
    fetchLandingData()
  }, [])

  const fontSize = 'clamp(28px, 5vw, 56px)'

  const hasMaintenanceNotice = maintenanceStatus.active

  const announcementItems = announcements.map((ann, idx) => ({
    key: `announcement-${idx + 1}`,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NotificationOutlined />
        <span>{ann.title}</span>
      </div>
    ),
    children: (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          {ann.createdAt ? dayjs(ann.createdAt).format('MMM D, YYYY h:mm A') : '-'}
        </Text>
        <Paragraph style={{ marginBottom: 0 }}>
          {ann.body}
        </Paragraph>
      </div>
    ),
  }))

  const hasAnnouncementPanel = announcementItems.length > 0 || hasMaintenanceNotice
  const defaultOpenKey = hasAnnouncementPanel && announcementItems.length > 0 ? ['announcement-1'] : []

  return (
    <div style={{ 
      background: token.colorBgContainer,
      padding: screens.md ? '56px clamp(24px, 8vw, 140px)' : '36px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: screens.md ? 44 : 28,
      flex: 1,
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: hasAnnouncementPanel && screens.lg ? 'minmax(0, 1.15fr) minmax(320px, 0.85fr)' : '1fr',
        gap: screens.lg ? 56 : 32,
        alignItems: 'start'
      }}>
        {/* Left Panel - Hero Text */}
        <div style={{ 
          textAlign: hasAnnouncementPanel && screens.lg ? 'left' : 'center',
          minHeight: screens.lg ? 280 : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Title level={1} style={{ 
            marginBottom: '8px', 
            fontSize,
            fontWeight: 700,
            lineHeight: 1.1,
            whiteSpace: screens.sm ? 'nowrap' : 'normal'
          }}>
            <span style={{ color: BRAND_COLORS.blue }}>Business </span>
            <span style={{ color: BRAND_COLORS.red }}>Permit </span>
            <span style={{ color: BRAND_COLORS.yellow }}>Processing</span>
          </Title>
          <Title level={2} style={{ 
            margin: 0, 
            fontSize: 'clamp(20px, 4vw, 40px)',
            fontWeight: 700,
            color: token.colorText,
            textAlign: 'inherit'
          }}>
            Made Simpler.
          </Title>
        </div>

        {/* Right Panel - Announcements Collapsible */}
        {hasAnnouncementPanel && (
          <div style={{ height: '100%', minWidth: 0 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Announcements
            </Title>

            {/* Maintenance Notice - Prominent Card */}
            {hasMaintenanceNotice && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadius,
                  background: token.colorBgContainer,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  
                  <div>
                    {maintenanceStatus.active ? 'System Maintenance Underway' : 'Scheduled Maintenance'}
                  </div>
                  {(maintenanceStatus.scheduledStartAt || maintenanceStatus.expectedResumeAt) && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10}}>
                      {maintenanceStatus.scheduledStartAt
                        ? `Starts: ${dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}`
                        : `Expected back: ${dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}`}
                    </Text>
                  )}
                  <Paragraph style={{ marginBottom: 0, fontSize: 14 }}>
                    {maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable."}
                  </Paragraph>
                </div>
              </div>
            )}

            {/* Regular Announcements Collapsible */}
            {announcementItems.length > 0 && (
              <Collapse
                items={announcementItems}
                defaultActiveKey={defaultOpenKey}
                style={{ background: token.colorBgContainer }}
              />
            )}
          </div>
        )}
      </div>

      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '24px 28px' : '18px 14px',
            background: token.colorBgLayout,
          }}
        >
          <Title
            level={4}
            style={{
              marginTop: 0,
              marginBottom: 8,
              textAlign: screens.md ? 'left' : 'center',
            }}
          >
            Frequently Asked Questions
          </Title>
          <Paragraph
            type="secondary"
            style={{
              marginBottom: 16,
              textAlign: screens.md ? 'left' : 'center',
            }}
          >
            Quick answers about application timelines, updates, and submission best practices.
          </Paragraph>
          <Collapse
            items={faqItems}
            defaultActiveKey={['faq-1']}
            style={{ background: token.colorBgContainer, textAlign: 'left' }}
          />
        </div>
      </section>

      {permitForms.isEnabled && permitForms.cards.length > 0 && (
        <PermitFormsCarousel
          cards={permitForms.cards}
          sectionDescription={permitForms.sectionDescription}
          screens={screens}
          token={token}
        />
      )}
    </div>
  )
}
