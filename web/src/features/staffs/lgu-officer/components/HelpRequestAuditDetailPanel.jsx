import { Typography, Tag, Descriptions, Empty } from 'antd'

const { Text } = Typography

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  needs_response: 'Needs Response',
  waiting_for_business_owner: 'Waiting for Owner',
  closed: 'Closed',
  invalid: 'Invalid',
}

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

const EVENT_TYPE_LABELS = {
  claim: 'Claimed',
  release: 'Released',
  status_update: 'Status Changed',
  priority_update: 'Priority Changed',
}

export default function HelpRequestAuditDetailPanel({ audit }) {
  if (!audit) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="Select an audit log to view details" />
      </div>
    )
  }

  const metadata = audit.metadata || {}

  return (
    <div style={{ padding: 16 }}>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Event Type">
          {EVENT_TYPE_LABELS[audit.eventType] || audit.eventType}
        </Descriptions.Item>
        <Descriptions.Item label="User ID">{audit.userId}</Descriptions.Item>
        <Descriptions.Item label="Timestamp">
          {new Date(audit.timestamp).toLocaleString()}
        </Descriptions.Item>
        {metadata.claimedByName && (
          <Descriptions.Item label="Claimed By">{metadata.claimedByName}</Descriptions.Item>
        )}
        {metadata.releasedByName && (
          <Descriptions.Item label="Released By">{metadata.releasedByName}</Descriptions.Item>
        )}
        {metadata.override && (
          <Descriptions.Item label="Override">
            Overrode claim by {metadata.override.fromName || metadata.override.from}
          </Descriptions.Item>
        )}
        {metadata.status && (
          <Descriptions.Item label="Status Change">
            <Tag color="blue">
              {STATUS_LABELS[metadata.status.from] || metadata.status.from}
            </Tag>
            {' → '}
            <Tag color="green">
              {STATUS_LABELS[metadata.status.to] || metadata.status.to}
            </Tag>
          </Descriptions.Item>
        )}
        {metadata.priority && (
          <Descriptions.Item label="Priority Change">
            <Tag>{PRIORITY_LABELS[metadata.priority.from] || metadata.priority.from}</Tag>
            {' → '}
            <Tag color="orange">
              {PRIORITY_LABELS[metadata.priority.to] || metadata.priority.to}
            </Tag>
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  )
}
