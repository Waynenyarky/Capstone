import { useState, useCallback, useEffect } from 'react'
import { get } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import { getAppealsForReview } from '../services/appealsService'

const EDIT_REQUESTS_POLL_INTERVAL_MS = 30 * 1000

const PENDING_APPLICATION_STATUSES = new Set([
  'submitted',
  'under_review',
  'resubmit',
  'pending',
  'pending_renewal',
  'renewal_submitted',
  'appeal_pending',
])

const PENDING_APPEAL_STATUSES = new Set(['pending', 'submitted'])
const PENDING_RENEWAL_STATUSES = new Set(['pending_renewal', 'renewal_submitted'])

const normalizeEditRequestStatus = (status) => {
  if (!status || status === 'submitted') return 'pending'
  return status
}

const resolveReviewerId = (reviewedBy) => {
  if (!reviewedBy) return null
  if (typeof reviewedBy === 'object') return reviewedBy._id || reviewedBy.id || null
  return reviewedBy
}

const isClaimedByOfficer = (item, officerId) => {
  const reviewerId = resolveReviewerId(item?.reviewedBy)
  return Boolean(reviewerId && officerId && String(reviewerId) === String(officerId))
}

const resolveApplicationItemType = (application) => {
  const rawStatus = application?.status || application?.applicationStatus || ''
  const status = String(rawStatus).toLowerCase()
  const applicationType = String(application?.applicationType || '').toLowerCase()
  const permitType = String(application?.permitType || '').toLowerCase()

  if (status.includes('renewal') || applicationType.includes('renewal') || permitType === 'renewal') {
    return 'renewals'
  }

  return 'applications'
}

