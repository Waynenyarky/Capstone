import { useRef, useState, useEffect } from 'react'
import { Typography, theme, App, Drawer, Tag } from 'antd'
import ApplicationsList from '../components/dashboard/ApplicationsList'
import AnnouncementsCard from '../components/dashboard/AnnouncementsCard'
import PermitApplicationForm from '../components/forms/PermitApplicationForm'
import UserSettingsView from '@/features/user/pages/profileSettings/UserSettingsView'
import ApplicationTypeSelector from '../components/onboarding/ApplicationTypeSelector'
import DraftView from '../components/dashboard/DraftView'
import PendingView from '../components/dashboard/PendingView'
import ApprovedView from '../components/dashboard/ApprovedView'
import RevisionView from '../components/dashboard/RevisionView'
import ApplicationHeader from '../components/dashboard/ApplicationHeader'
import { deleteBusiness } from '../services/businessProfileService'
import {
  isDraftStatus,
  isApprovedStatus,
  isNeedsRevisionStatus,
  isResubmittedStatus,
  getBusinessDisplayName
} from '../utils/statusUtils'

const { Title } = Typography

export default function BusinessOwnerDashboardMobileView({
  businesses,
  loading,
  selectedBusinessId,
  showAddForm,
  showSettings,
  showReadOnlyForm,
  showBusinessTypeSelector,
  editingApplication,
  setEditingApplication,
  formSubmitting,
  setFormSubmitting,
  permitType,
  currentPage,
  totalItems,
  announcementItems,
  announcements,
  defaultOpenKey,
  readAnnouncements,
  onBusinessSelect: _onBusinessSelect,
  onAddBusiness: _onAddBusiness,
  onPageChange,
  onBusinessTypeSelect,
  onLinkExisting,
  onBackFromForm,
  onSetBusinesses,
  onFetchBusinesses,
  themeSettings,
  dashboardState,
  draftLimitReached = false
}) {
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const formRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [businessTypeDrawerOpen, setBusinessTypeDrawerOpen] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState({ isAutosaving: false, hasUnsavedChanges: false })

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
  const appStatus = selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || ''
  const isDraft = isDraftStatus(appStatus)
  const isApproved = isApprovedStatus(appStatus)
  const isNeedsRevision = isNeedsRevisionStatus(appStatus)
  const isResubmitted = isResubmittedStatus(appStatus)
  const canEditRevision = isNeedsRevisionStatus(appStatus)
  const displayName = getBusinessDisplayName(selectedBusiness)

  const handleDeleteApplication = async (business) => {
    const businessId = business.businessId || business._id
    try {
      await deleteBusiness(businessId)
      message.success('Application deleted.')
      // Clear localStorage draft to prevent restoration of deleted draft data
      localStorage.removeItem('addBusinessFormDraft')
      if (selectedBusinessId === businessId) {
        dashboardState.setSelectedBusinessId(null)
        dashboardState.setShowAddForm(false)
        setEditingApplication(null)
      }
      onFetchBusinesses()
    } catch (err) {
      console.error('Failed to delete application:', err)
      message.error(err?.message || 'Failed to delete application')
    }
  }

  const handleDeleteDraftClick = () => {
    if (!selectedBusiness) return
    modal.confirm({
      title: 'Delete draft application?',
      content: 'This will permanently remove this draft. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDeleteApplication(selectedBusiness),
    })
  }

  const handleBusinessSelect = (businessId) => {
    // In mobile mode, if a new application form is open, close it first
    if (showAddForm && !selectedBusinessId) {
      dashboardState.setShowAddForm(false)
      dashboardState.setShowBusinessTypeSelector(false)
      setEditingApplication(null)
    }
    // In mobile mode, always select the business (drawer opens via effect)
    // Don't use parent's handleBusinessSelect as it might open form directly for drafts
    dashboardState.setSelectedBusinessId(businessId)
  }

  // Open the details drawer when a business is selected
  // Do NOT open it for the form - the form should be inline in the drawer content
  useEffect(() => {
    if (selectedBusinessId) {
      setDrawerOpen(true)
    }
  }, [selectedBusinessId])

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    dashboardState.setSelectedBusinessId(null)
    dashboardState.setShowAddForm(false)
  }

  const handleAddBusiness = () => {
    // Count draft, pending, and submitted applications
    const draftOrPendingCount = businesses.filter(
      b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
    ).length

    if (draftOrPendingCount >= 2) {
      message.warning('You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.')
      return
    }

    setBusinessTypeDrawerOpen(true)
    // Clear any existing selection and form state
    dashboardState.setSelectedBusinessId(null)
    dashboardState.setShowAddForm(false)
    dashboardState.setShowBusinessTypeSelector(true)
    // Close details drawer if open
    setDrawerOpen(false)
  }

  const detailsContent = showSettings ? (
    <UserSettingsView
      showBackButton={false}
      themeSettings={themeSettings}
      embedded={true}
    />
  ) : showBusinessTypeSelector ? (
    <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ApplicationTypeSelector
        onSelect={onBusinessTypeSelect}
        onLinkExisting={onLinkExisting}
      />
    </div>
  ) : (showAddForm || selectedBusiness) ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {selectedBusiness ? (
        <>
          {isDraft ? (
            <DraftView
              business={selectedBusiness}
              formRef={formRef}
              formSubmitting={formSubmitting}
              setFormSubmitting={setFormSubmitting}
              showAddForm={showAddForm}
              onBack={onBackFromForm}
              onSubmitted={(response) => {
                if (response?.businesses?.length) onSetBusinesses(response.businesses)
                else onFetchBusinesses()
                dashboardState.setShowAddForm(false)
              }}
              onDraftCreated={(newBusiness) => {
                onSetBusinesses(prev => [newBusiness, ...prev.filter(b => (b.businessId || b._id) !== (newBusiness.businessId || newBusiness._id))])
                setEditingApplication(newBusiness)
                dashboardState.setSelectedBusinessId(newBusiness.businessId || newBusiness._id)
                onFetchBusinesses()
              }}
              onDeleteDraft={handleDeleteDraftClick}
              onToggleForm={() => dashboardState.setShowAddForm(prev => !prev)}
              token={token}
              isMobile={true}
              onAutosaveStatusChange={setAutosaveStatus}
            />
          ) : isApproved ? (
            <ApprovedView
              business={selectedBusiness}
              showAddForm={showAddForm}
              onRefresh={onFetchBusinesses}
              token={token}
              isMobile={true}
            />
          ) : showReadOnlyForm ? (
            <>
              <PermitApplicationForm
                onBack={onBackFromForm}
                editingApplication={editingApplication}
                initialRegistrationType={permitType || null}
                readOnly={true}
                hideActionButtons={true}
              />
              <ApplicationHeader
                business={selectedBusiness || editingApplication}
                isDraft={false}
                isApproved={false}
                isNeedsRevision={false}
                isResubmitted={false}
                showAddForm={showAddForm}
                formSubmitting={formSubmitting}
                onToggleForm={() => {
                  dashboardState.setShowReadOnlyForm(false)
                  dashboardState.setShowAddForm(false)
                }}
                onOpenForm={dashboardState.openReadOnlyApplicationForm}
                showReadOnlyForm={showReadOnlyForm}
                token={token}
                isMobile={true}
                isFooter={true}
              />
            </>
          ) : isNeedsRevision ? (
            showAddForm ? (
              <RevisionView
                business={selectedBusiness}
                formRef={formRef}
                formSubmitting={formSubmitting}
                setFormSubmitting={setFormSubmitting}
                showAddForm={showAddForm}
                onBack={onBackFromForm}
                onSubmitted={(response) => {
                  if (response?.businesses?.length) onSetBusinesses(response.businesses)
                  else onFetchBusinesses()
                  dashboardState.setShowAddForm(false)
                }}
                onToggleForm={() => dashboardState.setShowAddForm(prev => !prev)}
                onSubmitApplication={() => formRef.current?.submitApplication?.()}
                token={token}
                isMobile={true}
              />
            ) : (
              <PendingView
                business={selectedBusiness}
                isNeedsRevision={isNeedsRevision}
                isResubmitted={isResubmitted}
                canEditRevision={canEditRevision}
                showAddForm={showAddForm}
                formSubmitting={formSubmitting}
                onEdit={dashboardState.openRevisionForm}
                onOpenForm={dashboardState.openReadOnlyApplicationForm}
                onToggleForm={() => dashboardState.setShowAddForm(prev => !prev)}
                onSubmitApplication={() => formRef.current?.submitApplication?.()}
                onRefresh={onFetchBusinesses}
                token={token}
                isMobile={true}
              />
            )
          ) : (
            <PendingView
              business={selectedBusiness}
              isNeedsRevision={isNeedsRevision}
              isResubmitted={isResubmitted}
              canEditRevision={canEditRevision}
              showAddForm={showAddForm}
              formSubmitting={formSubmitting}
              onEdit={canEditRevision ? dashboardState.openRevisionForm : undefined}
              onOpenForm={dashboardState.openReadOnlyApplicationForm}
              onToggleForm={() => dashboardState.setShowAddForm(prev => !prev)}
              onSubmitApplication={() => formRef.current?.submitApplication?.()}
              onRefresh={onFetchBusinesses}
              token={token}
              isMobile={true}
            />
          )}
        </>
      ) : showReadOnlyForm ? (
        <>
          <PermitApplicationForm
            onBack={onBackFromForm}
            editingApplication={editingApplication}
            initialRegistrationType={permitType || null}
            readOnly={true}
            hideActionButtons={true}
          />
          <ApplicationHeader
            business={editingApplication}
            isDraft={false}
            isApproved={false}
            isNeedsRevision={false}
            isResubmitted={false}
            showAddForm={showAddForm}
            formSubmitting={formSubmitting}
            onToggleForm={() => {
              dashboardState.setShowReadOnlyForm(false)
              dashboardState.setShowAddForm(false)
            }}
            onOpenForm={dashboardState.openReadOnlyApplicationForm}
            showReadOnlyForm={showReadOnlyForm}
            token={token}
            isMobile={true}
            isFooter={true}
          />
        </>
      ) : (
        <PermitApplicationForm
          onBack={onBackFromForm}
          editingApplication={editingApplication}
          initialRegistrationType={permitType || null}
          onDraftCreated={(newBusiness) => {
            const newId = newBusiness.businessId || newBusiness._id
            onSetBusinesses(prev => [newBusiness, ...prev.filter(b => (b.businessId || b._id) !== newId)])
            setEditingApplication(newBusiness)
            dashboardState.setSelectedBusinessId(newId)
            onFetchBusinesses()
          }}
        />
      )}
    </div>
  ) : (
    <div style={{ padding: 16, textAlign: 'center', color: token.colorTextSecondary }}>
      Select an application to view details
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Main Content - Applications List */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px' }}>
        {announcementItems && announcementItems.length > 0 && (
          <AnnouncementsCard
            announcementItems={announcementItems}
            announcements={announcements}
            defaultOpenKey={defaultOpenKey}
            readAnnouncements={readAnnouncements}
            onAnnouncementRead={dashboardState.handleAnnouncementRead}
          />
        )}
        <ApplicationsList
          businesses={businesses}
          loading={loading}
          selectedBusinessId={selectedBusiness?.businessId || selectedBusiness?._id}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onBusinessSelect={handleBusinessSelect}
          onAddBusiness={handleAddBusiness}
          totalItems={totalItems}
          isSelectingType={showBusinessTypeSelector}
          draftLimitReached={draftLimitReached}
        />
      </div>

      {/* Details Drawer */}
      <Drawer
        title={
          selectedBusiness ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {displayName}
              {isDraft && (
                <Tag
                  color={autosaveStatus.isAutosaving ? 'processing' : autosaveStatus.hasUnsavedChanges ? 'warning' : 'success'}
                  style={{ margin: 0, fontWeight: 'normal' }}
                >
                  {autosaveStatus.isAutosaving ? 'Saving...' : autosaveStatus.hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                </Tag>
              )}
            </div>
          ) : 'Details'
        }
        placement="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        width="100%"
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        {detailsContent}
      </Drawer>

      {/* Business Type Selector Drawer */}
      <Drawer
        title="Select Business Type"
        placement="bottom"
        open={businessTypeDrawerOpen}
        onClose={() => setBusinessTypeDrawerOpen(false)}
        height="100%"
        styles={{ body: { padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <ApplicationTypeSelector
          onSelect={(registrationType) => {
            // Close business type drawer
            setBusinessTypeDrawerOpen(false)
            // Trigger the form flow
            onBusinessTypeSelect(registrationType)
            // Open details drawer with form after a small delay
            setTimeout(() => setDrawerOpen(true), 100)
          }}
          onLinkExisting={onLinkExisting}
        />
      </Drawer>
    </div>
  )
}
