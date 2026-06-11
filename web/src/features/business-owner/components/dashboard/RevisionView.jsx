import PermitApplicationForm from '../forms/PermitApplicationForm'
import ApplicationHeader from './ApplicationHeader'

export default function RevisionView({
  business,
  formRef,
  formSubmitting,
  setFormSubmitting,
  showAddForm,
  onBack,
  onSubmitted,
  onToggleForm,
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
          isNeedsRevision={true}
          isResubmitted={false}
          canEditRevision={true}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onToggleForm={onToggleForm}
          onSubmitApplication={() => formRef.current?.submitApplication?.()}
          token={token}
        />
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PermitApplicationForm
          ref={formRef}
          embedded
          onSubmittingChange={setFormSubmitting}
          key={`${business?.businessId || business?._id || 'edit'}-${showAddForm}`}
          onBack={onBack}
          editingApplication={business}
          readOnly={false}
          hideActionButtons={true}
          onSubmitted={(response) => {
            if (response?.businesses?.length) onSubmitted(response.businesses)
            else onSubmitted()
          }}
        />
      </div>
      {isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={false}
          isApproved={false}
          isNeedsRevision={true}
          isResubmitted={false}
          canEditRevision={true}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onToggleForm={onToggleForm}
          onSubmitApplication={() => formRef.current?.submitApplication?.()}
          token={token}
          isFooter={true}
        />
      )}
    </div>
  )
}
