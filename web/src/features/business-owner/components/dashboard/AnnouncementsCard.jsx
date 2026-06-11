import { useState } from 'react'
import { Typography, theme, Button, Modal, Collapse, Space, Drawer, Grid, Tag } from 'antd'
import BlurFade from '@/shared/components/BlurFade.jsx'

const { Title } = Typography
const { useBreakpoint } = Grid

export default function AnnouncementsCard({ announcementItems, announcements, defaultOpenKey, readAnnouncements, onAnnouncementRead }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false)

  const unreadCount = announcementItems.length - Object.keys(readAnnouncements || {}).length

  const handleCollapseChange = (keys) => {
    keys.forEach(key => {
      if (!readAnnouncements?.[key] && onAnnouncementRead) {
        onAnnouncementRead(key)
      }
    })
  }

  return (
    <BlurFade onViewport={true} delay={0} duration={0.5} direction="down" fullHeight={false}>
      <>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0 }}>
            Announcements
          </Title>
          {unreadCount > 0 && <Tag color="blue">{unreadCount} unread</Tag>}
        </div>

        {announcementItems.length > 0 && (
          <Space.Compact direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              {announcements.slice(0, 2).map((ann, idx) => {
                const announcementKey = `announcement-${idx + 1}`
                const isUnread = !readAnnouncements?.[announcementKey]
                return (
                  <Button
                    key={`announcement-btn-${idx}`}
                    type="default"
                    size="small"
                    onClick={() => setAnnouncementsModalOpen(true)}
                    style={{
                      textAlign: 'left',
                      height: 'auto',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'flex-start',
                    }}
                  >
                    {isUnread && <Tag color="blue" style={{ fontSize: 11 }}>New</Tag>}
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      display: 'block',
                      fontSize: 13,
                    }}>
                      {ann.title}
                    </span>
                  </Button>
                )
              })}
              <Button
                type="default"
                size="small"
                onClick={() => setAnnouncementsModalOpen(true)}
                style={{
                  textAlign: 'left',
                  height: 'auto',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-start',
                }}
              >
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  display: 'block',
                  fontSize: 13,
                }}>
                  View all {announcementItems.length} announcements →
                </span>
              </Button>
            </Space.Compact>
          )}

        {/* All Announcements Modal/Drawer */}
        {screens.lg ? (
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
                  items={announcementItems.map(item => ({
                    ...item,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.label}
                        {!readAnnouncements?.[item.key] && <Tag color="blue" style={{ fontSize: 11 }}>New</Tag>}
                      </div>
                    )
                  }))}
                  defaultActiveKey={defaultOpenKey}
                  onChange={handleCollapseChange}
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
                  items={announcementItems.map(item => ({
                    ...item,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.label}
                        {!readAnnouncements?.[item.key] && <Tag color="blue" style={{ fontSize: 11 }}>New</Tag>}
                      </div>
                    )
                  }))}
                  defaultActiveKey={defaultOpenKey}
                  onChange={handleCollapseChange}
                  style={{ background: token.colorBgContainer }}
                />
              )}
            </div>
          </Drawer>
        )}
      </>
    </BlurFade>
  )
}
