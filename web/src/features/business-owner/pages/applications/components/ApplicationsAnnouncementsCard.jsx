import { useState } from 'react'
import { theme, Grid, Tag } from 'antd'
import { NotificationOutlined } from '@ant-design/icons'
import BlurFade from '@/shared/components/BlurFade.jsx'
import AnnouncementsModal from './modals/AnnouncementsModal'
import ListCard from '@/shared/components/ListCard.jsx'

const { useBreakpoint } = Grid

export default function ApplicationsAnnouncementsCard({ announcementItems, announcements, defaultOpenKey, readAnnouncements, onAnnouncementRead }) {
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
      <ListCard
        icon={<NotificationOutlined />}
        title="Announcements"
        items={announcements}
        renderItem={(ann) => (
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
        )}
        onItemClick={() => setAnnouncementsModalOpen(true)}
        onViewAll={() => setAnnouncementsModalOpen(true)}
        viewAllText="View all"
        itemTypeText="announcements"
        headerExtra={unreadCount > 0 && <Tag color="blue">{unreadCount} unread</Tag>}
        emptyText="No announcements"
      />

      <AnnouncementsModal
        open={announcementsModalOpen}
        onCancel={() => setAnnouncementsModalOpen(false)}
        announcementItems={announcementItems}
        readAnnouncements={readAnnouncements}
        defaultOpenKey={defaultOpenKey}
        handleCollapseChange={handleCollapseChange}
        token={token}
        screens={screens}
      />
    </BlurFade>
  )
}
