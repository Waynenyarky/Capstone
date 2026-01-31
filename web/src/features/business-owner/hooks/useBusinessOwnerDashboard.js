import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSync, useAuthSession } from '@/features/authentication'
import { getBusinessProfile } from '../services/businessProfileService'
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData'

export function useBusinessOwnerDashboard() {
  const { currentUser, role, logout } = useAuthSession()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const hasFetchedRef = useRef(false)

  // Dashboard Data Hook
  const { loading: dashboardLoading, data: dashboardData } = useDashboardData()

  // Listen for verification from other tabs
  useAuthSync()

  useEffect(() => {
    if (!currentUser) {
      hasFetchedRef.current = false
      navigate('/login')
      return
    }
    const roleSlug = String(role?.slug ?? role ?? '').toLowerCase()
    if (roleSlug !== 'business_owner') {
      hasFetchedRef.current = false
      navigate('/dashboard')
      return
    }

    // Fetch profile only once per mount. Auth sync/validateToken can update currentUser
    // and retrigger this effect; refetching would loop loading ↔ form (wizard unmounts).
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    setLoading(true)
    setFetchError(null)
    getBusinessProfile()
      .then(setProfile)
      .catch(err => {
        console.error(err)
        hasFetchedRef.current = false
        if (err.message && (err.message.includes('Unauthorized') || err.message.includes('missing token'))) {
          logout()
          return
        }
        setFetchError(err)
      })
      .finally(() => setLoading(false))
  }, [currentUser, role, navigate, logout])

  return {
    currentUser,
    role,
    profile,
    loading,
    fetchError,
    dashboardLoading,
    dashboardData
  }
}