export default function useOfficerData(activeTab, refreshTrigger) {
  const { currentUser } = useAuthSession()

  // Data states per tab
  const [toReview, setToReview] = useState([])
  // Claimed items by type for To Review sub-tabs
  const [toReviewByType, setToReviewByType] = useState({
    applications: [],
    renewals: [],
    appeals: [],
    editRequests: [],
    inspections: [],
  })
  const [applications, setApplications] = useState([])
  const [appeals, setAppeals] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [renewals, setRenewals] = useState([])
  const [inspections, setInspections] = useState([])
  const [owners, setOwners] = useState([])
  const [drafts, setDrafts] = useState([])
  const [logs, setLogs] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [helpRequests, setHelpRequests] = useState([])

  // Loading states
  const [loadingMap, setLoadingMap] = useState({})
  // Counts for badges
  const [counts, setCounts] = useState({})
  // Search for owners
  const [ownerSearch, setOwnerSearch] = useState('')

  const setTabLoading = (tab, loading) => {
    setLoadingMap(prev => ({ ...prev, [tab]: loading }))
  }

  // ── Fetch functions ──────────────────────────────────────────

  /** Resolve a stable businessId from any item shape.
   *  Prefer _businessSubdocId (subdoc _id) since permit-applications uses that as businessId.
   *  This ensures edit requests, appeals, cessations group under the same consolidated card. */
  const resolveBusinessId = (item) => {
    return item?._businessSubdocId || item?.businessId || item?.applicationId || item?._id || ''
  }

  const fetchToReview = useCallback(async () => {
    const officerId = currentUser?.id || currentUser?._id
    if (!officerId) return
    setTabLoading('toReview', true)
    try {
      const [applicationsRes, editRequestsRes, appealsRes, inspectionsRes] = await Promise.allSettled([
        get(`/api/lgu-officer/permit-applications?reviewedBy=${officerId}&limit=200`, { skipAutoLogout: true }),
        get('/api/business/edit-requests?role=staff&limit=200', { skipAutoLogout: true }),
        getAppealsForReview({ limit: 200 }),
        get('/api/lgu-officer/inspections?limit=200', { skipAutoLogout: true }),
      ])

      const claimedApplications = applicationsRes.status === 'fulfilled'
        ? (applicationsRes.value?.data?.applications || applicationsRes.value?.applications || [])
          .map((application) => ({
            ...application,
            _itemType: resolveApplicationItemType(application),
          }))
        : []

      const allEditRequestsRaw = editRequestsRes.status === 'fulfilled'
        ? (Array.isArray(editRequestsRes.value?.data) ? editRequestsRes.value.data : [])
          .map((request) => ({
            ...request,
            status: normalizeEditRequestStatus(request?.status),
            _itemType: 'editRequests',
          }))
        : []
      // Include ALL edit requests for claimed businesses (pending + approved + rejected) for history
      const claimedEditRequests = allEditRequestsRaw
        .filter((request) => isClaimedByOfficer(request, officerId))
      // Keep unclaimed pending edit requests to merge later if their business is already claimed
      const unclaimedEditRequests = allEditRequestsRaw
        .filter((request) => !isClaimedByOfficer(request, officerId) && request.status === 'pending')

      const ACTIVE_APPEAL_STATUSES = ['submitted', 'pending', 'under_review']
      const allAppealsRaw = appealsRes.status === 'fulfilled'
        ? (Array.isArray(appealsRes.value?.data) ? appealsRes.value.data : [])
        : []
      // Include ALL appeals for claimed businesses (active + resolved) for history
      const claimedAppeals = allAppealsRaw
        .filter((appeal) => isClaimedByOfficer(appeal, officerId))
        .map((appeal) => ({ ...appeal, _itemType: 'appeals' }))
      // Keep unclaimed pending appeals to merge later if their business is already claimed
      const unclaimedAppeals = allAppealsRaw
        .filter((appeal) => !isClaimedByOfficer(appeal, officerId) && ACTIVE_APPEAL_STATUSES.includes(appeal.status))
        .map((appeal) => ({ ...appeal, _itemType: 'appeals' }))

      const claimedCessations = []

      const claimedInspections = inspectionsRes.status === 'fulfilled'
        ? (inspectionsRes.value?.data || inspectionsRes.value?.inspections || [])
          .filter((insp) => {
            const assignedById = insp.assignedById ? String(insp.assignedById) : null
            const status = insp.status || ''
            return assignedById === String(officerId) || status === 'pending_assignment'
          })
          .map((insp) => ({ ...insp, _itemType: 'inspections' }))
        : []

      // Build a businessId alias map from applications so that all items for the same
      // business (which may use different ID formats — subdoc _id vs businessId) resolve
      // to the same canonical ID. Applications are the source of truth since their
      // businessId is always the subdoc _id.
      const bizAliasMap = new Map() // maps any known alias → canonical ID
      for (const app of claimedApplications) {
        const canonicalId = String(app.businessId || app._id || '')
        if (!canonicalId) continue
        // The canonical ID is what the application uses (subdoc _id)
        bizAliasMap.set(canonicalId, canonicalId)
        // Also map the applicationId if different
        if (app.applicationId && String(app.applicationId) !== canonicalId) {
          bizAliasMap.set(String(app.applicationId), canonicalId)
        }
      }
      // Also learn aliases from appeals/edit-requests/cessations that carry _businessSubdocId
      const allItemsForAlias = [...claimedAppeals, ...unclaimedAppeals, ...claimedEditRequests, ...unclaimedEditRequests, ...claimedCessations, ...claimedInspections]
      for (const item of allItemsForAlias) {
        const subdocId = item._businessSubdocId ? String(item._businessSubdocId) : null
        const rawBizId = item.businessId ? String(item.businessId) : null
        const canonical = item._canonicalBusinessId ? String(item._canonicalBusinessId) : null
        // If we have a subdocId, use it as canonical; map all variants to it
        const best = subdocId || bizAliasMap.get(rawBizId) || bizAliasMap.get(subdocId) || null
        if (best) {
          if (subdocId) bizAliasMap.set(subdocId, best)
          if (rawBizId) bizAliasMap.set(rawBizId, best)
          if (canonical) bizAliasMap.set(canonical, best)
        }
      }

      /** Resolve businessId using alias map, falling back to resolveBusinessId */
      const resolveWithAliases = (item) => {
        const rawId = resolveBusinessId(item)
        return bizAliasMap.get(String(rawId)) || rawId
      }

      // Build claimed-by-type object (will be updated with merged appeals below before calling setToReviewByType)
      const claimedByType = {
        applications: claimedApplications.filter(a => a._itemType === 'applications'),
        renewals: claimedApplications.filter(a => a._itemType === 'renewals'),
        appeals: claimedAppeals,
        editRequests: claimedEditRequests,
        cessation: claimedCessations,
        inspections: claimedInspections,
      }

      // Group all claimed items by businessId into consolidated business cards
      const allItems = [
        ...claimedApplications,
        ...claimedEditRequests,
        ...claimedAppeals,
        ...claimedCessations,
        ...claimedInspections,
      ]

      const businessMap = new Map()
      for (const item of allItems) {
        const bizId = String(resolveWithAliases(item))
        if (!bizId) continue
        if (!businessMap.has(bizId)) {
          businessMap.set(bizId, {
            businessId: bizId,
            businessName: item.businessName || item.registeredBusinessName || 'Unknown Business',
            _itemType: 'business',
            _requests: { application: null, editRequests: [], appeals: [], inspections: [] },
            createdAt: item.createdAt || item.updatedAt || item.submittedAt || new Date().toISOString(),
          })
        }
        const group = businessMap.get(bizId)
        // Update business name if we find a better one
        if (item.businessName && group.businessName === 'Unknown Business') {
          group.businessName = item.businessName
        }
        if (item.registeredBusinessName && group.businessName === 'Unknown Business') {
          group.businessName = item.registeredBusinessName
        }
        // Track earliest date
        const itemDate = new Date(item.createdAt || item.updatedAt || item.submittedAt || 0).getTime()
        const groupDate = new Date(group.createdAt || 0).getTime()
        if (itemDate > groupDate) group.createdAt = item.createdAt || item.updatedAt || item.submittedAt

        // Sort into categories
        switch (item._itemType) {
          case 'applications':
          case 'renewals':
            group._requests.application = item
            break
          case 'editRequests':
            group._requests.editRequests.push(item)
            break
          case 'appeals':
            group._requests.appeals.push(item)
            break
          case 'inspections':
            group._requests.inspections.push(item)
            break
        }
      }

      // Merge unclaimed items into business cards that are already claimed via other items.
      // This handles the case where an appeal/edit request is submitted after the application was already claimed.
      const mergeUnclaimedIntoCards = (unclaimedItems, requestKey) => {
        for (const item of unclaimedItems) {
          const bizId = String(resolveWithAliases(item))
          if (!bizId || !businessMap.has(bizId)) continue
          const group = businessMap.get(bizId)
          const target = Array.isArray(group._requests[requestKey]) ? group._requests[requestKey] : []
          const isDuplicate = target.some(existing => String(existing._id) === String(item._id))
          if (!isDuplicate) target.push(item)
          if (!Array.isArray(group._requests[requestKey])) group._requests[requestKey] = target
        }
      }

      mergeUnclaimedIntoCards(unclaimedEditRequests, 'editRequests')
      mergeUnclaimedIntoCards(unclaimedAppeals, 'appeals')

      // Also include unclaimed items in claimedByType for sub-tab rendering
      const mergeUnclaimedIntoByType = (claimed, unclaimed) => {
        const merged = [...claimed]
        for (const item of unclaimed) {
          const bizId = String(resolveWithAliases(item))
          if (bizId && businessMap.has(bizId)) {
            const isDuplicate = merged.some(existing => String(existing._id) === String(item._id))
            if (!isDuplicate) merged.push(item)
          }
        }
        return merged
      }

      claimedByType.editRequests = mergeUnclaimedIntoByType(claimedEditRequests, unclaimedEditRequests)
      claimedByType.appeals = mergeUnclaimedIntoByType(claimedAppeals, unclaimedAppeals)
      setToReviewByType(claimedByType)

      const consolidatedItems = Array.from(businessMap.values()).sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return db - da
      })

      setToReview(consolidatedItems)
      setCounts(prev => ({ ...prev, toReview: consolidatedItems.length }))
    } catch (err) { 
      console.error('[useOfficerData] fetchToReview error:', err)
      setToReview([]) 
      setCounts(prev => ({ ...prev, toReview: 0 }))
    }
    finally { setTabLoading('toReview', false) }
  }, [currentUser?.id, currentUser?._id])

  const fetchApplications = useCallback(async () => {
    setTabLoading('applications', true)
    try {
      const res = await get('/api/lgu-officer/permit-applications?limit=200', { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      const pendingCount = apps.filter(app =>
        PENDING_APPLICATION_STATUSES.has(app.status || app.applicationStatus)
      ).length
      setApplications(apps)
      setCounts(prev => ({ ...prev, applications: pendingCount }))
    } catch {
      setApplications([])
      setCounts(prev => ({ ...prev, applications: 0 }))
    }
    finally { setTabLoading('applications', false) }
  }, [])

  const fetchAppeals = useCallback(async () => {
    setTabLoading('appeals', true)
    try {
      const res = await getAppealsForReview({ role: 'staff' })
      const list = res?.data || res?.appeals || []
      const pending = list.filter(a => PENDING_APPEAL_STATUSES.has(a.status))
      setAppeals(pending)
      setCounts(prev => ({ ...prev, appeals: pending.length }))
    } catch {
      setAppeals([])
      setCounts(prev => ({ ...prev, appeals: 0 }))
    }
    finally { setTabLoading('appeals', false) }
  }, [])

  const fetchEditRequests = useCallback(async () => {
    setTabLoading('editRequests', true)
    try {
      const res = await get('/api/business/edit-requests?role=staff', { skipAutoLogout: true })
      const list = Array.isArray(res?.data) ? res.data : []
      const normalized = list.map((request) => {
        return { ...request, status: normalizeEditRequestStatus(request?.status) }
      })
      const pendingCount = normalized.filter(request => request.status === 'pending').length

      setEditRequests(normalized)
      setCounts(prev => ({ ...prev, editRequests: pendingCount }))
    } catch {
      setEditRequests([])
      setCounts(prev => ({ ...prev, editRequests: 0 }))
    }
    finally { setTabLoading('editRequests', false) }
  }, [])

  const fetchRenewals = useCallback(async () => {
    setTabLoading('renewals', true)
    try {
      const res = await get('/api/lgu-officer/permit-applications?status=pending_renewal,renewal_submitted&limit=100', { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      const pendingCount = apps.filter(app =>
        PENDING_RENEWAL_STATUSES.has(app.status || app.applicationStatus)
      ).length
      setRenewals(apps)
      setCounts(prev => ({ ...prev, renewals: pendingCount }))
    } catch {
      setRenewals([])
      setCounts(prev => ({ ...prev, renewals: 0 }))
    }
    finally { setTabLoading('renewals', false) }
  }, [])

  const fetchOwners = useCallback(async (q = '') => {
    setTabLoading('owners', true)
    try {
      const query = q.trim()
      const url = query 
        ? `/api/auth/users/search?q=${encodeURIComponent(query)}&role=business_owner`
        : `/api/auth/users/search?role=business_owner`
      const res = await get(url, { skipAutoLogout: true })
      const list = Array.isArray(res) ? res : res?.data || []
      setOwners(list)
    } catch { setOwners([]) }
    finally { setTabLoading('owners', false) }
  }, [])

  const fetchDrafts = useCallback(async () => {
    setTabLoading('drafts', true)
    try {
      const res = await get('/api/lgu-officer/permit-applications?status=draft&limit=100', { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      const draftCount = apps.filter(app => (app.status || app.applicationStatus) === 'draft').length
      setDrafts(apps)
      setCounts(prev => ({ ...prev, drafts: draftCount }))
    } catch {
      setDrafts([])
      setCounts(prev => ({ ...prev, drafts: 0 }))
    }
    finally { setTabLoading('drafts', false) }
  }, [])

  const fetchInspections = useCallback(async () => {
    setTabLoading('inspections', true)
    try {
      const res = await get('/api/lgu-officer/inspections?limit=200', { skipAutoLogout: true })
      const list = res?.data || res?.inspections || []
      const pendingCount = list.filter(i => i.status === 'pending_assignment' || i.status === 'pending').length
      setInspections(list)
      setCounts(prev => ({ ...prev, inspections: pendingCount }))
    } catch {
      setInspections([])
      setCounts(prev => ({ ...prev, inspections: 0 }))
    }
    finally { setTabLoading('inspections', false) }
  }, [])

  const fetchLogs = useCallback(async () => {
    setTabLoading('logs', true)
    try {
      // Fetch personal action history (own userId OR metadata.officerId matches current user)
      const res = await get('/api/auth/audit/my-actions?limit=200', { skipAutoLogout: true })
      const logs = res?.logs || res?.data || []
      setLogs(logs)
    } catch { setLogs([]) }
    finally { setTabLoading('logs', false) }
  }, [])

  const fetchBusinesses = useCallback(async () => {
    setTabLoading('businesses', true)
    try {
      const res = await get('/api/lgu-officer/businesses?limit=200', { skipAutoLogout: true })
      const list = res?.businesses || []
      setBusinesses(list)
    } catch {
      setBusinesses([])
    }
    finally { setTabLoading('businesses', false) }
  }, [])

  const fetchHelpRequests = useCallback(async () => {
    setTabLoading('helpRequests', true)
    try {
      const res = await get('/api/help-requests?limit=200', { skipAutoLogout: true })
      const list = res?.data || res?.helpRequests || []
      setHelpRequests(list)
    } catch {
      setHelpRequests([])
    }
    finally { setTabLoading('helpRequests', false) }
  }, [])

  // Fetch active tab data
  const fetchActiveTabData = useCallback(() => {
    switch (activeTab) {
      case 'toReview': return fetchToReview()
      case 'applications': return fetchApplications()
      case 'appeals': return fetchAppeals()
      case 'editRequests': return fetchEditRequests()
      case 'renewals': return fetchRenewals()
      case 'inspections': return fetchInspections()
      case 'owners': return fetchOwners(ownerSearch)
      case 'drafts': return fetchDrafts()
      case 'logs': return fetchLogs()
      case 'businesses': return fetchBusinesses()
      case 'helpRequests': return fetchHelpRequests()
    }
  }, [activeTab, fetchToReview, fetchApplications, fetchAppeals, fetchEditRequests, fetchRenewals, fetchInspections, fetchOwners, fetchDrafts, fetchLogs, fetchBusinesses, fetchHelpRequests, ownerSearch])

  // Fetch on tab change
  useEffect(() => {
    fetchActiveTabData()
  }, [activeTab, refreshTrigger])

  // Fetch all counts on mount and when currentUser becomes available
  useEffect(() => {
    fetchToReview()
    fetchApplications()
    fetchAppeals()
    fetchEditRequests()
    fetchRenewals()
    fetchInspections()
    fetchDrafts()
    fetchBusinesses()
  }, [currentUser?.id])

  // Owner search with debounce
  useEffect(() => {
    if (activeTab !== 'owners') return
    const t = setTimeout(() => fetchOwners(ownerSearch), 300)
    return () => clearTimeout(t)
  }, [ownerSearch, activeTab])

  // Poll edit requests while edits tab is active so officer list stays fresh
  useEffect(() => {
    if (activeTab !== 'editRequests') return
    const intervalId = setInterval(() => {
      fetchEditRequests()
    }, EDIT_REQUESTS_POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [activeTab, fetchEditRequests])

  // Get current list for active tab
  const getCurrentList = useCallback(() => {
    const lists = {
      toReview,
      applications,
      appeals,
      editRequests,
      renewals,
      inspections,
      owners,
      drafts,
      logs,
      businesses,
      helpRequests,
    }
    return lists[activeTab] || []
  }, [activeTab, toReview, applications, appeals, editRequests, renewals, inspections, owners, drafts, logs, businesses, helpRequests])

  // Refresh all application-related tabs (for claim/release/transfer)
  const refreshApplicationTabs = useCallback(() => {
    fetchToReview()
    fetchApplications()
  }, [fetchToReview, fetchApplications])

  return {
    // Data
    toReview,
    toReviewByType,
    applications,
    appeals,
    editRequests,
    renewals,
    inspections,
    owners,
    drafts,
    logs,
    businesses,
    helpRequests,
    // Counts
    counts,
    // Loading
    loadingMap,
    isLoading: loadingMap[activeTab],
    // Search
    ownerSearch,
    setOwnerSearch,
    // Methods
    getCurrentList,
    refresh: fetchActiveTabData,
    refreshToReview: fetchToReview,
    refreshApplicationTabs,
    refreshEditRequests: fetchEditRequests,
    refreshInspections: fetchInspections,
    refreshHelpRequests: fetchHelpRequests,
  }
}
