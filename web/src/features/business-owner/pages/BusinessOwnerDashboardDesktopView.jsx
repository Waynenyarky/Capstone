import { useRef } from 'react'
import { Typography, theme, App } from 'antd'
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
  isResubmittedStatus
} from '../utils/statusUtils'

const { Title } = Typography

export default function BusinessOwnerDashboardDesktopView({
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
  onBusinessSelect,
  onAddBusiness,
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

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
  const appStatus = selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || ''
  const isDraft = isDraftStatus(appStatus)
  const isApproved = isApprovedStatus(appStatus)
  const isNeedsRevision = isNeedsRevisionStatus(appStatus)
  const isResubmitted = isResubmittedStatus(appStatus)
  const canEditRevision = isNeedsRevisionStatus(appStatus)

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

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    }}>
      {/* Left panel - Business List (30%) - always visible */}
      <div
        data-testid="business-list-panel"
        style={{
          width: '30%',
          minWidth: 280,
          maxWidth: 400,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          paddingRight: 24,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: token.colorBgContainer,
          padding: '24px 24px 24px 16px',
        }}
      >
        {/* Announcements Card */}
        {announcementItems && announcementItems.length > 0 && (
          <AnnouncementsCard
            announcementItems={announcementItems}
            announcements={announcements}
            defaultOpenKey={defaultOpenKey}
            readAnnouncements={readAnnouncements}
            onAnnouncementRead={dashboardState.handleAnnouncementRead}
          />
        )}

        {/* Business List Panel */}
        <ApplicationsList
          businesses={businesses}
          loading={loading}
          selectedBusinessId={selectedBusiness?.businessId || selectedBusiness?._id}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onBusinessSelect={onBusinessSelect}
          onAddBusiness={onAddBusiness}
          totalItems={totalItems}
          isSelectingType={showBusinessTypeSelector}
          draftLimitReached={draftLimitReached}
        />
      </div>

      {/* Right panel - Business Details or Settings */}
      <div
        data-testid="business-details-panel"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          overflow: 'hidden',
        }}
      >
        {showSettings ? (
          // Settings View - Full settings interface
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
          // Dashboard View (original content)
          showBusinessTypeSelector ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
              <ApplicationTypeSelector
                onSelect={onBusinessTypeSelect}
                onLinkExisting={onLinkExisting}
              />
            </div>
          ) : (showAddForm || selectedBusiness) ? (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                    />
                  ) : isApproved ? (
                    <ApprovedView
                      business={selectedBusiness}
                      showAddForm={showAddForm}
                      onRefresh={onFetchBusinesses}
                      token={token}
                    />
                  ) : showReadOnlyForm ? (
                    <>
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
                      />
                      <PermitApplicationForm
                        onBack={onBackFromForm}
                        editingApplication={editingApplication}
                        initialRegistrationType={permitType || null}
                        readOnly={true}
                        hideActionButtons={true}
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
                        token={token}
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
                      token={token}
                    />
                  )}
                </>
              ) : showReadOnlyForm ? (
                <>
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
                  />
                  <PermitApplicationForm
                    onBack={onBackFromForm}
                    editingApplication={editingApplication}
                    initialRegistrationType={permitType || null}
                    readOnly={true}
                    hideActionButtons={true}
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
          ) : null
        )}
      </div>
    </div>
  )
}
