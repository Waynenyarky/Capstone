import { CheckOutlined, CloseOutlined, HistoryOutlined, BookOutlined, InfoCircleOutlined, StarOutlined, StarFilled, ShopOutlined } from '@ant-design/icons'
import DetailHeader from '@/shared/components/DetailHeader'

export default function ApplicationDetailHeader({
  isClaimed,
  isClaimedByMe,
  claiming,
  onClaim,
  onRelease,
  onHistoryClick,
  onManualClick,
  onInfoClick,
  actionButtons = [],
  isBookmarked = false,
  onBookmarkToggle,
  hasPendingAction = false,
  onGoToBusiness,
  applicationStatus,
}) {
  // Only disable release button when pending action is 'complete_review' (approval pending)
  const isApprovalPending = hasPendingAction?.actionType === 'complete_review';
  const isApproved = applicationStatus === 'approved';
  const isRejected = applicationStatus === 'rejected' || applicationStatus === 'appeal_rejected';
  const isReturned = applicationStatus === 'needs_revision' || applicationStatus === 'returned';

  const getPrimaryButton = () => {
    // Show "Go To Business" button only when application is approved
    if (isApproved) {
      return {
        text: 'Go To Business',
        icon: <ShopOutlined />,
        onClick: onGoToBusiness || (() => {}),
        type: 'primary',
      }
    }
    // When there's a pending action, show disabled claim/release buttons
    if (hasPendingAction) {
      if (!isClaimed) {
        return {
          text: 'Claim',
          icon: <CheckOutlined />,
          onClick: onClaim,
          disabled: true,
        }
      }
      if (isClaimedByMe) {
        return {
          text: 'Release',
          icon: <CloseOutlined />,
          onClick: onRelease,
          disabled: true,
        }
      }
      return {
        text: 'Claimed by another officer',
        icon: null,
        onClick: onClaim,
        disabled: true,
      }
    }
    // When in final decision states (rejected, returned), show disabled claim/release buttons
    if (isRejected || isReturned) {
      if (!isClaimed) {
        return {
          text: 'Claim',
          icon: <CheckOutlined />,
          onClick: onClaim,
          disabled: true,
        }
      }
      if (isClaimedByMe) {
        return {
          text: 'Release',
          icon: <CloseOutlined />,
          onClick: onRelease,
          disabled: true,
        }
      }
      return {
        text: 'Claimed by another officer',
        icon: null,
        onClick: onClaim,
        disabled: true,
      }
    }
    // When approval is pending AND is claimed by me, show disabled release button
    if (isApprovalPending && isClaimedByMe) {
      return {
        text: 'Release',
        icon: <CloseOutlined />,
        onClick: onRelease,
        disabled: true,
      }
    }
    // Otherwise, show normal claim/release buttons
    if (!isClaimed) {
      return {
        text: 'Claim',
        icon: <CheckOutlined />,
        onClick: onClaim,
        loading: claiming,
      }
    }
    if (isClaimedByMe) {
      return {
        text: 'Release',
        icon: <CloseOutlined />,
        onClick: onRelease,
        loading: claiming,
      }
    }
    return {
      text: 'Claimed by another officer',
      icon: null,
      onClick: onClaim,
      loading: claiming,
    }
  }

  // Hide action buttons only when there's NO pending action AND in final decision states
  const effectiveActionButtons = !hasPendingAction && (isRejected || isReturned) ? [] : actionButtons;

  return (
    <DetailHeader
      title="Application Details"
      primaryButton={getPrimaryButton()}
      iconButtons={[
        { icon: isBookmarked ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />, onClick: onBookmarkToggle, title: isBookmarked ? 'Remove Bookmark' : 'Add Bookmark' },
        { icon: <HistoryOutlined />, onClick: onHistoryClick, title: 'History' },
        { icon: <BookOutlined />, onClick: onManualClick, title: 'Manual' },
        { icon: <InfoCircleOutlined />, onClick: onInfoClick, title: 'Info' },
      ]}
      actionButtons={effectiveActionButtons}
      desktopOnly={true}
    />
  )
}
