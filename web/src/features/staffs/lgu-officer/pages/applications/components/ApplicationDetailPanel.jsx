import { useState, useEffect, useMemo, useCallback } from 'react'
import { Typography, Space, theme, Empty, App, Grid } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/services/permitApplicationService'
import { filterSectionsByFormValues } from '@/features/business-owner/utils/formUtils.js'
import {
  LOB_FIELD_DESCRIPTION,
  getReviewableFieldKeys,
} from '@/features/staffs/lgu-officer/utils/fieldKeyUtils'
import { useAuthSession } from '@/features/authentication'
import DocumentPreviewModal from '@/shared/components/DocumentPreviewModal'
import ReviewTabContent from './ApplicationReviewTabContent'
import { createSectionTabs } from './ApplicationSectionTabs'
import ApplicationDetailPanelContent from './ApplicationDetailPanelContent'
import { useApplicationStatus } from '../hooks/useApplicationStatus'
import { useApplicationModals } from '../hooks/useApplicationModals'
import { useApplicationBookmarks } from '../hooks/useApplicationBookmarks'
import { useApplicationAudit, useApplicationAppeals } from '../hooks/useApplicationAudit'
import { usePendingActionCountdown } from '../hooks/usePendingActionCountdown'
import { useFormDefinition } from '../hooks/useFormDefinition'
import { useApplicationClaim } from '../hooks/useApplicationClaim'
import { useApplicationFieldActions } from '../hooks/useApplicationFieldActions'
import { useApplicationPendingActions } from '../hooks/useApplicationPendingActions'
import { useApplicationActions } from '../hooks/useApplicationActions'
import DynamicInfoModal from '@/shared/components/DynamicInfoModal'
import ApplicationAuditHistoryModal from './modals/ApplicationAuditHistoryModal'
import RejectApplicationModal from './modals/ApplicationRejectApplicationModal'
import RejectAppealModal from './modals/ApplicationRejectAppealModal'
import CompleteReviewModal from './modals/ApplicationCompleteReviewModal'
import ReturnToApplicantModal from './modals/ApplicationReturnToApplicantModal'
import DisabledReasonModal from './modals/ApplicationDisabledReasonModal'
import BizClearManualModal from './modals/ApplicationBizClearManualModal'
import ApplicationRejectionReasonModal from './modals/ApplicationRejectionReasonModal'
import AppealRejectionReasonModal from './modals/ApplicationAppealRejectionReasonModal'
import AppealLetterModal from './modals/ApplicationAppealLetterModal'
import ApprovalCommentModal from './modals/ApplicationApprovalCommentModal'
import ViewReasonModal from './modals/ApplicationViewReasonModal'

const { Text, Title } = Typography

