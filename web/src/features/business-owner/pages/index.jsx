import { useEffect, useCallback } from 'react'
import { App } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import BusinessOwnerLayout from '../components/shared/BusinessOwnerLayout'
import WelcomeInline from '../components/onboarding/WelcomeModal'
import ApplicationsIndex from './applications/index'
import UserSettingsView from '@/features/user/pages/profileSettings/UserSettingsView'
import { useAuthSession } from '@/features/authentication'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { useApplicationsState } from './applications/hooks/useApplicationsState'
import { useBusinessDashboard } from './applications/hooks/useBusinessDashboard'

export default function BusinessOwnerIndex() {
  const { message } = App.useApp()
  const { currentUser, roleSlug, isLoading: authLoading } = useAuthSession()
  const themeSettings = useThemeSettings(message)

  // State management hook
  const dashboardState = useApplicationsState()
  const {
    businesses,
    loading,
    showWelcomeState,
    hasCompletedOnboarding,
    openApplicationForm,
  } = dashboardState

  // Data fetching hook
  const { fetchBusinesses } = useBusinessDashboard({
    businesses,
    setBusinesses: dashboardState.setBusinesses,
    editingApplication: dashboardState.editingApplication,
    setEditingApplication: dashboardState.setEditingApplication,
    loading,
    setLoading: dashboardState.setLoading,
    paginationLoading: dashboardState.paginationLoading,
    setPaginationLoading: dashboardState.setPaginationLoading,
    setLastUpdatedAt: dashboardState.setLastUpdatedAt,
    currentPage: dashboardState.currentPage,
    pageSize: dashboardState.pageSize,
    searchTerm: dashboardState.searchTerm,
    statusFilter: dashboardState.statusFilter,
    sortBy: dashboardState.sortBy,
    sortOrder: dashboardState.sortOrder,
    setCurrentPage: dashboardState.setCurrentPage,
    setTotalItems: dashboardState.setTotalItems,
    initialFetchDone: dashboardState.initialFetchDone,
    isFirstRender: dashboardState.isFirstRender
  })

  // Clean up stale localStorage key from previous implementation
  useEffect(() => { localStorage.removeItem('bizclear_onboarding_skipped') }, [])

  // Show welcome state only for truly new users who have never completed onboarding
  useEffect(() => {
    if (!loading && businesses.length === 0 && !showWelcomeState && !hasCompletedOnboarding.current) {
      const completed = localStorage.getItem('bizclear_onboarding_completed')
      if (!completed) {
        dashboardState.setShowWelcomeState(true)
      }
    }
    if (!loading && businesses.length > 0) {
      hasCompletedOnboarding.current = true
    }
  }, [businesses.length, loading, showWelcomeState, hasCompletedOnboarding, dashboardState])

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
      lastUpdated={dashboardState.lastUpdatedAt}
      socketConnected={false}
      loading={loading}
      onSettingsClick={dashboardState.toggleSettings}
    >
      {showWelcomeState ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <WelcomeInline
            onSelect={handleWelcomeSelect}
            onLinkExisting={handleLinkExisting}
          />
        </div>
      ) : dashboardState.showSettings ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <UserSettingsView
              showBackButton={false}
              themeSettings={themeSettings}
              embedded={true}
            />
          </div>
        </div>
      ) : (
        <ApplicationsIndex />
      )}
    </BusinessOwnerLayout>
  )
}
