import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { 
  getBusinesses, 
  setPrimaryBusiness as setPrimaryBusinessAPI, 
  deleteBusiness as deleteBusinessAPI 
} from '../../../services/businessProfileService'

export function useBusinessList() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getBusinesses()
      setBusinesses(response.businesses || [])
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      setError(err.message || 'Failed to load businesses')
      message.error('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchBusinesses()
    }
    window.addEventListener('refreshBusinessList', handleRefresh)
    return () => {
      window.removeEventListener('refreshBusinessList', handleRefresh)
    }
  }, [fetchBusinesses])

  const getPrimaryBusiness = useCallback(() => {
    return businesses.find(b => b.isPrimary) || null
  }, [businesses])

  const handleSetPrimary = useCallback(async (businessId) => {
    try {
      await setPrimaryBusinessAPI(businessId)
      message.success('Primary business updated successfully')
      await fetchBusinesses()
    } catch (err) {
      console.error('Failed to set primary business:', err)
      message.error(err.message || 'Failed to set primary business')
      throw err
    }
  }, [fetchBusinesses])

  const handleDelete = useCallback(async (businessId) => {
    try {
      await deleteBusinessAPI(businessId)
      message.success('Business deleted successfully')
      await fetchBusinesses()
    } catch (err) {
      console.error('Failed to delete business:', err)
      message.error(err.message || 'Failed to delete business')
      throw err
    }
  }, [fetchBusinesses])

  return {
    businesses,
    loading,
    error,
    primaryBusiness: getPrimaryBusiness(),
    refresh: fetchBusinesses,
    setPrimaryBusiness: handleSetPrimary,
    deleteBusiness: handleDelete
  }
}
