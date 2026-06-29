import DynamicFaqSection from '@/shared/components/DynamicFaqSection'
import { isReturnedStatus, isDraftStatus, isPendingStatus, isApprovedStatus, isRejectedStatus, isNeedsRevisionStatus, isAppealPendingStatus, isAppealRejectedStatus } from '../utils/statusUtils'

export default function ApplicationFaqTab({ business }) {
  const appStatus = business?.applicationStatus || ''
  const isReturned = isReturnedStatus(appStatus)
  const isDraft = isDraftStatus(appStatus)
  const isPending = isPendingStatus(appStatus)
  const isApproved = isApprovedStatus(appStatus)
  const isRejected = isRejectedStatus(appStatus)
  const isNeedsRevision = isNeedsRevisionStatus(appStatus)
  const isAppealPending = isAppealPendingStatus(appStatus)
  const isAppealRejected = isAppealRejectedStatus(appStatus)

  // Determine FAQ slot based on application status
  const getFaqSlotId = () => {
    if (isReturned) return 'business-owner-returned-faq'
    if (isDraft) return 'business-owner-draft-faq'
    if (isPending) return 'business-owner-pending-faq'
    if (isApproved) return 'business-owner-approved-faq'
    if (isNeedsRevision) return 'business-owner-needs-revision-faq'
    if (isAppealPending) return 'business-owner-appeal-pending-faq'
    if (isAppealRejected) return 'business-owner-appeal-rejected-faq'
    // Check rejected last since isRejectedStatus also returns true for appeal_pending
    if (isRejected && !isAppealPending) return 'business-owner-rejected-faq'
    return 'business-owner-application-faq' // default
  }

  return (
    <div>
      <DynamicFaqSection
        slotId={getFaqSlotId()}
        hideWrapper
        hideHeader
      />
    </div>
  )
}

