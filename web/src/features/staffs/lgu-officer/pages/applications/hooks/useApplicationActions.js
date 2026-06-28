import React from 'react'
import { CloseOutlined, CheckOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'

export function useApplicationActions(
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
) {
  const isAppealPending = application?.status === 'appeal_pending' || application?.applicationStatus === 'appeal_pending'
  const isAppealRejected = application?.status === 'appeal_rejected' || application?.applicationStatus === 'appeal_rejected'
  const returnExhausted = application?.returnExhausted || false

  // All fields are approved if all are reviewed and there are no rejected fields or requested changes
  const allFieldsApproved = allFieldsReviewed && rejectedFields.length === 0 && requestChangeFields.length === 0

  const actionButtons = isAppealRejected ? [] : isAppealPending ? [
    {
      text: 'Reject Appeal',
      type: 'default',
      icon: React.createElement(CloseOutlined),
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
      icon: React.createElement(CheckOutlined),
      onClick: handleCompleteReviewClick,
      disabled: !isClaimedByMe || rejectedFields.length > 0 || (requestChangeFields?.length > 0) || !allFieldsReviewed,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : rejectedFields.length > 0
          ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
          : requestChangeFields?.length > 0
            ? 'Cannot complete review with requested changes. Please resolve requested changes first.'
            : !allFieldsReviewed
              ? 'All fields must be reviewed before you can complete the review.'
              : 'Complete the appeal review with an optional comment',
      onDisabledClick: (!isClaimedByMe || rejectedFields.length > 0 || (requestChangeFields?.length > 0) || !allFieldsReviewed)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : rejectedFields.length > 0
                ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
                : requestChangeFields?.length > 0
                  ? 'Cannot complete review with requested changes. Please resolve requested changes first.'
                  : 'All fields must be reviewed before you can complete the review.'
          })
        : null,
    },
    {
      text: 'Return',
      type: 'default',
      icon: React.createElement(EditOutlined),
      onClick: handleReturnClick,
      disabled: !isClaimedByMe || (requestChangeFields?.length === 0) || returnExhausted,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : returnExhausted
          ? 'This application has already been returned once. No further returns are allowed.'
          : requestChangeFields?.length === 0
            ? 'Returning the application to the applicant is only available when some fields are marked for changes.'
            : 'Return the appeal to the applicant with required request type',
      onDisabledClick: (!isClaimedByMe || (requestChangeFields?.length === 0) || returnExhausted)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : returnExhausted
                ? 'This application has already been returned once. No further returns are allowed.'
                : 'Return to Applicant is only available when some fields are marked for changes.'
          })
        : null,
    },
  ] : [
    {
      text: 'Reject',
      type: 'default',
      icon: React.createElement(CloseOutlined),
      onClick: handleRejectClick,
      disabled: !isClaimedByMe || allFieldsApproved,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : allFieldsApproved
          ? 'All fields have been approved. A rejection can only be done before all fields are approved.'
          : 'Reject this application with a required reason',
      onDisabledClick: (!isClaimedByMe || allFieldsApproved)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : 'All fields have been approved. A rejection can only be done before all fields are approved.'
          })
        : null,
    },
    {
      text: 'Complete Review',
      type: 'default',
      icon: React.createElement(CheckOutlined),
      onClick: handleCompleteReviewClick,
      disabled: !isClaimedByMe || rejectedFields.length > 0 || (requestChangeFields?.length > 0) || !allFieldsReviewed,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : rejectedFields.length > 0
          ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
          : requestChangeFields?.length > 0
            ? 'Cannot complete review with requested changes. Please resolve requested changes first.'
            : !allFieldsReviewed
              ? 'All fields must be reviewed before you can complete the review.'
              : 'Complete the review with an optional comment',
      onDisabledClick: (!isClaimedByMe || rejectedFields.length > 0 || (requestChangeFields?.length > 0) || !allFieldsReviewed)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : rejectedFields.length > 0
                ? 'Cannot complete review with rejected fields. Please resolve rejected fields first.'
                : requestChangeFields?.length > 0
                  ? 'Cannot complete review with requested changes. Please resolve requested changes first.'
                  : 'All fields must be reviewed before you can complete the review.'
          })
        : null,
    },
    {
      text: 'Return',
      type: 'default',
      icon: React.createElement(EditOutlined),
      onClick: handleReturnClick,
      disabled: !isClaimedByMe || (requestChangeFields?.length === 0) || returnExhausted,
      tooltip: !isClaimedByMe
        ? 'You must claim this application first to perform actions on it.'
        : returnExhausted
          ? 'This application has already been returned once. No further returns are allowed.'
          : requestChangeFields?.length === 0
            ? 'Returning the application to the applicant is only available when some fields are marked for changes.'
            : 'Return the application to the applicant with required request type',
      onDisabledClick: (!isClaimedByMe || (requestChangeFields?.length === 0) || returnExhausted)
        ? () => setDisabledReasonModal({
            open: true,
            message: !isClaimedByMe
              ? 'You must claim this application first to perform actions on it.'
              : returnExhausted
                ? 'This application has already been returned once. No further returns are allowed.'
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
    icon: React.createElement(CloseOutlined),
    onClick: handleUndoPendingAction,
    tooltip: 'Cancel this pending action',
    fullWidthOnMobile: true,
  } : null

  const viewReasonButton = (pendingAction && isClaimedByMe) ? {
    text: 'View Reason',
    type: 'default',
    icon: React.createElement(EyeOutlined),
    onClick: () => setViewReasonOpen(true),
    tooltip: 'View the reason for this pending action',
  } : null

  const fastTrackButton = (pendingAction && isClaimedByMe) ? {
    text: 'Execute Now',
    type: 'default',
    icon: React.createElement(CheckOutlined),
    onClick: handleExecutePendingActionNow,
    tooltip: 'Execute this pending action immediately',
  } : null

  const resolvedActionButtons = (isFinalDecision || isWaitingForApplicant) && !pendingAction
    ? []
    : undoButton
      ? [undoButton, viewReasonButton, fastTrackButton]
      : actionButtons

  return {
    resolvedActionButtons,
  }
}
