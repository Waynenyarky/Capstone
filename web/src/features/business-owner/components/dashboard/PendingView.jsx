import PendingApplicationView from '../views/PendingApplicationView'
import ApplicationHeader from './ApplicationHeader'

export default function PendingView({
  business,
  isNeedsRevision,
  isResubmitted,
  canEditRevision,
  showAddForm,
  formSubmitting,
  onEdit,
  onOpenForm,
  onToggleForm,
  onSubmitApplication,
  onRefresh,
  token,
  isMobile = false
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {!isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={false}
          isApproved={false}
          isNeedsRevision={isNeedsRevision}
          isResubmitted={isResubmitted}
          canEditRevision={canEditRevision}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onToggleForm={onToggleForm}
          onOpenForm={onOpenForm}
          onSubmitApplication={onSubmitApplication}
          token={token}
        />
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <PendingApplicationView
          business={business}
          onEdit={canEditRevision ? onEdit : undefined}
          onOpenForm={isResubmitted ? onOpenForm : undefined}
          onRefresh={onRefresh}
        />
      </div>
      {isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={false}
          isApproved={false}
          isNeedsRevision={isNeedsRevision}
          isResubmitted={isResubmitted}
          canEditRevision={canEditRevision}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onToggleForm={onToggleForm}
          onOpenForm={onOpenForm}
          onSubmitApplication={onSubmitApplication}
          token={token}
          isFooter={true}
        />
      )}
    </div>
  )
}
