import React from 'react'
import { Typography, Grid, theme, Collapse, Card, Button, Divider, Modal, Drawer, Timeline } from 'antd'
import { LeftOutlined, RightOutlined, ClockCircleOutlined, NotificationOutlined, UnorderedListOutlined, DownloadOutlined, CheckCircleOutlined, UserOutlined, FormOutlined, SearchOutlined, QuestionCircleOutlined, ShopOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef, useCallback } from 'react'
import { get } from '@/lib/http.js'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNavigate } from 'react-router-dom'

dayjs.extend(relativeTime)

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

const LOGOS = [
  { src: '/government-logos/republic-of-philippines.png', alt: 'Republic of the Philippines' },
  { src: '/government-logos/bagong-pilipinas.png', alt: 'Bagong Pilipinas' },
  { src: '/government-logos/alaminos-city.png', alt: 'City of Alaminos' },
  { src: '/government-logos/pangasinan-province.png', alt: 'Province of Pangasinan' },
]

const BENTO_CARDS = [
  {
    id: 'bizclear',
    title: 'BizClear',
    description: 'An online business permit processing system of Business Permits and Licensing Office (BPLO) of Alaminos City, Pangasinan',
    icon: 'bizclear',
    span: 12,
    isTall: true,
  },
  {
    id: 'login',
    title: 'Login',
    icon: UserOutlined,
    span: 12,
    link: '/login',
    linkText: 'Access account →',
  },
  {
    id: 'apply-now',
    title: 'Apply Now',
    icon: FormOutlined,
    span: 12,
    link: '/apply',
    linkText: 'Begin →',
  },
  {
    id: 'track-application',
    title: 'Track Application',
    icon: SearchOutlined,
    span: 12,
    link: '/track',
    linkText: 'Check your application status →',
  },
  {
    id: 'get-help',
    title: 'Get Help',
    icon: QuestionCircleOutlined,
    span: 12,
    link: '/help',
    linkText: 'Learn More →',
  },
]

function resolveIpfsUrl(cid) {
  if (!cid) return ''
  if (cid.startsWith('http')) return cid
  const gateway = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'
  return `${gateway}${cid}`
}

function PermitFormDetailContent({ card }) {
  const totalDays = (card.processingSteps || []).reduce(
    (sum, s) => sum + (s.estimatedDurationDays || 0),
    0
  )

  const timelineItems = (card.processingSteps || [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((step, idx, arr) => {
      const isFirst = idx === 0
      const isLast = idx === arr.length - 1
      return {
        color: isFirst ? 'blue' : isLast ? 'green' : 'gray',
        dot: isLast ? <CheckCircleOutlined /> : undefined,
        children: (
          <div style={{ paddingBottom: 4 }}>
            <Text strong>{step.title}</Text>
            {step.description && (
              <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 2, fontSize: 13 }}>
                {step.description}
              </Paragraph>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {step.estimatedDurationDays === 0
                ? 'Same day'
                : `~${step.estimatedDurationDays} day${step.estimatedDurationDays !== 1 ? 's' : ''}`}
            </Text>
          </div>
        ),
      }
    })

  return (
    <div>
      <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
        {card.title || 'Untitled'}
      </Title>
      {card.description && (
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {card.description}
        </Paragraph>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {card.processingSteps && card.processingSteps.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <UnorderedListOutlined style={{ marginRight: 4 }} />
            {card.processingSteps.length} step{card.processingSteps.length !== 1 ? 's' : ''}
          </Text>
        )}
        {totalDays > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            ~{totalDays} day{totalDays !== 1 ? 's' : ''}
          </Text>
        )}
        {card.lastUpdatedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Updated {dayjs(card.lastUpdatedAt).fromNow()}
          </Text>
        )}
      </div>
      {card.requirements?.filter(Boolean).length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 32, marginBottom: 8 }}>Requirements</Title>
          <ul style={{ paddingLeft: 20, margin: 0, marginBottom: 32 }}>
            {card.requirements.filter(Boolean).map((req, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{req}</li>
            ))}
          </ul>
        </>
      )}
      {timelineItems.length > 0 && (
        <>
          <Title level={5} style={{ margin: 0, marginBottom: 12, marginTop: 32 }}>Processing Steps</Title>
          <div style={{ padding: 16 }}>
            <Timeline items={timelineItems} />
          </div>
        </>
      )}
      {card.downloadableFile?.cid && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            href={resolveIpfsUrl(card.downloadableFile.cid)}
            target="_blank"
            rel="noopener noreferrer"
            block
          >
            Download Form{card.downloadableFile.fileName ? ` — ${card.downloadableFile.fileName}` : ''}
          </Button>
        </>
      )}
    </div>
  )
}

