import { Typography, Tag, Descriptions, Empty } from 'antd'

const { Text, Title } = Typography

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'gold', label: 'In Progress' },
  needs_response: { color: 'volcano', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'cyan', label: 'Waiting for Owner' },
  closed: { color: 'green', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
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

const AUDIT_EVENT_INFO = [
  { event: 'claim', description: 'When an LGU officer claims a help request for handling' },
  { event: 'release', description: 'When an LGU officer releases a help request back to the pool' },
  { event: 'status_update', description: 'When the help request status changes (e.g., open → in_progress → closed)' },
  { event: 'priority_update', description: 'When the priority level is changed (low → normal → high)' },
]

export default function HelpRequestAuditDetailPanel({ audit, showInfo }) {
  if (showInfo) {
    return (
      <div style={{ padding: 16, overflow: 'auto' }}>
        <Title level={5} style={{ marginBottom: 16 }}>Event Types</Title>
        <Descriptions column={1} size="small" bordered>
          {AUDIT_EVENT_INFO.map((item) => (
            <Descriptions.Item key={item.event} label={EVENT_TYPE_LABELS[item.event] || item.event}>
              {item.description}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    )
  }

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
        <Descriptions.Item label="Timestamp">
          {new Date(audit.createdAt).toLocaleString()}
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
            <Tag color={STATUS_CONFIG[metadata.status.from]?.color || 'default'}>
              {STATUS_CONFIG[metadata.status.from]?.label || metadata.status.from}
            </Tag>
            {' → '}
            <Tag color={STATUS_CONFIG[metadata.status.to]?.color || 'default'}>
              {STATUS_CONFIG[metadata.status.to]?.label || metadata.status.to}
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
        {metadata.updatedByName && (
          <Descriptions.Item label="Changed By">{metadata.updatedByName}</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  )
}
