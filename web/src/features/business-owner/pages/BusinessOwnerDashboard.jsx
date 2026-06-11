import { useEffect, useState, useCallback } from 'react'
import { Typography, App, Grid } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import BusinessOwnerLayout from '../components/shared/BusinessOwnerLayout'
import WelcomeInline from '../components/onboarding/WelcomeModal'
import BusinessOwnerDashboardDesktopView from './BusinessOwnerDashboardDesktopView'
import BusinessOwnerDashboardMobileView from './BusinessOwnerDashboardMobileView'
import { useAuthSession } from '@/features/authentication'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { useDashboardState } from '../hooks/useDashboardState'
import { useBusinessDashboard } from '../hooks/useBusinessDashboard'
import { useDashboardFilters } from '../hooks/useDashboardFilters'
import { get } from '@/lib/http.js'
import { isDraftStatus } from '../utils/statusUtils'

const { Title } = Typography

export default function BusinessOwnerDashboard() {
  const { message } = App.useApp()
  const { currentUser, roleSlug, isLoading: authLoading } = useAuthSession()
  const themeSettings = useThemeSettings(message)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  // Announcements state
  const [announcements, setAnnouncements] = useState([])
  const [announcementItems, setAnnouncementItems] = useState([])
  const [defaultOpenKey, setDefaultOpenKey] = useState([])

  // State management hook
  const dashboardState = useDashboardState()
  const {
    businesses,
    setBusinesses,
    loading,
    selectedBusinessId,
    showAddForm,
    showSettings,
    showWelcomeState,
    showBusinessTypeSelector,
    showReadOnlyForm,
    editingApplication,
    setEditingApplication,
    formSubmitting,
    setFormSubmitting,
    permitType,
    currentPage,
    pageSize,
    totalItems,
    paginationLoading,
    setPaginationLoading,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    lastUpdatedAt,
    initialFetchDone,
    isFirstRender,
    hasCompletedOnboarding,
    readAnnouncements,
    resetFormState,
    selectBusiness,
    openApplicationForm,
    openEditApplicationForm,
    toggleSettings
  } = dashboardState

  // Data fetching and socket events hook
  const { socketConnected, fetchBusinesses, fetchBusinessesPaginated } = useBusinessDashboard({
    businesses,
    setBusinesses,
    editingApplication,
    setEditingApplication,
    loading,
    setLoading: dashboardState.setLoading,
    paginationLoading,
    setPaginationLoading,
    setLastUpdatedAt: dashboardState.setLastUpdatedAt,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    setCurrentPage: dashboardState.setCurrentPage,
    setTotalItems: dashboardState.setTotalItems,
    initialFetchDone,
    isFirstRender
  })

  // Filter handlers hook
  const { handlePageChange } = useDashboardFilters({
    searchTerm,
    setSearchTerm: dashboardState.setSearchTerm,
    statusFilter,
    setStatusFilter: dashboardState.setStatusFilter,
    sortBy,
    setSortBy: dashboardState.setSortBy,
    sortOrder,
    setSortOrder: dashboardState.setSortOrder,
    currentPage,
    setCurrentPage: dashboardState.setCurrentPage,
    setPageSize: dashboardState.setPageSize,
    fetchBusinessesPaginated
  })

  // Clean up stale localStorage key from previous implementation
  useEffect(() => { localStorage.removeItem('bizclear_onboarding_skipped') }, [])

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await get('/api/admin/announcements', { skipAuth: true })
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

  // Show welcome state only for truly new users who have never completed onboarding
  useEffect(() => {
    if (!loading && businesses.length === 0 && !showAddForm && !showWelcomeState && !hasCompletedOnboarding.current) {
      const completed = localStorage.getItem('bizclear_onboarding_completed')
      if (!completed) {
        dashboardState.setShowWelcomeState(true)
      }
    }
    if (!loading && businesses.length > 0) {
      hasCompletedOnboarding.current = true
    }
  }, [businesses.length, loading, showAddForm, showWelcomeState, hasCompletedOnboarding, dashboardState])

  const handleBackFromForm = () => {
    dashboardState.setShowReadOnlyForm(false)
    resetFormState()
    fetchBusinesses()
  }

  const handleBusinessSelect = useCallback((businessId) => {
    const application = businesses.find(b => (b.businessId || b._id) === businessId)
    if (application) {
      const appStatus = application.applicationStatus || application.permitStatus || ''
      if (isDraftStatus(appStatus)) {
        openEditApplicationForm(application)
      } else {
        selectBusiness(businessId)
      }
    }
  }, [businesses, selectBusiness, openEditApplicationForm])

  const handleAddBusiness = useCallback(() => {
    // Count draft, pending, and submitted applications
    const draftOrPendingCount = businesses.filter(
      b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
    ).length

    if (draftOrPendingCount >= 2) {
      message.warning('You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.')
      return
    }

    dashboardState.setShowBusinessTypeSelector(true)
    dashboardState.setSelectedBusinessId(null)
    dashboardState.setShowAddForm(false)
    setEditingApplication(null)
  }, [dashboardState, setEditingApplication, businesses, message])

  // Calculate draft limit status for UI
  const draftLimitReached = businesses.filter(
    b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
  ).length >= 2

  const handleBusinessTypeSelect = useCallback((registrationType) => {
    openApplicationForm({ registrationType, fromWelcome: false })
    dashboardState.setShowBusinessTypeSelector(false)
  }, [openApplicationForm, dashboardState])

  const handleWelcomeSelect = useCallback((registrationType) => {
    // Count draft, pending, and submitted applications
    const draftOrPendingCount = businesses.filter(
      b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
    ).length

    if (draftOrPendingCount >= 2) {
      message.warning('You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.')
      return
    }

    localStorage.setItem('bizclear_onboarding_completed', '1')
    hasCompletedOnboarding.current = true
    openApplicationForm({ registrationType, fromWelcome: true })
    dashboardState.setShowWelcomeState(false)
  }, [openApplicationForm, dashboardState, hasCompletedOnboarding, businesses, message])

  const handleLinkExisting = useCallback(() => {
    localStorage.setItem('bizclear_onboarding_completed', '1')
    hasCompletedOnboarding.current = true
    message.info('Link existing business feature coming soon!')
    dashboardState.setShowWelcomeState(false)
  }, [message, dashboardState, hasCompletedOnboarding])


  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LottieSpinner size="large" />
      </div>
    )
  }

  if (!currentUser || roleSlug !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LottieSpinner size="large" tip="Redirecting..."><div style={{ minHeight: 48 }} /></LottieSpinner>
      </div>
    )
  }

  return (
    <BusinessOwnerLayout
      pageTitle="Business Dashboard"
      pageIcon={<ShopOutlined />}
      showBrandLogo={true}
      onRefresh={fetchBusinesses}
      lastUpdated={lastUpdatedAt}
      socketConnected={socketConnected}
      loading={loading}
      onSettingsClick={toggleSettings}
    >
      {showWelcomeState ? (
        // Welcome State - Full width, no panels
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <WelcomeInline
            onSelect={handleWelcomeSelect}
            onLinkExisting={handleLinkExisting}
          />
        </div>
      ) : isMobile ? (
        // Mobile View
        <BusinessOwnerDashboardMobileView
          businesses={businesses}
          loading={loading}
          selectedBusinessId={selectedBusinessId}
          showAddForm={showAddForm}
          showSettings={showSettings}
          showReadOnlyForm={showReadOnlyForm}
          showBusinessTypeSelector={showBusinessTypeSelector}
          editingApplication={editingApplication}
          setEditingApplication={setEditingApplication}
          formSubmitting={formSubmitting}
          setFormSubmitting={setFormSubmitting}
          permitType={permitType}
          currentPage={currentPage}
          totalItems={totalItems}
          announcementItems={announcementItems}
          announcements={announcements}
          defaultOpenKey={defaultOpenKey}
          readAnnouncements={readAnnouncements}
          onBusinessSelect={handleBusinessSelect}
          onAddBusiness={handleAddBusiness}
          onPageChange={handlePageChange}
          onBusinessTypeSelect={handleBusinessTypeSelect}
          onLinkExisting={handleLinkExisting}
          onBackFromForm={handleBackFromForm}
          onSetBusinesses={setBusinesses}
          onFetchBusinesses={fetchBusinesses}
          themeSettings={themeSettings}
          dashboardState={dashboardState}
          draftLimitReached={draftLimitReached}
        />
      ) : (
        // Desktop View
        <BusinessOwnerDashboardDesktopView
          businesses={businesses}
          loading={loading}
          selectedBusinessId={selectedBusinessId}
          showAddForm={showAddForm}
          showSettings={showSettings}
          showReadOnlyForm={showReadOnlyForm}
          showBusinessTypeSelector={showBusinessTypeSelector}
          editingApplication={editingApplication}
          setEditingApplication={setEditingApplication}
          formSubmitting={formSubmitting}
          setFormSubmitting={setFormSubmitting}
          permitType={permitType}
          currentPage={currentPage}
          totalItems={totalItems}
          announcementItems={announcementItems}
          announcements={announcements}
          defaultOpenKey={defaultOpenKey}
          readAnnouncements={readAnnouncements}
          onBusinessSelect={handleBusinessSelect}
          onAddBusiness={handleAddBusiness}
          onPageChange={handlePageChange}
          onBusinessTypeSelect={handleBusinessTypeSelect}
          onLinkExisting={handleLinkExisting}
          onBackFromForm={handleBackFromForm}
          onSetBusinesses={setBusinesses}
          onFetchBusinesses={fetchBusinesses}
          themeSettings={themeSettings}
          dashboardState={dashboardState}
          draftLimitReached={draftLimitReached}
        />
      )}
    </BusinessOwnerLayout>
  )
}