export default function ApplicationDetailPanel({
  application: initialApplication,
  onReviewComplete,
  onReview: _onReview,
  onReviewStarted,
  onSelectApplication: _onSelectApplication,
  onBookmarkToggle,
}) {
  const [startingReview, setStartingReview] = useState(false)
  const [activeTab, setActiveTab] = useState('review')
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const { currentUser } = useAuthSession()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg

  const permitService = useMemo(() => new PermitApplicationService(), [])
  const [application, setApplication] = useState(initialApplication)
  const [loading, setLoading] = useState(false)

  const { canReview, isFinalDecision, isWaitingForApplicant, isActiveReviewState, isDraft, isClaimedByMe } = useApplicationStatus(application, currentUser)

  const loadApplicationDetails = useCallback(async () => {
    // Accept either applicationId or businessId as valid identifier (old flat schema uses businessId)
    const appId = initialApplication?.applicationId || initialApplication?.businessId || initialApplication?._id
    if (!appId) return

    setLoading(true)
    try {
      const details = await permitService.getApplicationById(
        appId,
        initialApplication?.businessId
      )
      if (details) setApplication(details)
    } catch (error) {
      console.error('Failed to load application details:', error)
    } finally {
      setLoading(false)
    }
  }, [initialApplication, permitService])

  // Load full application details on mount
  useEffect(() => {
    loadApplicationDetails()
  }, [loadApplicationDetails])

  // Use extracted hooks
  const pendingAction = application?.pendingAction?.actionType ? application.pendingAction : null
  const countdown = usePendingActionCountdown(pendingAction)
  const appIdentifier = application?.applicationId || application?.businessId
  const formDefId = application?.formDefinitionId
  const formType = application?.formType || 'permit'
  const businessType = application?.businessRegistration?.businessType || application?.organizationType || null
  const { formDefinition, formDefLoading } = useFormDefinition(appIdentifier, formDefId, formType, businessType)
  const { handleClaim, handleRelease, isClaimed } = useApplicationClaim(application, loadApplicationDetails, onReviewComplete, isClaimedByMe)
  const { handleFieldDecision, handleSaveLob } = useApplicationFieldActions(application, setApplication)

  // Use extracted hooks - must call useApplicationModals first to get setters
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
    returnRequestOther, setReturnRequestOther,
  } = useApplicationModals()

  const {
    handleReturnConfirm,
    handleRejectClick,
    handleRejectConfirm,
    handleRejectAppealClick,
    handleRejectAppealConfirm,
    handleCompleteReviewClick,
    handleCompleteReviewConfirm,
    handleReturnClick,
    handleUndoPendingAction,
    handleExecutePendingActionNow,
  } = useApplicationPendingActions(
    application,
    loadApplicationDetails,
    onReviewComplete,
    // Values
    rejectReason,
    rejectAppealReason,
    completeReviewComment,
    returnRequestOther,
    // Setters
    setRejectReason,
    setRejectModalOpen,
    setRejectAppealReason,
    setRejectAppealModalOpen,
    setCompleteReviewComment,
    setCompleteReviewModalOpen,
    setReturnRequestOther,
    setReturnModalOpen
  )
  const { isBookmarked, _bookmarkId, handleBookmarkToggle } = useApplicationBookmarks(application, onBookmarkToggle)
  const { auditLogs: _auditLogs, _refreshAudit } = useApplicationAudit(application)
  const { latestAppeal, _getActiveAppeal } = useApplicationAppeals(application)


  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication)
      setActiveTab('review')
    }
  }, [initialApplication])

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

  const ownerIdentity = application?.ownerIdentity || {}
  const businessReg = application?.businessRegistration || {}

  // Fallback logic for owner name - same as ApplicationOwnerDetailsModal
  const bo = application?.businessOwner || {}
  const profile = application?.profile || {}
  const ownerName = application?.ownerName || ownerIdentity?.fullName || businessReg?.ownerFullName || bo?.name || application?.formData?.ownerName || profile?.fullName || 'N/A'

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

  // Helper to get section and field name from fieldKey
  const getFieldDisplayName = (fieldKey) => {
    const parts = fieldKey.split('.')
    const sectionIdx = parseInt(parts[0], 10)
    const fieldKeyPart = parts.slice(1).join('.')

    const section = sections[sectionIdx]
    if (!section) return fieldKey

    const sectionName = section?.label || section?.title || `Section ${sectionIdx + 1}`

    // Find the field in the section items
    const item = section?.items?.find((item) => item.key === fieldKeyPart || item.label === fieldKeyPart)
    const fieldName = item?.label || fieldKeyPart

    return `${sectionName} - ${fieldName}`
  }

  // Calculate fields with request changes
  const requestChangeFields = Object.entries(fieldReviewDecisions)
    .filter(([_, decision]) => decision?.status === 'request_changes')
    .map(([fieldKey, decision]) => ({
      fieldKey,
      displayName: getFieldDisplayName(fieldKey),
      reason: decision?.requestOther || decision?.requestCode || 'No reason provided'
    }))

  const { resolvedActionButtons } = useApplicationActions(
    application,
    isClaimedByMe,
    allFieldsReviewed,
    rejectedFields,
    requestChangeFields,
    isFinalDecision,
    isWaitingForApplicant,
    pendingAction,
    countdown,
    setDisabledReasonModal,
    setViewReasonOpen,
    handleRejectClick,
    handleRejectAppealClick,
    handleCompleteReviewClick,
    handleReturnClick,
    handleUndoPendingAction,
    handleExecutePendingActionNow
  )

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
    false, // savingLob - not used in current implementation
    businessReg,
    application,
    setDocumentModal,
    isFinalDecision || isWaitingForApplicant || !!pendingAction, // isFinalState when in final decision state, waiting for applicant, or has pending action
    (application?.status === 'resubmit' || application?.applicationStatus === 'resubmit') // isResubmit
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
        requestChangeFields={requestChangeFields}
      />
      <DisabledReasonModal
        open={disabledReasonModal.open}
        onClose={() => setDisabledReasonModal({ open: false, message: '' })}
        message={disabledReasonModal.message}
      />
      <ApplicationAuditHistoryModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        application={application}
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
