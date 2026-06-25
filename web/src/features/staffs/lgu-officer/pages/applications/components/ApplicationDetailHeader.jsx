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
  isFinalDecision = false,
  hasPendingAction = false,
}) {
  const getPrimaryButton = () => {
    // Show "Go To Business" button when application has a final decision
    if (isFinalDecision) {
      return {
        text: 'Go To Business',
        icon: <ShopOutlined />,
        onClick: () => {},
        type: 'primary',
      }
    }
    // Hide claim/release button when application has a pending action
    if (hasPendingAction) {
      return null
    }
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
