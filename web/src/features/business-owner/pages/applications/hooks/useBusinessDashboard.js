/**
 * Custom hook for business dashboard data fetching and socket events
 * Extracts data fetching and realtime logic from BusinessOwnerDashboard
 */

import { useCallback, useEffect, useRef } from 'react'
import { App } from 'antd'
import { useAuthSession } from '@/features/authentication'
import { useSocketConnection, useSocketEvent } from '@/shared/hooks/useSocket'
import { getBusinesses, getBusinessesPaginated } from '../../../services/businessProfileService'
import { getStatusLabel } from '../utils/statusUtils'

export function useBusinessDashboard({
  businesses: _businesses,
  setBusinesses,
  editingApplication,
  setEditingApplication,
  loading: _loading,
  setLoading,
  paginationLoading: _paginationLoading,
  setPaginationLoading,
  currentPage,
  pageSize,
  searchTerm,
  statusFilter,
  sortBy,
  sortOrder,
  setCurrentPage,
  setTotalItems,
  initialFetchDone,
  isFirstRender
}) {
  const { message } = App.useApp()
  const { currentUser, roleSlug } = useAuthSession()
  const { connected: socketConnected } = useSocketConnection()
  const fetchBusinessesRef = useRef(null)

  // Fetch businesses with pagination
  const fetchBusinesses = useCallback(async (resetPage = false) => {
    if (resetPage) {
      setCurrentPage(1)
    }
    
    setLoading(true)
    try {
      const result = await getBusinessesPaginated({
        page: resetPage ? 1 : currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        sort: sortBy,
        order: sortOrder
      })
      
      setBusinesses(result.businesses || [])
      setTotalItems(result.pagination?.totalItems || 0)
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      message.error('Failed to load businesses')
      // Fallback to non-paginated API
      try {
        const data = await getBusinesses()
        setBusinesses(data || [])
        setTotalItems(data?.length || 0)
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
      setPaginationLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder, setCurrentPage, setBusinesses, setLoading, setPaginationLoading, message, setTotalItems])

  const fetchBusinessesPaginated = useCallback(async () => {
    setPaginationLoading(true)
    await fetchBusinesses()
  }, [fetchBusinesses, setPaginationLoading])

  // Keep ref updated for socket callbacks
  useEffect(() => {
    fetchBusinessesRef.current = fetchBusinesses
  }, [fetchBusinesses])

  // Initial fetch
  useEffect(() => {
    if (currentUser && roleSlug === 'business_owner' && !initialFetchDone.current) {
      initialFetchDone.current = true
      fetchBusinesses()
    }
  }, [currentUser, roleSlug, initialFetchDone, fetchBusinesses])

  // Re-fetch when filters change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (currentUser && roleSlug === 'business_owner') {
      fetchBusinesses()
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder, isFirstRender, currentUser, roleSlug, fetchBusinesses])

  // Socket: application status updates
  useSocketEvent('application:updated', useCallback((data) => {
    console.log('[Realtime] Application updated:', data)
    const updatedApp = data.application
    if (!updatedApp) return
    
    setBusinesses(prev => prev.map(b => {
      if ((b.businessId || b._id) === updatedApp.businessId || (b.businessId || b._id) === updatedApp._id) {
        return { ...b, ...updatedApp }
      }
      return b
    }))
    
    if (editingApplication && ((editingApplication.businessId || editingApplication._id) === updatedApp.businessId || (editingApplication.businessId || editingApplication._id) === updatedApp._id)) {
      setEditingApplication(prev => prev ? { ...prev, ...updatedApp } : prev)
    }
    
    if (updatedApp.applicationStatus) {
      const statusLabel = getStatusLabel(updatedApp.applicationStatus)
      message.info(`${updatedApp.businessName || 'Your application'} status: ${statusLabel}`)
    }
  }, [editingApplication, message, setBusinesses, setEditingApplication]))

  // Socket: payment verified
  useSocketEvent('payment:verified', useCallback((data) => {
    console.log('[Realtime] Payment verified:', data)
    message.success('Payment has been verified!')
    fetchBusinessesRef.current?.(false)
  }, [message]))

  return {
    socketConnected,
    fetchBusinesses,
    fetchBusinessesPaginated,
    fetchBusinessesRef
  }
}
