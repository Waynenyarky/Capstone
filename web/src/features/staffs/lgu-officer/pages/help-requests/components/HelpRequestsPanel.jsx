import { Typography } from 'antd'
import ListPanel from '@/shared/components/ListPanel'
import PanelCard from '@/shared/components/PanelCard'

const { Text } = Typography

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'gold', label: 'In Progress' },
  needs_response: { color: 'volcano', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'cyan', label: 'Waiting for Owner' },
  closed: { color: 'green', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
}

const PRIORITY_CONFIG = {
  high: { color: 'red', label: 'High Priority' },
  normal: { color: 'blue', label: 'Normal Priority' },
  low: { color: 'default', label: 'Low Priority' },
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_response', label: 'Needs Response' },
  { value: 'waiting_for_business_owner', label: 'Waiting for Owner' },
  { value: 'closed', label: 'Closed' },
  { value: 'invalid', label: 'Invalid' },
]

export default function HelpRequestsPanel({ helpRequests = [], onSelectRequest, isLoading, selectedId, bookmarkedIds = new Set(), onRefresh, showRefresh = false }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderCard = (request, currentSelectedId, onSelect) => {
    const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG.open
    const priorityConf = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.low
    const isBookmarked = bookmarkedIds.has(request.requestId)

    return (
      <PanelCard
        key={request._id || request.requestId}
        item={request}
        selected={currentSelectedId === request.requestId}
        onClick={() => onSelect(request)}
        title={request.subject}
        description={request.message}
        metaInfo={[
          { label: 'Last updated', value: formatDate(request.updatedAt) },
          ...(request.claimedByName ? [{ label: 'Claimed by', value: request.claimedByName }] : []),
        ]}
        tags={[
          { label: statusConf.label, color: statusConf.color },
          { label: priorityConf.label, color: priorityConf.color },
          { label: request.requestId, color: 'default' },
        ]}
        isBookmarked={isBookmarked}
      />
    )
  }

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      placeholder: 'All statuses',
      options: STATUS_OPTIONS,
    },
  ]

  return (
    <ListPanel
      items={helpRequests}
      renderCard={renderCard}
      onSelectItem={onSelectRequest}
      selectedId={selectedId}
      isLoading={isLoading}
      searchPlaceholder="Search requests..."
      filterConfig={filterConfig}
      pageSize={20}
      onRefresh={onRefresh}
      showRefresh={showRefresh}
    />
  )
}
