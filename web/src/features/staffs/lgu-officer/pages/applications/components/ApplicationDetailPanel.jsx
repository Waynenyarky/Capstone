import { useState, useEffect, useCallback, useMemo } from 'react'
import { Typography, Space, theme, Empty, Input, Modal, App, Select, Button } from 'antd'
import { FileTextOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { PermitApplicationService } from '@/features/lgu-officer/infrastructure/services'
import BookmarkService from '@/features/staffs/lgu-officer/infrastructure/services/bookmarkService'
import { filterSectionsByFormValues } from '@/features/business-owner/utils/formUtils.js'
import {
  LOB_FIELD_DESCRIPTION,
  getReviewableFieldKeys,
  REQUEST_OPTIONS,
  REJECTION_REASON_OPTIONS,
} from '../../../constants/rejectionReasons'
import { generatePaymentsForApprovedBusiness } from '@/features/business-owner/services/paymentGenerationService'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import { put } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import DocumentModal from './DocumentModal'
import ReviewTabContent from './ReviewTabContent'
import { createSectionTabs } from './SectionTabs'
import ApplicationDetailPanelContent from './ApplicationDetailPanelContent'
import { useApplicationStatus } from './hooks/useApplicationStatus'
import DynamicInfoModal from '@/shared/components/DynamicInfoModal'
import DynamicPageContent from '@/shared/components/DynamicPageContent'
import ApplicationAuditHistoryModal from './ApplicationAuditHistoryModal'

const { Text, Title } = Typography
const { TextArea } = Input

export default function ApplicationDetailPanel({
  application: initialApplication,
  onReviewComplete,
  onReview: _onReview,
  onReviewStarted,
  onSelectApplication: _onSelectApplication,
  onBookmarkToggle,
}) {
  const [startingReview, setStartingReview] = useState(false)
  const [savingLob, setSavingLob] = useState(false)
  const [activeTab, setActiveTab] = useState('review')
  const [documentModal, setDocumentModal] = useState({ open: false, url: null, label: '', type: 'other' })
  const [retryingPayments, setRetryingPayments] = useState(false)
  const [manualVisible, setManualVisible] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [completeReviewModalOpen, setCompleteReviewModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState(undefined)
  const [rejectReasonOther, setRejectReasonOther] = useState('')
  const [completeReviewComment, setCompleteReviewComment] = useState('')
  const [returnRequestType, setReturnRequestType] = useState(undefined)
  const [returnRequestOther, setReturnRequestOther] = useState('')
  const [disabledReasonModal, setDisabledReasonModal] = useState({ open: false, message: '' })
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const { currentUser } = useAuthSession()

  const permitService = useMemo(() => new PermitApplicationService(), [])
  const bookmarkService = useMemo(() => new BookmarkService(), [])
  const [application, setApplication] = useState(initialApplication)
  const [formDefinition, setFormDefinition] = useState(null)
  const [formDefLoading, setFormDefLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentGenStatus, _setPaymentGenStatus] = useState(null)

  const { canReview, isFinalDecision, isWaitingForApplicant, isActiveReviewState, isDraft, isClaimedByMe } = useApplicationStatus(application, currentUser)

  // Claim/release state
  const isClaimed = application?.reviewedBy

  // Pending action and countdown
  const pendingAction = application?.pendingAction

  useEffect(() => {
    if (!pendingAction?.expiresAt) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const expiresAt = new Date(pendingAction.expiresAt)
      const diff = expiresAt - now

      if (diff <= 0) {
        setCountdown(null)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [pendingAction?.expiresAt])

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication)
      setActiveTab('review')
    }
  }, [initialApplication])

  const app = application || initialApplication
  const formDefId = app?.formDefinitionId
  const formType = app?.formType || 'permit'
  const businessType = app?.businessRegistration?.businessType || app?.organizationType || null
  const appIdentifier = app?.applicationId || app?.businessId

  useEffect(() => {
    // Accept either applicationId or businessId as valid identifier
    if (!appIdentifier) {
      setFormDefinition(null)
      return
    }

    let cancelled = false
    setFormDefLoading(true)
    setFormDefinition(null)

    const fetchDef = async () => {
      try {
        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, businessType, null)
        }
        if (cancelled) return
        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load form definition for review:', e)
      } finally {
        if (!cancelled) setFormDefLoading(false)
      }
    }
    fetchDef()
    return () => { cancelled = true }
  }, [appIdentifier, formDefId, formType, businessType])

  const loadApplicationDetails = useCallback(async () => {
    // Accept either applicationId or businessId as valid identifier (old flat schema uses businessId)
    const appId = initialApplication?.applicationId || initialApplication?.businessId || initialApplication?._id
    if (!appId) return

    setLoading(true)
    try {
      const details = await permitService.getApplicationById(
        appId,
        initialApplication.businessId
      )
      setApplication(details)

      // Check if bookmarked
      const bookmarkAppId = details.businessId || details.applicationId || details._id
      try {
        const bookmarkCheck = await bookmarkService.checkBookmark('application', bookmarkAppId)
        setIsBookmarked(bookmarkCheck.isBookmarked)
        setBookmarkId(bookmarkCheck.bookmark?._id || null)
      } catch (bookmarkError) {
        console.error('Failed to check bookmark status:', bookmarkError)
        setIsBookmarked(false)
        setBookmarkId(null)
      }
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }, [initialApplication?.applicationId, initialApplication?.businessId, permitService, bookmarkService, message])

  useEffect(() => {
    loadApplicationDetails()
  }, [loadApplicationDetails])

  const handleRetryPaymentGeneration = async () => {
    if (!application?.businessId) return
    setRetryingPayments(true)
    try {
      const result = await generatePaymentsForApprovedBusiness(application.businessId, application)
      if (result.success) {
        message.success(`Successfully generated ${result.payments.length} payment(s)`)
      } else {
        message.error(`Payment generation failed: ${result.errors.join(', ')}`)
      }
    } catch {
      message.error('Failed to retry payment generation')
    } finally {
      setRetryingPayments(false)
    }
  }

  const handleBookmarkToggle = async () => {
    const appId = application?.businessId || application?.applicationId || application?._id
    if (!appId) return

    try {
      if (isBookmarked && bookmarkId) {
        await bookmarkService.removeBookmark(bookmarkId)
        setIsBookmarked(false)
        setBookmarkId(null)
        message.success('Bookmark removed')
      } else {
        const bookmark = await bookmarkService.addBookmark('application', appId)
        setIsBookmarked(true)
        setBookmarkId(bookmark._id)
        message.success('Application bookmarked')
      }
      onBookmarkToggle?.()
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      // If it's a 409 (already bookmarked), re-check the bookmark status
      if (error?.message?.includes('already bookmarked') || error?.status === 409) {
        const bookmarkCheck = await bookmarkService.checkBookmark('application', appId)
        setIsBookmarked(bookmarkCheck.isBookmarked)
        setBookmarkId(bookmarkCheck.bookmark?._id || null)
        message.info('Already bookmarked')
        onBookmarkToggle?.()
      } else {
        message.error('Failed to update bookmark')
      }
    }
  }

  const _handleStartReview = async () => {
    if (!initialApplication?.applicationId) return
    if (!['submitted', 'resubmit'].includes(initialApplication?.status)) return

    setStartingReview(true)
    try {
      const result = await permitService.startReview({
        applicationId: initialApplication.applicationId,
        businessId: initialApplication.businessId
      })

      if (result?.lockedByOfficer) {
        message.warning(`This application is already under review by ${result.lockedByOfficer}`)
        await loadApplicationDetails()
      } else if (result?.application) {
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
  }

  const handleClaim = useCallback(async () => {
    const appId = application?.applicationId || application?._id || application?.businessId
    if (!appId) return

    if (isClaimed && !isClaimedByMe) {
      modal.confirm({
        title: 'Override Claim',
        content: `This application is already claimed by ${application.reviewedByName || 'another officer'}. Are you sure you want to override their claim?`,
        okText: 'Override',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: async () => {
          setClaiming(true)
          try {
            await put(`/api/lgu-officer/permit-applications/${appId}/claim`)
            message.success('Application claimed')
            await loadApplicationDetails()
            onReviewComplete?.()
          } catch (err) {
            message.error(err?.error?.message || 'Failed to claim')
          } finally {
            setClaiming(false)
          }
        },
      })
    } else {
      modal.confirm({
        title: 'Claim Application',
        content: `Are you sure you want to claim this application?`,
        okText: 'Claim',
        cancelText: 'Cancel',
        onOk: async () => {
          setClaiming(true)
          try {
            await put(`/api/lgu-officer/permit-applications/${appId}/claim`)
            message.success('Application claimed')
            await loadApplicationDetails()
            onReviewComplete?.()
          } catch (err) {
            message.error(err?.error?.message || 'Failed to claim')
          } finally {
            setClaiming(false)
          }
        },
      })
    }
  }, [application, isClaimed, isClaimedByMe, loadApplicationDetails, onReviewComplete, message, modal])

  const handleRelease = useCallback(async () => {
    const appId = application?.applicationId || application?._id || application?.businessId
    if (!appId) return

    modal.confirm({
      title: 'Release Application',
      content: `Are you sure you want to release this application? It will become available for other officers.`,
      okText: 'Release',
      cancelText: 'Cancel',
      onOk: async () => {
        setClaiming(true)
        try {
          await put(`/api/lgu-officer/permit-applications/${appId}/release`)
          message.success('Application released')
          await loadApplicationDetails()
          onReviewComplete?.()
        } catch (err) {
          message.error(err?.error?.message || 'Failed to release')
        } finally {
          setClaiming(false)
        }
      },
    })
  }, [application, loadApplicationDetails, onReviewComplete, message, modal])

  if (!initialApplication) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select an application to view details</Text>}
        />
      </div>
    )
  }

  const ownerIdentity = application?.ownerIdentity || {}
  const businessReg = application?.businessRegistration || {}
  const _location = application?.location || {}
  const _riskProfile = application?.riskProfile || {}
  const _birRegistration = application?.birRegistration || {}
  const _otherAgencies = application?.otherAgencyRegistrations || {}
  const _documents = application?.documents || {}
  const _aiValidation = application?.aiValidation

  // Backend now provides ownerName directly from getApplicationById
  const ownerName = application?.ownerName || 'N/A'

  const _requirementsChecklist = application?.requirementsChecklist || {}

  const formData = application?.formData && typeof application.formData === 'object' ? application.formData : {}
  const sections = formDefinition ? filterSectionsByFormValues(formDefinition.sections || [], formData) : []
  // ST-PA-17: Officer field editing is intentionally scoped to LOB fields only.
  // Other form fields (business info, address, etc.) are owner-controlled and
  // can only be changed via the Edit Request workflow.
  const { keys: allFieldKeys = [], lobSectionIndex } = getReviewableFieldKeys(sections, formData)
  const fieldReviewDecisions = application?.fieldReviewDecisions && typeof application.fieldReviewDecisions === 'object' ? application.fieldReviewDecisions : {}
  const decidedCount = allFieldKeys.filter((k) => fieldReviewDecisions[k]?.status).length
  const allFieldsReviewed = allFieldKeys.length > 0 && decidedCount >= allFieldKeys.length
  const rejectedFields = allFieldKeys.filter((k) => fieldReviewDecisions[k]?.status === 'rejected')

  const handleFieldDecision = async (fieldKey, payload) => {
    const appId = application?.applicationId || application?.businessId || application?._id
    if (!appId) {
      console.error('[ApplicationDetailPanel] No applicationId or businessId, cannot update field decision')
      return
    }

    try {
      const updated = await permitService.updateFieldDecisions({
        applicationId: appId,
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
  }

  const handleSaveLob = async (payload) => {
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
      message.success('LOB changes saved')
    } catch (error) {
      console.error('Failed to save LOB:', error)
      message.error(error?.message || 'Failed to save LOB changes')
    } finally {
      setSavingLob(false)
    }
  }



  const sectionTabs = createSectionTabs(
    sections,
    lobSectionIndex,
    formDefLoading,
    formData,
    fieldReviewDecisions,
    isActiveReviewState,
    handleFieldDecision,
    handleSaveLob,
    token,
    savingLob,
    businessReg,
    application,
    setDocumentModal,
    isFinalDecision || isWaitingForApplicant || !!pendingAction // isFinalState when in final decision state, waiting for applicant, or has pending action
  )


  const reviewTab = {
    key: 'review',
    label: (
      <Space>
        <FileTextOutlined />
        <span>Review</span>
      </Space>
    ),
    children: (
      <ReviewTabContent
        application={application}
        paymentGenStatus={paymentGenStatus}
        handleRetryPaymentGeneration={handleRetryPaymentGeneration}
        retryingPayments={retryingPayments}
        formDefLoading={formDefLoading}
        formDefinition={formDefinition}
        ownerName={ownerName}
        token={token}
        canReview={canReview}
        allFieldKeys={allFieldKeys}
        decidedCount={decidedCount}
        allFieldsReviewed={allFieldsReviewed}
        rejectedFields={rejectedFields}
        fieldReviewDecisions={fieldReviewDecisions}
        sections={sections}
        isWaitingForApplicant={isWaitingForApplicant}
        isFinalDecision={isFinalDecision}
        isDraft={isDraft}
        loadApplicationDetails={loadApplicationDetails}
        message={message}
        ownerIdentity={ownerIdentity}
        businessReg={businessReg}
      />
    ),
  }

  const tabItems = [
    reviewTab,
    ...sectionTabs
  ]

  const navItems = tabItems.map((t) => ({ key: t.key, label: t.label }))
  const mainNavItems = navItems.slice(0, 1)
  const formNavItems = navItems.slice(1)

  const getSectionStatus = (sectionIdx) => {
    const sectionKeys = sectionIdx === lobSectionIndex
      ? allFieldKeys.filter((k) => k === LOB_FIELD_DESCRIPTION || k.startsWith('businessActivities.'))
      : allFieldKeys.filter((k) => String(k).startsWith(`${sectionIdx}.`))
    if (sectionKeys.length === 0) return null
    const hasRejected = sectionKeys.some((k) => fieldReviewDecisions[k]?.status === 'rejected')
    const allDecided = sectionKeys.every((k) => fieldReviewDecisions[k]?.status)
    if (hasRejected) return 'rejected'
    if (allDecided) return 'ok'
    return 'pending'
  }

  const handleRejectClick = () => {
    setRejectReason(undefined)
    setRejectReasonOther('')
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason) {
      message.error('Please select a rejection reason')
      return
    }
    if (rejectReason === 'other' && !rejectReasonOther?.trim()) {
      message.error('Please specify the rejection reason')
      return
    }
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.createPendingAction(appId, null, 'reject', {
        decision: rejectReason,
        comments: rejectReasonOther,
        rejectionReason: rejectReason === 'other' ? rejectReasonOther : rejectReason,
      })
      setRejectModalOpen(false)
      message.success('Rejection scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to schedule rejection')
    }
  }

  const handleCompleteReviewClick = () => {
    setCompleteReviewComment('')
    setCompleteReviewModalOpen(true)
  }

  const handleCompleteReviewConfirm = async () => {
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.createPendingAction(appId, null, 'complete_review', {
        comments: completeReviewComment,
      })
      setCompleteReviewModalOpen(false)
      message.success('Review completion scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to schedule review completion')
    }
  }

  const handleReturnClick = () => {
    setReturnRequestType(undefined)
    setReturnRequestOther('')
    setReturnModalOpen(true)
  }

  const handleReturnConfirm = async () => {
    if (!returnRequestType) {
      message.error('Please select a request type')
      return
    }
    if (returnRequestType === 'other' && !returnRequestOther?.trim()) {
      message.error('Please specify the request details')
      return
    }
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.createPendingAction(appId, null, 'return', {
        requestType: returnRequestType,
        requestOther: returnRequestOther,
      })
      setReturnModalOpen(false)
      message.success('Return to applicant scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to schedule return to applicant')
    }
  }

  const handleUndoPendingAction = async () => {
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.cancelPendingAction(appId)
      message.success('Pending action cancelled')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to cancel pending action')
    }
  }

  const handleExecutePendingActionNow = async () => {
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.executePendingActionNow(appId)
      message.success('Pending action executed immediately')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to execute pending action')
    }
  }

  const actionButtons = [
    {
      text: 'Reject',
      type: 'default',
      icon: <CloseOutlined />,
      onClick: handleRejectClick,
      disabled: allFieldsReviewed,
      tooltip: allFieldsReviewed ? 'All fields have been reviewed. A rejection can only be done before completing the field review.' : 'Reject this application with a required reason',
      onDisabledClick: allFieldsReviewed ? () => setDisabledReasonModal({ open: true, message: 'All fields have been reviewed. A rejection can only be done before completing the field review.' }) : null,
    },
    {
      text: 'Complete Review',
      type: 'default',
      icon: <CheckOutlined />,
      onClick: handleCompleteReviewClick,
      disabled: rejectedFields.length > 0 || !allFieldsReviewed,
      tooltip: rejectedFields.length > 0
        ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
        : !allFieldsReviewed
          ? 'All fields must be reviewed before you can complete the review.'
          : 'Complete the review with an optional comment',
      onDisabledClick: (rejectedFields.length > 0 || !allFieldsReviewed)
        ? () => setDisabledReasonModal({
            open: true,
            message: rejectedFields.length > 0
              ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
              : 'All fields must be reviewed before you can complete the review.'
          })
        : null,
    },
    {
      text: 'Return',
      type: 'default',
      icon: <EditOutlined />,
      onClick: handleReturnClick,
      disabled: rejectedFields.length === 0,
      tooltip: rejectedFields.length === 0
        ? 'Returning the application to the applicant is only available when some fields are marked for changes.'
        : 'Return the application to the applicant with required request type',
      onDisabledClick: rejectedFields.length === 0
        ? () => setDisabledReasonModal({ open: true, message: 'Return to Applicant is only available when some fields are marked for changes.' })
        : null,
    },
  ]

  const getUndoButtonText = (actionType, time) => {
    const actionLabels = {
      complete_review: 'approval',
      reject: 'rejection',
      return: 'return to applicant',
    }
    const label = actionLabels[actionType] || 'action'
    return `You can undo ${label} until ${time}`
  }

  // If there's a pending action, show undo button instead of action buttons
  const undoButton = pendingAction ? {
    text: getUndoButtonText(pendingAction.actionType, countdown),
    type: 'default',
    icon: <CloseOutlined />,
    onClick: handleUndoPendingAction,
    tooltip: 'Cancel this pending action',
  } : null

  const fastTrackButton = pendingAction ? {
    text: 'Execute Now',
    type: 'default',
    icon: <CheckOutlined />,
    onClick: handleExecutePendingActionNow,
    tooltip: 'Execute this pending action immediately',
  } : null

  const resolvedActionButtons = (isFinalDecision || isWaitingForApplicant)
    ? []
    : undoButton
      ? [undoButton, fastTrackButton]
      : actionButtons

  const activeContent = tabItems.find((t) => t.key === activeTab)?.children

  return (
    <>
      <ApplicationDetailPanelContent
        loading={loading}
        startingReview={startingReview}
        setActiveTab={setActiveTab}
        application={application}
        isFinalDecision={isFinalDecision}
        isWaitingForApplicant={isWaitingForApplicant}
        ownerIdentity={ownerIdentity}
        businessReg={businessReg}
        ownerName={ownerName}
        paymentGenStatus={paymentGenStatus}
        handleRetryPaymentGeneration={handleRetryPaymentGeneration}
        retryingPayments={retryingPayments}
        rejectedFields={rejectedFields}
        fieldReviewDecisions={fieldReviewDecisions}
        sections={sections}
        loadApplicationDetails={loadApplicationDetails}
        message={message}
        activeContent={activeContent}
        mainNavItems={mainNavItems}
        formNavItems={formNavItems}
        activeTab={activeTab}
        getSectionStatus={getSectionStatus}
        token={token}
        onManualClick={() => setManualVisible(true)}
        onHistoryClick={() => setAuditModalOpen(true)}
        onInfoClick={() => setInfoModalOpen(true)}
        isClaimed={isClaimed}
        isClaimedByMe={isClaimedByMe}
        claiming={claiming}
        onClaim={handleClaim}
        onRelease={handleRelease}
        actionButtons={resolvedActionButtons}
        isBookmarked={isBookmarked}
        onBookmarkToggle={handleBookmarkToggle}
        hasPendingAction={!!pendingAction}
      />
      <DocumentModal
        documentModal={documentModal}
        onClose={() => setDocumentModal({ open: false, url: null, label: '', type: 'other' })}
      />
      <DynamicInfoModal
        slotId="lgu-officer-application-review"
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Application Review Information"
      />
      <Modal
        title="BizClear Manual"
        open={manualVisible}
        onCancel={() => setManualVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <DynamicPageContent slotId="bizclear-manual" embedded compact />
      </Modal>
      <Modal
        title="Reject Application"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleRejectConfirm}
        okText="Reject"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text>
            Select a reason for rejecting this application. The applicant will be notified of the rejection and the reason provided.
          </Text>
          <Select
            placeholder="Select rejection reason"
            options={REJECTION_REASON_OPTIONS}
            value={rejectReason}
            onChange={setRejectReason}
            style={{ width: '100%' }}
          />
          {rejectReason === 'other' && (
            <Input.TextArea
              placeholder="Please specify the rejection reason"
              value={rejectReasonOther}
              onChange={(e) => setRejectReasonOther(e.target.value)}
              rows={3}
            />
          )}
        </Space>
      </Modal>
      <Modal
        title="Complete Review"
        open={completeReviewModalOpen}
        onCancel={() => setCompleteReviewModalOpen(false)}
        onOk={handleCompleteReviewConfirm}
        okText="Complete"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text>
            Complete your review of this application. You may add optional comments for your records.
          </Text>
          <Input.TextArea
            placeholder="Add any comments about this review..."
            value={completeReviewComment}
            onChange={(e) => setCompleteReviewComment(e.target.value)}
            rows={3}
          />
        </Space>
      </Modal>
      <Modal
        title="Return to Applicant"
        open={returnModalOpen}
        onCancel={() => setReturnModalOpen(false)}
        onOk={handleReturnConfirm}
        okText="Return"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text>
            Return this application to the applicant for additional information or corrections. Select the type of request needed.
          </Text>
          <Select
            placeholder="Select request type"
            options={REQUEST_OPTIONS}
            value={returnRequestType}
            onChange={setReturnRequestType}
            style={{ width: '100%' }}
          />
          {returnRequestType === 'other' && (
            <Input.TextArea
              placeholder="Please specify the request details"
              value={returnRequestOther}
              onChange={(e) => setReturnRequestOther(e.target.value)}
              rows={3}
            />
          )}
        </Space>
      </Modal>
      <Modal
        title="Action Not Available"
        open={disabledReasonModal.open}
        onCancel={() => setDisabledReasonModal({ open: false, message: '' })}
        footer={[
          <Button key="close" onClick={() => setDisabledReasonModal({ open: false, message: '' })}>
            Close
          </Button>,
        ]}
      >
        <Text>{disabledReasonModal.message}</Text>
      </Modal>
      <ApplicationAuditHistoryModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        applicationId={application?.businessId || application?.applicationId || application?._id}
      />
    </>
  )
}
