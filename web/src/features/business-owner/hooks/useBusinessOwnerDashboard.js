import { useState, useEffect } from 'react'
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
  
  // Dashboard Data Hook
  const { loading: dashboardLoading, data: dashboardData } = useDashboardData()

  // Listen for verification from other tabs
  useAuthSync()

  useEffect(() => {
    if (!currentUser) {
        navigate('/login')
        return
    }
    if (role !== 'business_owner') {
        navigate('/dashboard')
        return
    }
    
    // Fetch business profile to check status
    setLoading(true)
    getBusinessProfile()
      .then(setProfile)
      .catch(err => {
        console.error(err)
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
