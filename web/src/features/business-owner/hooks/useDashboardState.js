/**
 * Custom hook for managing business owner dashboard state
 * Extracts state management logic from BusinessOwnerDashboard component
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export function useDashboardState() {
  // Business data state
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  // Announcements state
  const [readAnnouncements, setReadAnnouncements] = useState({})

  // UI view state
  const [showAddForm, setShowAddForm] = useState(false)
  const [showProgressView, setShowProgressView] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showWelcomeState, setShowWelcomeState] = useState(false)
  const [showBusinessTypeSelector, setShowBusinessTypeSelector] = useState(false)
  const [showReadOnlyForm, setShowReadOnlyForm] = useState(false)

  // Form state
  const [editingApplication, setEditingApplication] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [permitType, setPermitType] = useState('general')
  const [fromWelcomeModal, setFromWelcomeModal] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [paginationLoading, setPaginationLoading] = useState(false)

  // Filter/sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Refs
  const initialFetchDone = useRef(false)
  const isFirstRender = useRef(true)
  const hasCompletedOnboarding = useRef(false)

  // Actions
  const resetFormState = useCallback(() => {
    setShowAddForm(false)
    setShowProgressView(false)
    setShowReadOnlyForm(false)
    setEditingApplication(null)
    setSelectedBusinessId(null)
    setFromWelcomeModal(false)
  }, [])

  const selectBusiness = useCallback((businessId) => {
    setSelectedBusinessId(businessId)
    // Reset form view states when switching to a different business
    setShowAddForm(false)
    setShowReadOnlyForm(false)
    setEditingApplication(null)
  }, [])

  const openApplicationForm = useCallback((options = {}) => {
    const { registrationType = 'general', fromWelcome = false } = options
    setPermitType(registrationType)
    setFromWelcomeModal(fromWelcome)
    setShowAddForm(true)
    setSelectedBusinessId(null)
    setEditingApplication(null)
  }, [])

  const openEditApplicationForm = useCallback((application) => {
    if (!application) return
    setEditingApplication(application)
    setSelectedBusinessId(application.businessId || application._id)
    setShowAddForm(true)
  }, [])

  const openReadOnlyApplicationForm = useCallback((application) => {
    if (!application) return
    setEditingApplication(application)
    setSelectedBusinessId(application.businessId || application._id)
    setShowAddForm(true)
    setShowReadOnlyForm(true)
  }, [])

  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  // Load read announcements from localStorage on mount
  useEffect(() => {
    const savedRead = localStorage.getItem('bizclear_read_announcements')
    if (savedRead) {
      try {
        setReadAnnouncements(JSON.parse(savedRead))
      } catch (e) {
        console.error('Failed to parse read announcements:', e)
      }
    }
  }, [])

  const handleAnnouncementRead = useCallback((key) => {
    setReadAnnouncements(prev => {
      const updated = { ...prev, [key]: true }
      localStorage.setItem('bizclear_read_announcements', JSON.stringify(updated))
      return updated
    })
  }, [])

  return {
    // State
    businesses,
    setBusinesses,
    loading,
    setLoading,
    selectedBusinessId,
    setSelectedBusinessId,
    lastUpdatedAt,
    setLastUpdatedAt,
    readAnnouncements,
    setReadAnnouncements,
    showAddForm,
    setShowAddForm,
    showProgressView,
    setShowProgressView,
    showSettings,
    setShowSettings,
    showWelcomeState,
    setShowWelcomeState,
    showBusinessTypeSelector,
    setShowBusinessTypeSelector,
    showReadOnlyForm,
    setShowReadOnlyForm,
    editingApplication,
    setEditingApplication,
    formSubmitting,
    setFormSubmitting,
    permitType,
    setPermitType,
    fromWelcomeModal,
    setFromWelcomeModal,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    setTotalItems,
    paginationLoading,
    setPaginationLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    // Refs
    initialFetchDone,
    isFirstRender,
    hasCompletedOnboarding,
    // Actions
    resetFormState,
    selectBusiness,
    openApplicationForm,
    openEditApplicationForm,
    openReadOnlyApplicationForm,
    toggleSettings,
    resetPagination,
    handleAnnouncementRead
  }
}
