import { Typography, Grid, theme, Collapse } from 'antd'
import { NotificationOutlined } from '@ant-design/icons'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { useState, useEffect } from 'react'
import { get } from '@/lib/http.js'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

export default function HeroSection() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const [announcements, setAnnouncements] = useState([])
  const [maintenanceStatus, setMaintenanceStatus] = useState({ active: false, scheduled: false })

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
        setAnnouncements(published)
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

  const hasMaintenanceNotice = maintenanceStatus.active || maintenanceStatus.scheduled

  const maintenanceItems = hasMaintenanceNotice
    ? [{
        key: 'maintenance-notice',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationOutlined />
            <span>{maintenanceStatus.active ? 'Maintenance Underway' : 'Scheduled Maintenance'}</span>
          </div>
        ),
        children: (
          <div>
            {(maintenanceStatus.scheduledStartAt || maintenanceStatus.expectedResumeAt) && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {maintenanceStatus.scheduledStartAt
                  ? `Starts: ${dayjs(maintenanceStatus.scheduledStartAt).format('MMM D, YYYY h:mm A')}`
                  : `Expected back: ${dayjs(maintenanceStatus.expectedResumeAt).format('MMM D, YYYY h:mm A')}`}
              </Text>
            )}
            <Paragraph style={{ marginBottom: 0 }}>
              {maintenanceStatus.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable."}
            </Paragraph>
          </div>
        ),
      }]
    : []

  const announcementItems = [
    ...maintenanceItems,
    ...announcements.map((ann, idx) => ({
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
  })),
  ]

  const hasAnnouncementPanel = announcementItems.length > 0
  const defaultOpenKey = hasMaintenanceNotice ? ['maintenance-notice'] : ['announcement-1']

  return (
    <div style={{ 
      background: token.colorBgContainer,
      padding: screens.md ? '60px 50px' : '40px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        display: 'grid',
        gridTemplateColumns: hasAnnouncementPanel && screens.md ? '1fr 1fr' : '1fr',
        gridAutoRows: '1fr',
        gap: screens.md ? 60 : 40,
        alignItems: 'start'
      }}>
        {/* Left Panel - Hero Text */}
        <div style={{ 
          textAlign: (hasAnnouncementPanel && screens.md) ? 'left' : 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Title level={1} style={{ 
            marginBottom: '8px', 
            fontSize,
            fontWeight: 700,
            lineHeight: 1.1,
            whiteSpace: 'nowrap'
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
          <div style={{ height: '100%' }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Announcements
            </Title>
            <Collapse
              items={announcementItems}
              defaultActiveKey={defaultOpenKey}
              style={{ background: token.colorBgContainer }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
