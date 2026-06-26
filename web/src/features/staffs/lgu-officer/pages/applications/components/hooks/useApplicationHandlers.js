import { useState, useCallback } from 'react'
import { App } from 'antd'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/infrastructure/services/permitApplicationService'
import { initiateClearance } from '@/features/business-owner/services/clearanceService'

export function useApplicationHandlers(application, setApplication, onReview, onReviewStarted, initialApplication) {
  const { message } = App.useApp()
  const [reviewing, setReviewing] = useState(false)
  const [startingReview, setStartingReview] = useState(false)
  const [savingLob, setSavingLob] = useState(false)
  const permitService = new PermitApplicationService()

  const loadApplicationDetails = useCallback(async () => {
    if (!initialApplication?.applicationId) return

    try {
      const details = await permitService.getApplicationById(
        initialApplication.applicationId,
        initialApplication.businessId
      )
      setApplication(details)
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    }
  }, [initialApplication?.applicationId, initialApplication?.businessId, permitService, setApplication, message])

  const handleStartReview = useCallback(async () => {
    if (!initialApplication?.applicationId) return
    if (!['submitted', 'resubmit'].includes(initialApplication?.status)) return

    setStartingReview(true)
    try {
      const result = await permitService.startReview({
        applicationId: initialApplication.applicationId,
        businessId: initialApplication.businessId
      })
      
      if (result?.lockedByOfficer) {
        setApplication(result.application)
        if (onReviewStarted) {
          onReviewStarted(result.application)
        }
      } else {
        await loadApplicationDetails()
      }
    } catch (error) {
      console.error('Failed to start review:', error)
      await loadApplicationDetails()
    } finally {
      setStartingReview(false)
    }
  }, [initialApplication, permitService, setApplication, onReviewStarted, loadApplicationDetails])

  const handleFieldDecision = useCallback(async (fieldKey, payload) => {
    if (!application?.applicationId) return
    try {
      const updated = await permitService.updateFieldDecisions({
        applicationId: application.applicationId,
        businessId: application.businessId,
        fieldKey,
        status: payload.status,
        reasonCode: payload.reasonCode,
        reasonOther: payload.reasonOther,
      })
      if (updated) setApplication(updated)
    } catch (error) {
      console.error('Failed to update field decision:', error)
      message.error(error?.message || 'Failed to update field decision')
    }
  }, [application, permitService, setApplication, message])

  const handleSaveLob = useCallback(async (payload) => {
    if (!application?.applicationId) return
    setSavingLob(true)
    try {
      const updated = await permitService.updateLobFormData({
        applicationId: application.applicationId,
        businessId: application.businessId,
        businessDescriptionText: payload.businessDescriptionText,
        businessActivities: payload.businessActivities,
      })
      if (updated) setApplication(updated)
      message.success('LOB changes saved successfully')
    } catch (error) {
      console.error('Failed to save LOB changes:', error)
      message.error(error?.message || 'Failed to save LOB changes')
    } finally {
      setSavingLob(false)
    }
  }, [application, permitService, setApplication, message])


  const handleReview = useCallback(async (values, decision, canReview, allFieldKeys, allFieldsReviewed, decidedCount) => {
    if (!decision) {
      message.error('Please select a decision')
      return
    }

    if (canReview && allFieldKeys.length > 0 && !allFieldsReviewed) {
      message.error(`Please review all fields before submitting. (${decidedCount} of ${allFieldKeys.length} completed)`)
      return
    }

    if (decision === 'reject') {
      if (!values.rejectionReason?.trim()) {
        message.error('Rejection reason is required when rejecting an application')
        return
      }
    }

    if (decision === 'request_changes') {
      if (!values.requestChanges?.trim()) {
        message.error('Request details are required when requesting changes')
        return
      }
    }

    setReviewing(true)
    try {
      let reviewComments = ''
      
      if (decision === 'approve') {
        reviewComments = values.comments?.trim() || ''
      } else if (decision === 'request_changes') {
        reviewComments = values.requestChanges?.trim() || ''
      }

      await onReview({
        applicationId: application.applicationId,
        decision,
        comments: reviewComments,
        rejectionReason: values.rejectionReason?.trim() || '',
        businessId: application.businessId
      })

      // If approved, initiate clearance process
      if (decision === 'approve' && application?.businessId) {
        try {
          // Check if clearance already exists before initiating
          const { getClearanceStatus } = await import('@/features/business-owner/services/clearanceService')
          const clearanceStatus = await getClearanceStatus(application.businessId).catch(() => null)
          if (!clearanceStatus || !clearanceStatus.initiated) {
            await initiateClearance(application.businessId, application.applicationId)
          }
        } catch (clearanceError) {
          console.error('Failed to initiate clearance:', clearanceError)
          // Only show warning if it's not a "already initiated" error
          if (!clearanceError?.message?.includes('already initiated')) {
            message.warning('Application approved but clearance initiation failed. Please initiate manually.')
          }
        }
        message.success('Application approved successfully.')
      } else {
        message.success('Review submitted successfully')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      message.error(error?.message || 'Failed to submit review')
    } finally {
      setReviewing(false)
    }
  }, [application, onReview, message])

  return {
    reviewing,
    startingReview,
    savingLob,
    loadApplicationDetails,
    handleStartReview,
    handleFieldDecision,
    handleSaveLob,
    handleReview,
  }
}
