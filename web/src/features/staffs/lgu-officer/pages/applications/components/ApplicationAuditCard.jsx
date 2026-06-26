import PanelCard from '@/shared/components/PanelCard'

export default function ApplicationAuditCard({ audit, selected, onSelect }) {
  const metadata = audit.metadata || {}

  // Get officer/user name
  const getUserName = () => {
    return metadata.officerName || metadata.claimedByName || metadata.releasedByName || 
           metadata.reviewedByName || metadata.submittedByName || metadata.rejectedByName || 
           metadata.returnedByName || metadata.inspectorName || metadata.registeredByName || 
           metadata.updatedByName || metadata.deletedByName || 'Unknown'
  }

  // Get event type label
  const getEventTypeLabel = () => {
    if (audit.eventType === 'application_submitted') return 'Application Submitted'
    if (audit.eventType === 'application_rejected') return 'Application Rejected'
    if (audit.eventType === 'claim' || audit.eventType === 'application_claimed') return 'Application Claimed'
    if (audit.eventType === 'release' || audit.eventType === 'application_released') return 'Application Released'
    if (audit.eventType === 'field_review' || audit.eventType === 'field_decisions_updated') return 'Field Decisions Updated'
    if (audit.eventType === 'appeal_submitted') return 'Appeal Submitted'
    if (audit.eventType === 'appeal_resolved') return 'Appeal Resolved'
    if (audit.eventType === 'appeal_rejected') return 'Appeal Rejected'
    if (audit.eventType === 'completed_review') return 'Review Completed'
    if (audit.eventType === 'application_returned') return 'Application Returned'
    if (audit.eventType === 'pending_action_created') return 'Pending Action Created'
    if (audit.eventType === 'pending_action_cancelled') return 'Pending Action Cancelled'
    return audit.eventType
  }

  const metaInfo = [
    { label: 'User', value: getUserName() },
    { label: 'Timestamp', value: new Date(audit.createdAt).toLocaleString() },
  ]

  return (
    <PanelCard
      title={getEventTypeLabel()}
      metaInfo={metaInfo}
      selected={selected}
      onClick={() => onSelect?.(audit)}
    />
  )
}
