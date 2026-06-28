import { theme } from 'antd'
import ApplicationsList from './components/ApplicationsList'
import ApplicationsAnnouncementsCard from './components/ApplicationsAnnouncementsCard'
import ApplicationTypeSelector from '../../components/onboarding/ApplicationTypeSelector'
import ApplicationDetailPanel from './components/ApplicationDetailPanel'
import PermitApplicationForm from './components/ApplicationPermitForm'
import { getBusinessDisplayName } from './utils/statusUtils'
import { useApplicationsState } from './hooks/useApplicationsState'
import { useBusinessDashboard } from './hooks/useBusinessDashboard'
import { useAnnouncements } from './hooks/useAnnouncements'
import { useBusinessActions } from './hooks/useBusinessActions'
import ResponsiveSplitLayout from '@/shared/components/ResponsiveSplitLayout'

export default function ApplicationsIndex() {
  const { token } = theme.useToken()

  // Announcements hook
  const { announcements, announcementItems, defaultOpenKey } = useAnnouncements()

  // State management hook
  const dashboardState = useApplicationsState()
  const {
    businesses,
    setBusinesses,
    loading,
    selectedBusinessId,
    showAddForm,
    showBusinessTypeSelector,
    editingApplication,
    setEditingApplication,
    currentPage,
    pageSize,
    
    paginationLoading,
    setPaginationLoading,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    initialFetchDone,
    isFirstRender,
    readAnnouncements,
  } = dashboardState

  // Data fetching and socket events hook
  const { fetchBusinesses } = useBusinessDashboard({
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

  // Business actions hook
  const {
    handleBusinessSelect,
    handleAddBusiness,
    handleBusinessTypeSelect,
    draftLimitReached,
  } = useBusinessActions({
    businesses,
    dashboardState,
    setEditingApplication,
    fetchBusinesses,
    selectedBusinessId,
  })

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
  const displayName = getBusinessDisplayName(selectedBusiness)

  // List content for ResponsiveSplitLayout
  const listContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', padding: '24px 24px 24px 16px', width: '100%', maxWidth: 'none' }}>
      {/* Announcements Card */}
      {announcementItems && announcementItems.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <ApplicationsAnnouncementsCard
            announcementItems={announcementItems}
            announcements={announcements}
            defaultOpenKey={defaultOpenKey}
            readAnnouncements={readAnnouncements}
            onAnnouncementRead={dashboardState.handleAnnouncementRead}
          />
        </div>
      )}

      {/* Business List Panel */}
      <ApplicationsList
        businesses={businesses}
        loading={loading}
        selectedBusinessId={selectedBusinessId}
        onBusinessSelect={handleBusinessSelect}
        onAddBusiness={handleAddBusiness}
        isSelectingType={showBusinessTypeSelector}
        draftLimitReached={draftLimitReached}
      />
    </div>
  )

  // Detail content for ResponsiveSplitLayout
  const detailContent = showBusinessTypeSelector ? (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
      <ApplicationTypeSelector
        onSelect={handleBusinessTypeSelect}
      />
    </div>
  ) : showAddForm && editingApplication ? (
    // Editing a draft application - use ApplicationDetailPanel for consistent navigation
    <ApplicationDetailPanel
      business={editingApplication}
      token={token}
      dashboardState={dashboardState}
    />
  ) : showAddForm ? (
    // Creating a new application - show form without header
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PermitApplicationForm
        editingApplication={editingApplication}
        onDraftCreated={async (newBusiness) => {
          const businessId = newBusiness.businessId || newBusiness._id
          // Refetch businesses to get the updated list
          await fetchBusinesses()
          dashboardState.setSelectedBusinessId(businessId)
          dashboardState.setShowAddForm(false)
        }}
        initialRegistrationType={dashboardState.permitType}
      />
    </div>
  ) : selectedBusiness ? (
    <ApplicationDetailPanel
      business={selectedBusiness}
      token={token}
      dashboardState={dashboardState}
    />
  ) : null

  return (
    <ResponsiveSplitLayout
      listContent={listContent}
      detailContent={detailContent}
      drawerTitle={selectedBusiness ? displayName : 'Details'}
      onDrawerClose={() => {
        dashboardState.setSelectedBusinessId(null)
        dashboardState.setShowAddForm(false)
      }}
      mobileDrawerPlacement="right"
      listDefaultSize="350px"
    />
  )
}
