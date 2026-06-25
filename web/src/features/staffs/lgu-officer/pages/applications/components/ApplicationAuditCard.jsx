import { Card, Typography, Space, theme } from 'antd'

const { Text } = Typography

export default function ApplicationAuditCard({ audit, selected, onSelect, token: tokenProp }) {
  const { token } = theme.useToken()
  const t = tokenProp ?? token

  // Get officer name from metadata based on event type
  const getOfficerName = () => {
    const metadata = audit.metadata || {}
    if (audit.eventType === 'application_submitted') {
      return `Submitted by ${metadata.submittedByName || 'Unknown'}`
    }
    if (audit.eventType === 'application_rejected') {
      return `Rejected by ${metadata.rejectedByName || 'Unknown'}`
    }
    if (audit.eventType === 'claim') {
      return `Claimed by ${metadata.claimedByName || 'Unknown'}`
    }
    if (audit.eventType === 'release') {
      return `Released by ${metadata.releasedByName || 'Unknown'}`
    }
    if (audit.eventType === 'field_review') {
      return `Reviewed by ${metadata.reviewedByName || 'Unknown'}`
    }
    return 'Unknown'
  }

  // Get event type label
  const getEventTypeLabel = () => {
    if (audit.eventType === 'application_submitted') return 'Application Submitted'
    if (audit.eventType === 'application_rejected') return 'Application Rejected'
    if (audit.eventType === 'claim') return 'Claimed'
    if (audit.eventType === 'release') return 'Released'
    if (audit.eventType === 'field_review') return 'Field Reviewed'
    if (audit.eventType === 'appeal_submitted') return 'Appeal Submitted'
    if (audit.eventType === 'appeal_resolved') return 'Appeal Resolved'
    if (audit.eventType === 'appeal_rejected') return 'Appeal Rejected'
    if (audit.eventType === 'completed_review') return 'Review Completed'
    if (audit.eventType === 'application_returned') return 'Application Returned'
    return audit.eventType
  }

  return (
    <Card
      size="small"
      title={getEventTypeLabel()}
      hoverable
      onClick={() => onSelect?.(audit)}
      style={{
        cursor: 'pointer',
        border: selected ? `1px solid ${t.colorPrimary}` : undefined,
        background: selected ? t.colorBgLayout : undefined,
      }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {getOfficerName()}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(audit.createdAt).toLocaleString()}
        </Text>
      </Space>
    </Card>
  )
}
