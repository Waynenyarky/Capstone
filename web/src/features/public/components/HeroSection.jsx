import { Typography, Grid, theme, Collapse, Alert, Card, Button } from 'antd'
import { NotificationOutlined, WarningOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { useState, useEffect } from 'react'
import { get } from '@/lib/http.js'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function HeroSection() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState([])
  const [maintenanceStatus, setMaintenanceStatus] = useState({ active: false, scheduled: false })

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
        const [res, maintenance] = await Promise.all([
          get('/api/admin/announcements', { skipAuth: true }),
          getMaintenanceStatus().catch(() => ({ active: false, scheduled: false })),
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
        </div>

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
    </div>
  )
}
