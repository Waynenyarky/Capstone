import ApprovedBusinessView from '../views/ApprovedBusinessView'
import ApplicationHeader from './ApplicationHeader'

export default function ApprovedView({
  business,
  showAddForm,
  onRefresh,
  token,
  isMobile = false
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ApplicationHeader
        business={business}
        isDraft={false}
        isApproved={true}
        isNeedsRevision={false}
        isResubmitted={false}
        canEditRevision={false}
        showAddForm={showAddForm}
        formSubmitting={false}
        isMobile={isMobile}
        token={token}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <ApprovedBusinessView business={business} onRefresh={onRefresh} />
      </div>
    </div>
  )
}
