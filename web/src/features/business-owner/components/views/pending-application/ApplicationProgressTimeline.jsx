import { Steps } from 'antd'
import { formatDate } from '../../../utils/formatters.js'
import { isApprovedStatus, isRejectedStatus } from '../../../utils/statusUtils'

export default function ApplicationProgressTimeline({ business, status: _status, statusLower, latestAppeal}) {
  const isRejected = isRejectedStatus(statusLower) || statusLower === 'appeal_pending'
  const isApproved = isApprovedStatus(statusLower)
  const isAppealPending = statusLower === 'appeal_pending'
  const hasActiveAppeal = business.hasActiveAppeal || isAppealPending
  const appealExhausted = business.appealExhausted
  const hasAppeal = hasActiveAppeal || appealExhausted || latestAppeal
  
  const steps = [
    {
      title: 'Draft Completed',
      description: business.createdAt ? `Finished on: ${formatDate(business.createdAt)}` : 'Not started',
      status: 'finish'
    },
    {
      title: 'Submitted to LGU',
      description: business.submittedAt ? `Finished on: ${formatDate(business.submittedAt)}` : 'Not submitted',
      status: ['submitted', 'under_review', 'needs_revision', 'resubmit', 'approved', 'rejected', 'appeal_pending'].includes(statusLower) ? 'finish' : 'wait'
    },
    {
      title: statusLower === 'needs_revision' ? 'Review Completed' : 'Under Review',
      description: statusLower === 'submitted' ? 'Expected within 24 hours'
                  : statusLower === 'under_review' ? (business.reviewedAt
                      ? `Started on: ${formatDate(business.reviewedAt)}`
                      : 'In Review')
                  : statusLower === 'needs_revision' ? `Started on: ${formatDate(business.updatedAt) || 'Completed'}`
                  : business.reviewedAt ? `Finished on: ${formatDate(business.reviewedAt)}`
                  : 'Pending',
      status: statusLower === 'under_review' ? 'process'
           : statusLower === 'needs_revision' ? 'finish'
           : ['approved', 'rejected', 'appeal_pending'].includes(statusLower) ? 'finish'
           : 'wait'
    },
    {
      title: statusLower === 'needs_revision' ? 'Resubmit to Review'
           : (isRejected || isAppealPending) ? 'Rejected'
           : isApproved ? 'Approved'
           : 'Decision Pending',
      description: statusLower === 'needs_revision' ? 'Make requested changes'
                  : statusLower === 'approved' ? `Finished on: ${formatDate(business.reviewedAt)}`
                  : (statusLower === 'rejected' || isAppealPending) ? `Finished on: ${formatDate(business.reviewedAt)}`
                  : 'Pending',
      status: statusLower === 'needs_revision' ? 'process'
           : (isRejected || isAppealPending) ? 'error'
           : isApproved ? 'finish'
           : 'wait'
    }
  ]
  
  // Add appeal steps for rejected applications that have filed an appeal
  if (isRejected && hasAppeal) {
    // Step 5: Appeal Filed
    steps.push({
      title: 'Appeal Filed',
      description: latestAppeal?.createdAt ? `Finished on: ${formatDate(latestAppeal.createdAt)}` : 'Submitted',
      status: 'finish'
    })

    // Step 6: Appeal Decision
    if (latestAppeal?.status === 'approved') {
      steps.push({
        title: 'Appeal Approved',
        description: 'Application returned for re-review',
        status: 'finish'
      })
    } else if (latestAppeal?.status === 'rejected' || appealExhausted) {
      steps.push({
        title: 'Appeal Rejected',
        description: 'Final decision',
        status: 'error'
      })
    } else {
      // Appeal pending (submitted or under_review)
      steps.push({
        title: 'Appeal Decision',
        description: 'Awaiting review',
        status: 'process'
      })
    }
  }

  const currentStep = steps.findIndex(step => step.status === 'process')
  // If no 'process' step, find first 'wait' step
  const finalCurrentStep = currentStep === -1 ? steps.findIndex(step => step.status === 'wait') : currentStep

  return (
    <Steps
      direction="vertical"
      size="small"
      current={finalCurrentStep}
      items={steps}
      style={{ paddingTop: 8 }}
    />
  )
}
