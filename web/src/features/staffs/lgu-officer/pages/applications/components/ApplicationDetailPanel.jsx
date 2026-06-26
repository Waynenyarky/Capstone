import { useState, useEffect, useCallback, useMemo } from 'react'
import { Typography, Space, theme, Empty, Input, App, Grid } from 'antd'
import { FileTextOutlined, CheckOutlined, CloseOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/infrastructure/services/permitApplicationService'
import { filterSectionsByFormValues } from '@/features/business-owner/utils/formUtils.js'
import {
  LOB_FIELD_DESCRIPTION,
  getReviewableFieldKeys,
} from '@/features/staffs/lgu-officer/utils/fieldKeyUtils'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import { put } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import DocumentPreviewModal from '@/shared/components/DocumentPreviewModal'
import ReviewTabContent from './ReviewTabContent'
import { createSectionTabs } from './SectionTabs'
import ApplicationDetailPanelContent from './ApplicationDetailPanelContent'
import { useApplicationStatus } from './hooks/useApplicationStatus'
import { useApplicationModals } from './hooks/useApplicationModals'
import { useApplicationBookmarks } from './hooks/useApplicationBookmarks'
import { useApplicationAudit } from './hooks/useApplicationAudit'
import DynamicInfoModal from '@/shared/components/DynamicInfoModal'
import ApplicationAuditHistoryModal from './ApplicationAuditHistoryModal'
import RejectApplicationModal from './modals/RejectApplicationModal'
import RejectAppealModal from './modals/RejectAppealModal'
import CompleteReviewModal from './modals/CompleteReviewModal'
import ReturnToApplicantModal from './modals/ReturnToApplicantModal'
import DisabledReasonModal from './modals/DisabledReasonModal'
import BizClearManualModal from './modals/BizClearManualModal'
import ApplicationRejectionReasonModal from './modals/ApplicationRejectionReasonModal'
import AppealRejectionReasonModal from './modals/AppealRejectionReasonModal'
import AppealLetterModal from './modals/AppealLetterModal'
import ApprovalCommentModal from './modals/ApprovalCommentModal'
import ViewReasonModal from './modals/ViewReasonModal'

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
  const [claiming, setClaiming] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const { currentUser } = useAuthSession()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg

  const permitService = useMemo(() => new PermitApplicationService(), [])
  const [application, setApplication] = useState(initialApplication)
  const [formDefinition, setFormDefinition] = useState(null)
  const [formDefLoading, setFormDefLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const { canReview, isFinalDecision, isWaitingForApplicant, isActiveReviewState, isDraft, isClaimedByMe } = useApplicationStatus(application, currentUser)

  // Use extracted hooks
  const {
    documentModal, setDocumentModal,
    documentPreview, setDocumentPreview,
    manualVisible, setManualVisible,
    infoModalOpen, setInfoModalOpen,
    auditModalOpen, setAuditModalOpen,
    rejectModalOpen, setRejectModalOpen,
    rejectAppealModalOpen, setRejectAppealModalOpen,
    completeReviewModalOpen, setCompleteReviewModalOpen,
    returnModalOpen, setReturnModalOpen,
    disabledReasonModal, setDisabledReasonModal,
    viewReasonOpen, setViewReasonOpen,
    showAppRejectionModal, setShowAppRejectionModal,
    showAppealRejectionModal, setShowAppealRejectionModal,
    showAppealLetterModal, setShowAppealLetterModal,
    showApprovalCommentModal, setShowApprovalCommentModal,
    rejectReason, setRejectReason,
    rejectAppealReason, setRejectAppealReason,
    completeReviewComment, setCompleteReviewComment,
    returnRequestType, setReturnRequestType,
    returnRequestOther, setReturnRequestOther,
  } = useApplicationModals()
  const { isBookmarked, _bookmarkId, handleBookmarkToggle } = useApplicationBookmarks(application, onBookmarkToggle)
  const { latestAppeal, _getActiveAppeal } = useApplicationAudit(application)

  // Claim/release state
  const isClaimed = application?.reviewedBy

  // Pending action and countdown
  const pendingAction = application?.pendingAction?.actionType ? application.pendingAction : null

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
          // Default to 'all' for businessType if not specified
          const businessTypeToUse = businessType || 'all'
          res = await getActiveFormDefinition(formType, businessTypeToUse, null)
        }
        if (cancelled) return
        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        } else {
          console.error('Failed to load form definition - no valid response:', res)
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
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }, [initialApplication?.applicationId, initialApplication?.businessId, initialApplication?._id, permitService, message])

  useEffect(() => {
    loadApplicationDetails()
  }, [loadApplicationDetails])

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
        formDefLoading={formDefLoading}
        formDefinition={formDefinition}
        ownerName={ownerName}
        token={token}
        canReview={canReview}
        allFieldKeys={allFieldKeys}
        decidedCount={decidedCount}
        allFieldsReviewed={allFieldsReviewed}
        _rejectedFields={rejectedFields}
        fieldReviewDecisions={fieldReviewDecisions}
        sections={sections}
        _isWaitingForApplicant={isWaitingForApplicant}
        _isFinalDecision={isFinalDecision}
        isDraft={isDraft}
        _loadApplicationDetails={loadApplicationDetails}
        _message={message}
        ownerIdentity={ownerIdentity}
        businessReg={businessReg}
        onShowAppRejectionModal={() => setShowAppRejectionModal(true)}
        onShowAppealRejectionModal={() => setShowAppealRejectionModal(true)}
        onShowAppealLetterModal={() => setShowAppealLetterModal(true)}
        onShowApprovalCommentModal={() => setShowApprovalCommentModal(true)}
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
      message.success('Return scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to schedule return')
    }
  }

  const handleRejectClick = () => {
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason?.trim()) {
      message.error('Please provide a rejection reason')
      return
    }
    const appId = application?.applicationId || application?.businessId || application?._id
    try {
      await permitService.createPendingAction(appId, null, 'reject', {
        decision: 'other',
        comments: rejectReason,
        rejectionReason: rejectReason,
      })
      setRejectModalOpen(false)
      message.success('Rejection scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (error) {
      message.error(error?.message || 'Failed to schedule rejection')
    }
  }

  const handleRejectAppealClick = async () => {
    setRejectAppealReason('')
    const businessId = application?.businessId || application?.applicationId
    if (!businessId) {
      message.error('Unable to find appeal information')
      return
    }
    try {
      const { get } = await import('@/lib/http')
      const res = await get(`/api/business/appeals/by-business/${businessId}`)
      const appeals = res?.data || []
      const activeAppeal = appeals.find(a => a.status === 'submitted' || a.status === 'under_review')
      if (!activeAppeal) {
        message.error('No active appeal found for this application')
        return
      }
      setRejectAppealModalOpen(true)
    } catch {
      message.error('Failed to fetch appeal information')
    }
  }

  const handleRejectAppealConfirm = async () => {
    if (!rejectAppealReason?.trim()) {
      message.error('Please provide a rejection reason')
      return
    }
    const appId = application?.applicationId || application?.businessId || application?._id
    const businessId = application?.businessId || application?.applicationId
    try {
      const { get } = await import('@/lib/http')
      const res = await get(`/api/business/appeals/by-business/${businessId}`)
      const appeals = res?.data || []
      const activeAppeal = appeals.find(a => a.status === 'submitted' || a.status === 'under_review')
      if (!activeAppeal) {
        message.error('No active appeal found for this application')
        return
      }
      await permitService.createPendingAction(appId, activeAppeal._id, 'reject_appeal', {
        appealId: activeAppeal._id,
        rejectionReason: rejectAppealReason,
      })
      setRejectAppealModalOpen(false)
      message.success('Appeal rejection scheduled. You can undo until the deadline.')
      await loadApplicationDetails()
    } catch (err) {
      message.error(err?.message || 'Failed to schedule appeal rejection')
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
      onReviewComplete?.()
    } catch (error) {
      message.error(error?.message || 'Failed to execute pending action')
    }
  }

  const isAppealPending = application?.status === 'appeal_pending' || application?.applicationStatus === 'appeal_pending'
  const isAppealRejected = application?.status === 'appeal_rejected' || application?.applicationStatus === 'appeal_rejected'

  const actionButtons = isAppealRejected ? [] : isAppealPending ? [
    {
      text: 'Reject Appeal',
      type: 'default',
      icon: <CloseOutlined />,
      onClick: handleRejectAppealClick,
      disabled: !isClaimedByMe,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : 'Reject this appeal with a required reason',
      onDisabledClick: !isClaimedByMe
        ? () => setDisabledReasonModal({
            open: true,
            message: 'You must claim this application first to perform actions on it.'
          })
        : null,
    },
    {
      text: 'Complete Review',
      type: 'default',
      icon: <CheckOutlined />,
      onClick: handleCompleteReviewClick,
      disabled: !isClaimedByMe,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : 'Complete the appeal review with an optional comment',
      onDisabledClick: !isClaimedByMe
        ? () => setDisabledReasonModal({
            open: true,
            message: 'You must claim this application first to perform actions on it.'
          })
        : null,
    },
    {
      text: 'Return',
      type: 'default',
      icon: <EditOutlined />,
      onClick: handleReturnClick,
      disabled: !isClaimedByMe,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : 'Return the appeal to the applicant with required request type',
      onDisabledClick: !isClaimedByMe
        ? () => setDisabledReasonModal({
            open: true,
            message: 'You must claim this application first to perform actions on it.'
          })
        : null,
    },
  ] : [
    {
      text: 'Reject',
      type: 'default',
      icon: <CloseOutlined />,
      onClick: handleRejectClick,
      disabled: !isClaimedByMe || allFieldsReviewed,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : allFieldsReviewed
          ? 'All fields have been reviewed. A rejection can only be done before completing the field review.'
          : 'Reject this application with a required reason',
      onDisabledClick: (!isClaimedByMe || allFieldsReviewed)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : 'All fields have been reviewed. A rejection can only be done before completing the field review.'
          })
        : null,
    },
    {
      text: 'Complete Review',
      type: 'default',
      icon: <CheckOutlined />,
      onClick: handleCompleteReviewClick,
      disabled: !isClaimedByMe || rejectedFields.length > 0 || !allFieldsReviewed,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : rejectedFields.length > 0
          ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
          : !allFieldsReviewed
            ? 'All fields must be reviewed before you can complete the review.'
            : 'Complete the review with an optional comment',
      onDisabledClick: (!isClaimedByMe || rejectedFields.length > 0 || !allFieldsReviewed)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : rejectedFields.length > 0
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
      disabled: !isClaimedByMe || rejectedFields.length === 0,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : rejectedFields.length === 0
          ? 'Returning the application to the applicant is only available when some fields are marked for changes.'
          : 'Return the application to the applicant with required request type',
      onDisabledClick: (!isClaimedByMe || rejectedFields.length === 0)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : 'Return to Applicant is only available when some fields are marked for changes.'
          })
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

  // If there's a pending action AND claimed by me, show undo button instead of action buttons
  const undoButton = (pendingAction && isClaimedByMe) ? {
    text: getUndoButtonText(pendingAction.actionType, countdown),
    type: 'default',
    icon: <CloseOutlined />,
    onClick: handleUndoPendingAction,
    tooltip: 'Cancel this pending action',
    fullWidthOnMobile: true,
  } : null

  const viewReasonButton = (pendingAction && isClaimedByMe) ? {
    text: 'View Reason',
    type: 'default',
    icon: <EyeOutlined />,
    onClick: () => setViewReasonOpen(true),
    tooltip: 'View the reason for this pending action',
  } : null

  const fastTrackButton = (pendingAction && isClaimedByMe) ? {
    text: 'Execute Now',
    type: 'default',
    icon: <CheckOutlined />,
    onClick: handleExecutePendingActionNow,
    tooltip: 'Execute this pending action immediately',
  } : null

  const resolvedActionButtons = (isFinalDecision || isWaitingForApplicant)
    ? []
    : undoButton
      ? [undoButton, viewReasonButton, fastTrackButton]
      : actionButtons

  const activeContent = tabItems.find((t) => t.key === activeTab)?.children

  return (
    <>
      <ApplicationDetailPanelContent
        loading={loading}
        startingReview={startingReview}
        setActiveTab={setActiveTab}
        application={application}
        isWaitingForApplicant={isWaitingForApplicant}
        ownerIdentity={ownerIdentity}
        businessReg={businessReg}
        ownerName={ownerName}
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
        hasPendingAction={pendingAction}
      />
      <DocumentPreviewModal
        open={documentModal.open}
        onClose={() => setDocumentModal({ open: false, url: null, label: '', type: 'other' })}
        url={documentModal.url}
        label={documentModal.label}
        type={documentModal.type}
      />
      <DynamicInfoModal
        slotId="lgu-officer-application-review"
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Application Review Information"
      />
      <BizClearManualModal
        open={manualVisible}
        onClose={() => setManualVisible(false)}
      />
      <RejectApplicationModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
      />
      <RejectAppealModal
        open={rejectAppealModalOpen}
        onClose={() => setRejectAppealModalOpen(false)}
        onConfirm={handleRejectAppealConfirm}
        rejectAppealReason={rejectAppealReason}
        setRejectAppealReason={setRejectAppealReason}
      />
      <CompleteReviewModal
        open={completeReviewModalOpen}
        onClose={() => setCompleteReviewModalOpen(false)}
        onConfirm={handleCompleteReviewConfirm}
        completeReviewComment={completeReviewComment}
        setCompleteReviewComment={setCompleteReviewComment}
      />
      <ReturnToApplicantModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onConfirm={handleReturnConfirm}
        returnRequestOther={returnRequestOther}
        setReturnRequestOther={setReturnRequestOther}
      />
      <DisabledReasonModal
        open={disabledReasonModal.open}
        onClose={() => setDisabledReasonModal({ open: false, message: '' })}
        message={disabledReasonModal.message}
      />
      <ApplicationAuditHistoryModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        applicationId={application?.businessId || application?.applicationId || application?._id}
      />
      <ApplicationRejectionReasonModal
        open={showAppRejectionModal}
        onClose={() => setShowAppRejectionModal(false)}
        rejectionReason={application?.rejectionReason}
      />
      <AppealRejectionReasonModal
        open={showAppealRejectionModal}
        onClose={() => setShowAppealRejectionModal(false)}
        appealResolution={latestAppeal?.resolution}
      />
      <AppealLetterModal
        open={showAppealLetterModal}
        onClose={() => setShowAppealLetterModal(false)}
        latestAppeal={latestAppeal}
        setDocumentPreview={setDocumentPreview}
      />
      <ApprovalCommentModal
        open={showApprovalCommentModal}
        onClose={() => setShowApprovalCommentModal(false)}
        reviewComments={application?.reviewComments}
      />
      <DocumentPreviewModal
        open={documentPreview.open}
        onClose={() => setDocumentPreview({ open: false, url: null, label: '', type: 'other' })}
        url={documentPreview.url}
        label={documentPreview.label}
        type={documentPreview.type}
      />
      <ViewReasonModal
        open={viewReasonOpen}
        onClose={() => setViewReasonOpen(false)}
        pendingAction={pendingAction}
        isMobile={isMobile}
      />
    </>
  )
}