function PermitFormsCarousel({ cards, sectionDescription, screens, token }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const isMobile = !screens.md

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
          Forms and Requirements
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
              const stepsCount = (card.processingSteps || []).length
              const totalDays = (card.processingSteps || []).reduce(
                (sum, s) => sum + (s.estimatedDurationDays || 0),
                0
              )
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
                    size="small"
                    onClick={() => setSelectedCard(card)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 320,
                      height: '100%',
                      cursor: 'pointer',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      transition: 'border-color 0.2s',
                    }}
                    styles={{
                      body: { flex: 1, display: 'flex', flexDirection: 'column' },
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = token.colorPrimary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = token.colorBorderSecondary
                    }}
                  >
                    <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                      {card.title || 'Untitled'}
                    </Title>
                    {card.description && (
                      <Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ marginBottom: 8, fontSize: 13 }}>
                        {card.description}
                      </Paragraph>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {stepsCount > 0 && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <UnorderedListOutlined style={{ marginRight: 4 }} />
                          {stepsCount} step{stepsCount !== 1 ? 's' : ''}
                          {totalDays > 0 && <> · <ClockCircleOutlined style={{ marginRight: 4 }} />~{totalDays} day{totalDays !== 1 ? 's' : ''}</>}
                        </Text>
                      )}
                      {card.lastUpdatedAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          Updated {dayjs(card.lastUpdatedAt).fromNow()}
                        </Text>
                      )}
                    </div>
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

      {isMobile ? (
        <Drawer
          title={null}
          placement="bottom"
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          height="100%"
          styles={{ body: { paddingTop: 12 } }}
        >
          {selectedCard && <PermitFormDetailContent card={selectedCard} />}
        </Drawer>
      ) : (
        <Modal
          title={null}
          open={!!selectedCard}
          onCancel={() => setSelectedCard(null)}
          footer={null}
          width={600}
          styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
          {selectedCard && <PermitFormDetailContent card={selectedCard} />}
        </Modal>
      )}
    </section>
  )
}

