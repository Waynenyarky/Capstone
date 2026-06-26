import { Steps } from 'antd'
import { formatDate } from '../../../utils/formatters.js'
import { isApprovedStatus, isRejectedStatus } from '../../../utils/statusUtils'
import { useState, useEffect } from 'react'

export default function ApplicationProgressTimeline({ business, status: _status, statusLower, latestAppeal: propLatestAppeal }) {
  const [fetchedAppeal, setFetchedAppeal] = useState(null)
  const [loadingAppeal, setLoadingAppeal] = useState(false)

  // Fetch appeal details if not provided but appealId exists
  useEffect(() => {
    const fetchAppeal = async () => {
      if (!propLatestAppeal && business?.appealId && !loadingAppeal) {
        setLoadingAppeal(true)
        try {
          const { get } = await import('@/lib/http')
          const appeal = await get(`/api/business/appeals/${business.appealId}`)
          setFetchedAppeal(appeal?.data || appeal)
        } catch (err) {
          console.error('Failed to fetch appeal for timeline:', err)
        } finally {
          setLoadingAppeal(false)
        }
      }
    }
    fetchAppeal()
  }, [business?.appealId, propLatestAppeal, loadingAppeal])

  const latestAppeal = propLatestAppeal || fetchedAppeal
  const isRejected = isRejectedStatus(statusLower) || statusLower === 'appeal_pending' || statusLower === 'appeal_rejected'
  const isApproved = isApprovedStatus(statusLower)
  const isAppealPending = statusLower === 'appeal_pending'
  const isAppealRejected = statusLower === 'appeal_rejected'
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
      status: ['submitted', 'under_review', 'needs_revision', 'resubmit', 'approved', 'rejected', 'appeal_pending', 'appeal_rejected'].includes(statusLower) ? 'finish' : 'wait'
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
           : ['approved', 'rejected', 'appeal_pending', 'appeal_rejected'].includes(statusLower) ? 'finish'
           : 'wait'
    },
    {
      title: statusLower === 'needs_revision' ? 'Resubmit to Review'
           : (isRejected || isAppealPending || isAppealRejected) ? 'Rejected'
           : isApproved ? 'Approved'
           : 'Decision Pending',
      description: statusLower === 'needs_revision' ? 'Make requested changes'
                  : statusLower === 'approved' ? `Finished on: ${formatDate(business.reviewedAt)}`
                  : (statusLower === 'rejected' || isAppealPending || isAppealRejected) ? `Finished on: ${formatDate(business.reviewedAt)}`
                  : 'Pending',
      status: statusLower === 'needs_revision' ? 'process'
           : (isRejected || isAppealPending || isAppealRejected) ? 'error'
           : isApproved ? 'finish'
           : 'wait'
    }
  ]
  
  // Add appeal steps for rejected applications that have filed an appeal
  if ((isRejected || isAppealRejected) && hasAppeal) {
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
    } else if (latestAppeal?.status === 'rejected' || appealExhausted || isAppealRejected) {
      steps.push({
        title: 'Appeal Rejected',
        description: latestAppeal?.updatedAt ? `Finished on: ${formatDate(latestAppeal.updatedAt)}` : 'Final decision',
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
