import { useState, useEffect } from 'react'
import { getAnnouncements } from '../../../services/announcementService.js'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [announcementItems, setAnnouncementItems] = useState([])
  const [defaultOpenKey, setDefaultOpenKey] = useState([])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getAnnouncements()
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

        // Build announcement items for collapse
        const items = published.map((ann, idx) => ({
          key: `announcement-${idx + 1}`,
          label: ann.title,
          children: ann.body,
        }))
        setAnnouncementItems(items)
        setDefaultOpenKey(items.length > 0 ? ['announcement-1'] : [])
      } catch (err) {
        console.error('Failed to fetch announcements:', err)
        setAnnouncements([])
        setAnnouncementItems([])
      }
    }
    fetchAnnouncements()
  }, [])

  return {
    announcements,
    announcementItems,
    defaultOpenKey,
  }
}