export default function HeroSection() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const navigate = useNavigate()

  const [announcements, setAnnouncements] = useState([])
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    active: false,
    scheduled: false,
    message: '',
    expectedResumeAt: null,
    scheduledStartAt: null,
  })
  const [permitForms, setPermitForms] = useState({
    cards: [],
    sectionDescription: '',
    isEnabled: false,
  })
  const [hoveredCard, setHoveredCard] = useState(null)
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false)
  const [publicStats, setPublicStats] = useState(null)

  // Inject CSS animation keyframes
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

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
      } catch (err) {
        console.error('[HeroSection] fetchLandingData error:', err)
        setAnnouncements([])
        setMaintenanceStatus({ active: false, scheduled: false })
      }
    }
    fetchLandingData()
  }, [])

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
        <Paragraph style={{ marginBottom: 0 }}>
          {ann.body}
        </Paragraph>
        {ann.metadata?.scheduledStartAt && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
            Starting at: {dayjs(ann.metadata.scheduledStartAt).format('MMM D, YYYY h:mm A')}
          </Text>
        )}
        {ann.metadata?.expectedResumeAt && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            Back online at: {dayjs(ann.metadata.expectedResumeAt).format('MMM D, YYYY h:mm A')}
          </Text>
        )}
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          Posted on {ann.createdAt ? dayjs(ann.createdAt).format('MMM D, YYYY h:mm A') : '-'}
        </Text>
      </div>
    ),
  }))

  const hasAnnouncementPanel = announcementItems.length > 0 || hasMaintenanceNotice
  const defaultOpenKey = hasAnnouncementPanel && announcementItems.length > 0 ? ['announcement-1'] : []

  useEffect(() => {
    // Fetch public transparency stats (no auth required)
    const fetchPublicStats = async () => {
      try {
        const res = await get('/api/public/business/stats', { skipAuth: true }).catch(() => null)
        const stats = res?.data ?? res ?? null
        setPublicStats(stats)
      } catch {
        setPublicStats(null)
      }
    }
    fetchPublicStats()
  }, [])

  return (
    <div style={{ 
      background: token.colorBgContainer,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      {/* Hero Section with Mosaic Background */}
      <div 
        data-hero-section
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: screens.md ? 'row' : 'column',
        }}>
        {/* Left Panel - Art (60% on desktop, dynamic height on mobile) */}
        <div style={{
          width: screens.md ? '60%' : '100%',
          height: screens.md ? '100%' : 'auto',
          flex: screens.md ? 'none' : 1,
          backgroundImage: 'url(/Mosaic.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: screens.md ? '800px' : '400px',
          backgroundPosition: 'center',
          minHeight: screens.md ? 'none' : '30vh',
        }} />

        {/* Right Panel - Content (40% on desktop, 100% on mobile) */}
        <div style={{
          width: screens.md ? '40%' : '100%',
          background: token.colorBgContainer,
          padding: screens.md ? '32px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: hasAnnouncementPanel ? 'flex-start' : 'center',
          overflowY: 'auto',
          paddingTop: hasAnnouncementPanel && screens.md ? 48 : undefined,
        }}>
          {/* Bento Grid */}
          <div style={{ 
            width: '100%',
            display: 'grid',
            gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gridAutoRows: screens.md ? '140px' : '120px',
            gap: screens.md ? 12 : 8,
            paddingTop: screens.md ? 0 : 24,
          }}>
            {BENTO_CARDS.map((card) => (
              <div 
                key={card.id}
                style={{
                  gridColumn: card.span === 24 ? 'span 2' : 'span 1',
                  gridRow: card.isTall ? 'span 2' : 'span 1',
                }}
              >
                <Card
                  size="small"
                  style={{ 
                    height: '100%',
                    background: token.colorBgContainer,
                    border: card.link && hoveredCard === card.id 
                      ? `1px solid ${token.colorPrimary}` 
                      : `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadiusLG,
                    cursor: card.link ? 'pointer' : 'default',
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                    boxShadow: card.link && hoveredCard === card.id 
                      ? `0 4px 12px rgba(0, 0, 0, 0.15)` 
                      : 'none',
                    transform: card.link && hoveredCard === card.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                  bodyStyle={{ 
                    padding: screens.md ? 16 : 12, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => card.link && (window.location.href = card.link)}
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
                    ) : card.icon === 'government' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Row 1 — Logos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {LOGOS.map((logo) => (
                            <img
                              key={logo.alt}
                              src={logo.src}
                              alt={logo.alt}
                              style={{
                                height: 32,
                                width: 32,
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ))}
                        </div>
                        {/* Row 2 — Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <Text style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>
                            Republic of the Philippines
                          </Text>
                          <Text style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>
                            Business Permits and Licensing Office (BPLO)
                          </Text>
                          <Text style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>
                            Alaminos City, Pangasinan
                          </Text>
                        </div>
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
                        {card.link && (
                          <div style={{
                            maxHeight: hoveredCard === card.id ? 30 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.15s ease-out',
                          }}>
                            <Text 
                              style={{ 
                                display: 'block', 
                                marginTop: 8, 
                                color: token.colorPrimary, 
                                fontSize: 12,
                                fontWeight: 500,
                                opacity: hoveredCard === card.id ? 1 : 0,
                                transform: hoveredCard === card.id ? 'translateY(0)' : 'translateY(10px)',
                                transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                              }}
                            >
                              {card.linkText || 'Learn more →'}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                </Card>
              </div>
            ))}
          </div>

          {/* Announcements Collapsible - Desktop only */}
          {screens.md && hasAnnouncementPanel && (
            <div style={{ 
              width: '100%', 
              minWidth: 0, 
              marginTop: 12, 
            }}>
              {/* Maintenance Notice - Prominent Card */}
              {hasMaintenanceNotice && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    border: `0.5px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                    background: token.colorBgContainer,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    
                    <div style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 600 }}>
                      {maintenanceStatus.active ? 'System Maintenance Underway' : 'Scheduled Maintenance'}
                    </div>
                    <Paragraph style={{ marginBottom: 0, fontSize: 12 }}>
                      {(maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
                    </Paragraph>
                    {maintenanceStatus.scheduledStartAt && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                        Starting at: {dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}
                      </Text>
                    )}
                    {maintenanceStatus.expectedResumeAt && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                        Back online at: {dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}
                      </Text>
                    )}
                  </div>
                </div>
              )}

              {announcementItems.length > 0 && (
                <>
                  <Collapse
                    items={announcementItems.slice(0, screens.md && announcementItems.length >= 4 ? 3 : announcementItems.length)}
                    defaultActiveKey={defaultOpenKey}
                    style={{ background: token.colorBgContainer }}
                  />
                  {screens.md && announcementItems.length >= 4 && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setAnnouncementsModalOpen(true)}
                      style={{ marginTop: 8, padding: 0, height: 'auto' }}
                    >
                      View all {announcementItems.length} announcements
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Announcements Collapsible - Mobile only */}
      {!screens.md && hasAnnouncementPanel && (
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: screens.md ? '24px 32px' : '16px 24px' }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            Announcements
          </Title>

          {/* Maintenance Notice - Prominent Card */}
          {hasMaintenanceNotice && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                border: `0.5px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                background: token.colorBgContainer,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                
                <div style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 600 }}>
                  {maintenanceStatus.active ? 'System Maintenance Underway' : 'Scheduled Maintenance'}
                </div>
                <Paragraph style={{ marginBottom: 0, fontSize: 12 }}>
                  {(maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
                </Paragraph>
                {maintenanceStatus.scheduledStartAt && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                    Starting at: {dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}
                {maintenanceStatus.expectedResumeAt && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    Back online at: {dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}
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

      {/* Track Your Application */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '24px 28px' : '18px 14px',
            background: token.colorBgLayout,
            marginBottom: 24,
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
            Track Your Application
          </Title>
          <Paragraph
            type="secondary"
            style={{
              marginBottom: 16,
              textAlign: screens.md ? 'left' : 'center',
            }}
          >
            Check the status of your business permit application in real-time.
          </Paragraph>
          <Card
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 12,
            }}
            hoverable
            onClick={() => navigate('/application-tracker')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgLayout,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SearchOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16, display: 'block' }}>
                  Application Tracker
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Enter your reference number to track your application
                </Text>
              </div>
            </div>
          </Card>

          <Card
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            hoverable
            onClick={() => navigate('/business-search')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgLayout,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShopOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16, display: 'block' }}>
                  Business Search
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Search for verified businesses in Alaminos City
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Transparency Dashboard */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '20px 24px' : '14px 12px',
            background: token.colorBgLayout,
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ marginTop: 0, marginBottom: 8, textAlign: screens.md ? 'left' : 'center' }}>
            Transparency Dashboard
          </Title>
          <div style={{ display: 'flex', gap: 12, justifyContent: screens.md ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
            <Card size="small" style={{ minWidth: 200 }}>
              <Text type="secondary" style={{ display: 'block' }}>Total registered businesses this year</Text>
              <Text strong style={{ fontSize: 20 }}>{publicStats?.totalRegisteredThisYear ?? '—'}</Text>
            </Card>
            <Card size="small" style={{ minWidth: 200 }}>
              <Text type="secondary" style={{ display: 'block' }}>Applications processed this year</Text>
              <Text strong style={{ fontSize: 20 }}>{publicStats?.applicationsProcessedThisYear ?? '—'}</Text>
            </Card>
            <Card size="small" style={{ minWidth: 200 }}>
              <Text type="secondary" style={{ display: 'block' }}>Pending applications</Text>
              <Text strong style={{ fontSize: 20 }}>{publicStats?.pendingApplications ?? '—'}</Text>
            </Card>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
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

      <Modal
        title="All Announcements"
        open={announcementsModalOpen}
        onCancel={() => setAnnouncementsModalOpen(false)}
        footer={null}
        width={600}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hasMaintenanceNotice && (
            <div
              style={{
                padding: 12,
                border: `0.5px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                background: token.colorBgContainer,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 600 }}>
                  {maintenanceStatus.active ? 'System Maintenance Underway' : 'Scheduled Maintenance'}
                </div>
                <Paragraph style={{ marginBottom: 0, fontSize: 12 }}>
                  {(maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable.").replace(/^Upcoming:\s*/i, '')}
                </Paragraph>
                {maintenanceStatus.scheduledStartAt && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                    Starting at: {dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}
                {maintenanceStatus.expectedResumeAt && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    Back online at: {dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}
              </div>
            </div>
          )}
          {announcementItems.length > 0 && (
            <Collapse
              items={announcementItems}
              defaultActiveKey={defaultOpenKey}
              style={{ background: token.colorBgContainer }}
            />
          )}
        </div>
      </Modal>

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
