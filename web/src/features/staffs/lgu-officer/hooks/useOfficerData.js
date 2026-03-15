import { useState, useCallback, useEffect } from 'react'
import { get } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'

export default function useOfficerData(activeTab, refreshTrigger) {
  const { currentUser } = useAuthSession()

  // Data states per tab
  const [toReview, setToReview] = useState([])
  const [applications, setApplications] = useState([])
  const [appeals, setAppeals] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [renewals, setRenewals] = useState([])
  const [cessations, setCessations] = useState([])
  const [owners, setOwners] = useState([])
  const [drafts, setDrafts] = useState([])
  const [logs, setLogs] = useState([])

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
  const fetchToReview = useCallback(async () => {
    const officerId = currentUser?.id || currentUser?._id
    if (!officerId) return
    setTabLoading('toReview', true)
    try {
      // Fetch ALL applications claimed by this officer (any status)
      const url = `/api/lgu-officer/permit-applications?reviewedBy=${officerId}&limit=200`
      const res = await get(url, { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      setToReview(apps)
      setCounts(prev => ({ ...prev, toReview: apps.length }))
    } catch (err) { 
      console.error('[useOfficerData] fetchToReview error:', err)
      setToReview([]) 
    }
    finally { setTabLoading('toReview', false) }
  }, [currentUser?.id, currentUser?._id])

  const fetchApplications = useCallback(async () => {
    setTabLoading('applications', true)
    try {
      const res = await get('/api/lgu-officer/permit-applications?limit=200', { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      setApplications(apps)
      setCounts(prev => ({ ...prev, applications: apps.length }))
    } catch { setApplications([]) }
    finally { setTabLoading('applications', false) }
  }, [])

  const fetchAppeals = useCallback(async () => {
    setTabLoading('appeals', true)
    try {
      const res = await get('/api/business/appeals?role=staff', { skipAutoLogout: true })
      const list = res?.data || res?.appeals || []
      const pending = list.filter(a => a.status === 'pending' || a.status === 'submitted')
      setAppeals(pending)
      setCounts(prev => ({ ...prev, appeals: pending.length }))
    } catch { setAppeals([]) }
    finally { setTabLoading('appeals', false) }
  }, [])

  const fetchEditRequests = useCallback(async () => {
    setTabLoading('editRequests', true)
    try {
      const res = await get('/api/business/edit-requests?role=staff', { skipAutoLogout: true })
      const list = res?.data || []
      const pending = list.filter(r => r.status === 'pending' || r.status === 'submitted' || !r.status)
      setEditRequests(pending)
      setCounts(prev => ({ ...prev, editRequests: pending.length }))
    } catch { setEditRequests([]) }
    finally { setTabLoading('editRequests', false) }
  }, [])

  const fetchRenewals = useCallback(async () => {
    setTabLoading('renewals', true)
    try {
      const res = await get('/api/lgu-officer/permit-applications?status=pending_renewal,renewal_submitted&limit=100', { skipAutoLogout: true })
      const apps = res?.data?.applications || res?.applications || []
      setRenewals(apps)
      setCounts(prev => ({ ...prev, renewals: apps.length }))
    } catch { setRenewals([]) }
    finally { setTabLoading('renewals', false) }
  }, [])

  const fetchCessations = useCallback(async () => {
    setTabLoading('cessation', true)
    try {
      const res = await get('/api/business/retirements?role=staff', { skipAutoLogout: true })
      const list = res?.data || res?.retirements || []
      const pending = list.filter(c =>
        c.retirementStatus === 'requested' || c.retirementStatus === 'inspector_verified'
      )
      setCessations(pending)
      setCounts(prev => ({ ...prev, cessation: pending.length }))
    } catch { setCessations([]) }
    finally { setTabLoading('cessation', false) }
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
      setDrafts(apps)
      setCounts(prev => ({ ...prev, drafts: apps.length }))
    } catch { setDrafts([]) }
    finally { setTabLoading('drafts', false) }
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

  // Fetch active tab data
  const fetchActiveTabData = useCallback(() => {
    switch (activeTab) {
      case 'toReview': return fetchToReview()
      case 'applications': return fetchApplications()
      case 'appeals': return fetchAppeals()
      case 'editRequests': return fetchEditRequests()
      case 'renewals': return fetchRenewals()
      case 'cessation': return fetchCessations()
      case 'owners': return fetchOwners(ownerSearch)
      case 'drafts': return fetchDrafts()
      case 'logs': return fetchLogs()
    }
  }, [activeTab, fetchToReview, fetchApplications, fetchAppeals, fetchEditRequests, fetchRenewals, fetchCessations, fetchOwners, fetchDrafts, fetchLogs, ownerSearch])

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
    fetchCessations()
    fetchDrafts()
  }, [currentUser?.id])

  // Owner search with debounce
  useEffect(() => {
    if (activeTab !== 'owners') return
    const t = setTimeout(() => fetchOwners(ownerSearch), 300)
    return () => clearTimeout(t)
  }, [ownerSearch, activeTab])

  // Get current list for active tab
  const getCurrentList = useCallback(() => {
    const lists = { 
      toReview,
      applications, 
      appeals, 
      editRequests, 
      renewals, 
      cessation: cessations, 
      owners, 
      drafts, 
      logs 
    }
    return lists[activeTab] || []
  }, [activeTab, toReview, applications, appeals, editRequests, renewals, cessations, owners, drafts, logs])

  // Refresh all application-related tabs (for claim/release/transfer)
  const refreshApplicationTabs = useCallback(() => {
    fetchToReview()
    fetchApplications()
  }, [fetchToReview, fetchApplications])

  return {
    // Data
    toReview,
    applications,
    appeals,
    editRequests,
    renewals,
    cessations,
    owners,
    drafts,
    logs,
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
    refreshApplicationTabs,
  }
}
