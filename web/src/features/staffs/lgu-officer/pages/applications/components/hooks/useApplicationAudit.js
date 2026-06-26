import { useState, useEffect, useCallback } from 'react'

/**
 * Manages audit-related state and operations for applications
 * Handles fetching appeal data for audit purposes
 */
export function useApplicationAudit(application) {
  const [latestAppeal, setLatestAppeal] = useState(null)

  /**
   * Fetch latest appeal data when status is appeal_pending or appeal_rejected
   */
  useEffect(() => {
    const status = application?.status || application?.applicationStatus
    const isAppealPending = status === 'appeal_pending'
    const isAppealRejected = status === 'appeal_rejected'
    const businessId = application?.businessId || application?.applicationId

    if (!businessId || (!isAppealPending && !isAppealRejected)) {
      setLatestAppeal(null)
      return
    }

    const fetchAppeal = async () => {
      try {
        const { get } = await import('@/lib/http')
        const res = await get(`/api/business/appeals/by-business/${businessId}`)
        const appeals = res?.data || []
        const activeAppeal = appeals[0] || null
        setLatestAppeal(activeAppeal)
      } catch (err) {
        console.error('Failed to fetch appeal:', err)
        setLatestAppeal(null)
      }
    }

    fetchAppeal()
  }, [application?.status, application?.applicationStatus, application?.businessId, application?.applicationId])

  /**
   * Get active appeal for this application
   */
  const getActiveAppeal = useCallback(async () => {
    const businessId = application?.businessId || application?.applicationId
    if (!businessId) return null

    try {
      const { get } = await import('@/lib/http')
      const res = await get(`/api/business/appeals/by-business/${businessId}`)
      const appeals = res?.data || []
      const activeAppeal = appeals.find(a => a.status === 'submitted' || a.status === 'under_review')
      return activeAppeal || null
    } catch (err) {
      console.error('Failed to fetch active appeal:', err)
      return null
    }
  }, [application?.businessId, application?.applicationId])

  return {
    latestAppeal,
    getActiveAppeal,
  }
}
