import { useState, useCallback } from 'react'
import { get } from '@/lib/http.js'
import { filterPublishedActiveAnnouncements } from '@/shared/utils/announcementFilters.js'
import { formatCmsAuditRow } from '@/features/admin/pages/content-management/constants/cmsAudit.constants.js'

export function useDashboardCmsCards() {
  const [publicAnnouncements, setPublicAnnouncements] = useState([])
  const [staffAnnouncements, setStaffAnnouncements] = useState([])
  const [cmsChanges, setCmsChanges] = useState([])
  const [cmsTotal, setCmsTotal] = useState(0)
  const [trends, setTrends] = useState({ public: null, staff: null, cms: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCmsCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const daysSince = 30 // Show trend for last 30 days

      const [publicRes, staffRes, auditRes, cmsTrendRes] = await Promise.allSettled([
        get('/api/admin/announcements?audience=public'),
        get('/api/admin/announcements?audience=staff'),
        get('/api/admin/monitoring/audit-logs?page=1&limit=20&cmsOnly=true'),
        get(`/api/admin/monitoring/audit-logs?page=1&limit=100&cmsOnly=true&daysSince=${daysSince}`),
      ])

      // Process public announcements
      if (publicRes.status === 'fulfilled') {
        const publicList = publicRes.value?.data ?? publicRes.value ?? []
        const filtered = filterPublishedActiveAnnouncements(publicList, { audience: 'public' })
        setPublicAnnouncements(filtered)
      } else {
        setPublicAnnouncements([])
      }

      // Process staff announcements
      if (staffRes.status === 'fulfilled') {
        const staffList = staffRes.value?.data ?? staffRes.value ?? []
        const filtered = filterPublishedActiveAnnouncements(staffList, { audience: 'staff' })
        setStaffAnnouncements(filtered)
      } else {
        setStaffAnnouncements([])
      }

      // Process CMS audit logs
      if (auditRes.status === 'fulfilled') {
        const logs = auditRes.value?.data?.logs ?? auditRes.value?.data ?? []
        const total = auditRes.value?.data?.meta?.total ?? auditRes.value?.meta?.total ?? logs.length
        setCmsChanges(logs)
        setCmsTotal(total)
      } else {
        setCmsChanges([])
        setCmsTotal(0)
      }

      // Process trends
      const newTrends = { public: null, staff: null, cms: null }
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - daysSince)

      // Public announcements trend (count visible announcements created in last 30 days)
      if (publicRes.status === 'fulfilled') {
        const publicList = publicRes.value?.data ?? publicRes.value ?? []
        const filtered = filterPublishedActiveAnnouncements(publicList, { audience: 'public' })
        const recentlyCreated = filtered.filter(a => a.createdAt && new Date(a.createdAt) >= daysAgo)
        const count = recentlyCreated.length
        if (count > 0) {
          newTrends.public = `+${count}`
        }
      }

      // Staff announcements trend (count visible announcements created in last 30 days)
      if (staffRes.status === 'fulfilled') {
        const staffList = staffRes.value?.data ?? staffRes.value ?? []
        const filtered = filterPublishedActiveAnnouncements(staffList, { audience: 'staff' })
        const recentlyCreated = filtered.filter(a => a.createdAt && new Date(a.createdAt) >= daysAgo)
        const count = recentlyCreated.length
        if (count > 0) {
          newTrends.staff = `+${count}`
        }
      }

      // CMS updates trend (count CMS events in last 30 days)
      if (cmsTrendRes.status === 'fulfilled') {
        const logs = cmsTrendRes.value?.data?.logs ?? cmsTrendRes.value?.data ?? []
        const count = logs.length
        if (count > 0) {
          newTrends.cms = `+${count}`
        }
      }

      setTrends(newTrends)
    } catch (err) {
      console.error('Failed to load CMS cards data:', err)
      setError(err.message)
      setPublicAnnouncements([])
      setStaffAnnouncements([])
      setCmsChanges([])
      setCmsTotal(0)
      setTrends({ public: null, staff: null, cms: null })
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    loadCmsCards()
  }, [loadCmsCards])

  // Helper to convert announcements to CompactListCard items
  const getAnnouncementItems = (announcements) => {
    return announcements.slice(0, 2).map((ann) => ({
      key: ann._id || ann.id,
      label: ann.title,
    }))
  }

  // Helper to convert CMS audit logs to CompactListCard items
  const getCmsChangeItems = (logs) => {
    return logs.slice(0, 2).map((log) => ({
      key: log._id || log.id,
      label: formatCmsAuditRow(log),
    }))
  }

  return {
    publicAnnouncements,
    staffAnnouncements,
    cmsChanges,
    cmsTotal,
    trends,
    loading,
    error,
    loadCmsCards,
    refresh,
    getAnnouncementItems,
    getCmsChangeItems,
  }
}
