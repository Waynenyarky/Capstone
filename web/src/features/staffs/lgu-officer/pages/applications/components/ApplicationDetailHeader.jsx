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
  const isReturned = applicationStatus === 'returned' || applicationStatus === 'needs_revision';

  const getPrimaryButton = () => {
    // Hide buttons for final decision states (rejected, returned)
    if (isRejected || isReturned) {
      return null;
    }
    // Show "Go To Business" button only when application is approved
    if (isApproved) {
      return {
        text: 'Go To Business',
        icon: <ShopOutlined />,
        onClick: onGoToBusiness || (() => {}),
        type: 'primary',
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
      actionButtons={actionButtons}
      desktopOnly={true}
    />
  )
}
