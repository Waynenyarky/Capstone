import { Typography, Tag, Descriptions, Empty } from 'antd'

const { Text, Title } = Typography

const STATUS_CONFIG = {
  submitted: { color: 'blue', label: 'Submitted' },
  under_review: { color: 'gold', label: 'Under Review' },
  resubmit: { color: 'cyan', label: 'Resubmitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  appeal_pending: { color: 'volcano', label: 'Appeal Pending' },
}

const EVENT_TYPE_LABELS = {
  application_submitted: 'Application Submitted',
  application_rejected: 'Application Rejected',
  claim: 'Claimed',
  release: 'Released',
  field_review: 'Field Reviewed',
  appeal_submitted: 'Appeal Submitted',
  appeal_resolved: 'Appeal Resolved',
  appeal_rejected: 'Appeal Rejected',
  completed_review: 'Review Completed',
  application_returned: 'Application Returned',
}

const AUDIT_EVENT_INFO = [
  { event: 'application_submitted', description: 'When a business owner submits a new permit application' },
  { event: 'application_rejected', description: 'When an LGU officer rejects an application' },
  { event: 'claim', description: 'When an LGU officer claims an application for review' },
  { event: 'release', description: 'When an LGU officer releases an application back to the pool' },
  { event: 'field_review', description: 'When an officer reviews and approves/rejects specific form fields' },
  { event: 'appeal_submitted', description: 'When a business owner submits an appeal for a rejected application' },
  { event: 'appeal_resolved', description: 'When an LGU officer approves an appeal' },
  { event: 'appeal_rejected', description: 'When an LGU officer rejects an appeal' },
  { event: 'completed_review', description: 'When an officer completes the review process for an application' },
  { event: 'application_returned', description: 'When an application is returned to the business owner for revisions' },
]

export default function ApplicationAuditDetailPanel({ audit, showInfo }) {
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
        {metadata.fieldKey && (
          <Descriptions.Item label="Field Reviewed">
            <Text code>{metadata.fieldKey}</Text>
            <br />
            <Tag color={metadata.decision === 'approved' ? 'green' : 'red'}>
              {metadata.decision || 'reviewed'}
            </Tag>
          </Descriptions.Item>
        )}
        {metadata.paymentCount && (
          <Descriptions.Item label="Payment Generated">
            {metadata.paymentCount} payment line item{metadata.paymentCount > 1 ? 's' : ''}
          </Descriptions.Item>
        )}
        {metadata.appealStatus && (
          <Descriptions.Item label="Appeal Status">
            <Tag color={metadata.appealStatus === 'approved' ? 'green' : 'red'}>
              {metadata.appealStatus}
            </Tag>
          </Descriptions.Item>
        )}
        {metadata.updatedByName && (
          <Descriptions.Item label="Changed By">{metadata.updatedByName}</Descriptions.Item>
        )}
        {metadata.reviewedByName && (
          <Descriptions.Item label="Reviewed By">{metadata.reviewedByName}</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  )
}
