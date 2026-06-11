import { useState } from 'react'
import PermitApplicationForm from '../forms/PermitApplicationForm'
import ApplicationHeader from './ApplicationHeader'

export default function DraftView({
  business,
  formRef,
  formSubmitting,
  setFormSubmitting,
  showAddForm,
  onBack,
  onSubmitted,
  onDraftCreated,
  onDeleteDraft,
  onToggleForm,
  token,
  isMobile = false,
  onAutosaveStatusChange = null
}) {
  const [allSectionsComplete, setAllSectionsComplete] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState({ isAutosaving: false, hasUnsavedChanges: false })

  // Use parent's autosave status handler if provided, otherwise use local state
  const handleAutosaveStatusChange = onAutosaveStatusChange || setAutosaveStatus

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {!isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={true}
          isApproved={false}
          isNeedsRevision={false}
          isResubmitted={false}
          canEditRevision={false}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onDeleteDraft={onDeleteDraft}
          onSubmitApplication={() => formRef.current?.submitApplication?.()}
          onFillTestData={() => formRef.current?.fillTestData?.()}
          onToggleForm={onToggleForm}
          allSectionsComplete={allSectionsComplete}
          token={token}
          isAutosaving={autosaveStatus.isAutosaving}
          hasUnsavedChanges={autosaveStatus.hasUnsavedChanges}
        />
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PermitApplicationForm
          ref={formRef}
          embedded
          onSubmittingChange={setFormSubmitting}
          onAutosaveStatusChange={handleAutosaveStatusChange}
          key={`${business?.businessId || business?._id || 'edit'}-${showAddForm}`}
          onBack={onBack}
          editingApplication={business}
          readOnly={false}
          onSubmitted={(response) => {
            if (response?.businesses?.length) onSubmitted(response.businesses)
            else onSubmitted()
          }}
          onDraftCreated={onDraftCreated}
          onSectionCompleteChange={setAllSectionsComplete}
        />
      </div>
      {isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={true}
          isApproved={false}
          isNeedsRevision={false}
          isResubmitted={false}
          canEditRevision={false}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onDeleteDraft={onDeleteDraft}
          onSubmitApplication={() => formRef.current?.submitApplication?.()}
          onFillTestData={() => formRef.current?.fillTestData?.()}
          onToggleForm={onToggleForm}
          allSectionsComplete={allSectionsComplete}
          token={token}
          isAutosaving={autosaveStatus.isAutosaving}
          hasUnsavedChanges={autosaveStatus.hasUnsavedChanges}
          isFooter={true}
        />
      )}
    </div>
  )
}
