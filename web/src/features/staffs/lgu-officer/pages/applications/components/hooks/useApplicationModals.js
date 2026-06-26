import { useState } from 'react'

/**
 * Manages all modal states for ApplicationDetailPanel
 * Centralizes modal open/close logic to reduce component complexity
 */
export function useApplicationModals() {
  // Document modals
  const [documentModal, setDocumentModal] = useState({ open: false, url: null, label: '', type: 'other' })
  const [documentPreview, setDocumentPreview] = useState({ open: false, url: null, label: '', type: 'other' })

  // Info/help modals
  const [manualVisible, setManualVisible] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  // Audit modal
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  // Action modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectAppealModalOpen, setRejectAppealModalOpen] = useState(false)
  const [completeReviewModalOpen, setCompleteReviewModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  // Disabled reason modal
  const [disabledReasonModal, setDisabledReasonModal] = useState({ open: false, message: '' })
  const [viewReasonOpen, setViewReasonOpen] = useState(false)

  // Appeal-related modals
  const [showAppRejectionModal, setShowAppRejectionModal] = useState(false)
  const [showAppealRejectionModal, setShowAppealRejectionModal] = useState(false)
  const [showAppealLetterModal, setShowAppealLetterModal] = useState(false)
  const [showApprovalCommentModal, setShowApprovalCommentModal] = useState(false)

  // Modal input states
  const [rejectReason, setRejectReason] = useState('')
  const [rejectAppealReason, setRejectAppealReason] = useState('')
  const [completeReviewComment, setCompleteReviewComment] = useState('')
  const [returnRequestType, setReturnRequestType] = useState(undefined)
  const [returnRequestOther, setReturnRequestOther] = useState('')

  return {
    // Document modals
    documentModal,
    setDocumentModal,
    documentPreview,
    setDocumentPreview,

    // Info/help modals
    manualVisible,
    setManualVisible,
    infoModalOpen,
    setInfoModalOpen,

    // Audit modal
    auditModalOpen,
    setAuditModalOpen,

    // Action modals
    rejectModalOpen,
    setRejectModalOpen,
    rejectAppealModalOpen,
    setRejectAppealModalOpen,
    completeReviewModalOpen,
    setCompleteReviewModalOpen,
    returnModalOpen,
    setReturnModalOpen,

    // Disabled reason modal
    disabledReasonModal,
    setDisabledReasonModal,
    viewReasonOpen,
    setViewReasonOpen,

    // Appeal-related modals
    showAppRejectionModal,
    setShowAppRejectionModal,
    showAppealRejectionModal,
    setShowAppealRejectionModal,
    showAppealLetterModal,
    setShowAppealLetterModal,
    showApprovalCommentModal,
    setShowApprovalCommentModal,

    // Modal input states
    rejectReason,
    setRejectReason,
    rejectAppealReason,
    setRejectAppealReason,
    completeReviewComment,
    setCompleteReviewComment,
    returnRequestType,
    setReturnRequestType,
    returnRequestOther,
    setReturnRequestOther,
  }
}
