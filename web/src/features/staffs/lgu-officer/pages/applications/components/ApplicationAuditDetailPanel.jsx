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
  // Application lifecycle
  application_submitted: 'Application Submitted',
  application_rejected: 'Application Rejected',
  application_returned: 'Application Returned',
  review_completed: 'Review Completed',
  decision_revoked: 'Decision Revoked',

  // Claim management
  application_claimed: 'Application Claimed',
  application_released: 'Application Released',
  application_transferred: 'Application Transferred',
  claimed: 'Claimed',
  released: 'Released',

  // Appeals
  appeal_submitted: 'Appeal Submitted',
  appeal_resolved: 'Appeal Resolved',
  appeal_rejected: 'Appeal Rejected',

  // Edit requests
  edit_request_submitted: 'Edit Request Submitted',
  edit_request_applied: 'Edit Request Applied',

  // Field review
  field_reviewed: 'Field Reviewed',
  field_decisions_updated: 'Field Decisions Updated',

  // Pending actions
  pending_action_created: 'Pending Action Created',
  pending_action_cancelled: 'Pending Action Cancelled',
}

const AUDIT_EVENT_INFO = [
  // Application lifecycle
  { event: 'application_submitted', description: 'When a business owner submits a new permit application' },
  { event: 'application_rejected', description: 'When an LGU officer rejects an application' },
  { event: 'application_returned', description: 'When an application is returned to the business owner for revisions' },
  { event: 'review_completed', description: 'When an officer completes the review process for an application' },
  { event: 'decision_revoked', description: 'When an officer revokes a previous decision on an application' },

  // Claim management
  { event: 'application_claimed', description: 'When an LGU officer claims an application for review' },
  { event: 'application_released', description: 'When an LGU officer releases an application back to the pool' },
  { event: 'application_transferred', description: 'When an LGU officer transfers an application to another officer' },
  { event: 'claimed', description: 'When an LGU officer claims an application for review' },
  { event: 'released', description: 'When an LGU officer releases an application back to the pool' },

  // Appeals
  { event: 'appeal_submitted', description: 'When a business owner submits an appeal for a rejected application' },
  { event: 'appeal_resolved', description: 'When an LGU officer approves an appeal' },
  { event: 'appeal_rejected', description: 'When an LGU officer rejects an appeal' },

  // Edit requests
  { event: 'edit_request_submitted', description: 'When a business owner submits an edit request' },
  { event: 'edit_request_applied', description: 'When an LGU officer applies an edit request' },

  // Field review
  { event: 'field_reviewed', description: 'When an officer reviews and approves/rejects specific form fields' },
  { event: 'field_decisions_updated', description: 'When field review decisions are updated' },

  // Pending actions
  { event: 'pending_action_created', description: 'When a pending action is scheduled' },
  { event: 'pending_action_cancelled', description: 'When a pending action is cancelled' },
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
        
        {/* User/Officer Information */}
        {(metadata.officerName || metadata.claimedByName || metadata.releasedByName || metadata.reviewedByName || metadata.submittedByName || metadata.rejectedByName || metadata.returnedByName || metadata.inspectorName || metadata.registeredByName || metadata.updatedByName || metadata.deletedByName) && (
          <Descriptions.Item label="User">
            {metadata.officerName || metadata.claimedByName || metadata.releasedByName || metadata.reviewedByName || metadata.submittedByName || metadata.rejectedByName || metadata.returnedByName || metadata.inspectorName || metadata.registeredByName || metadata.updatedByName || metadata.deletedByName || 'Unknown'}
          </Descriptions.Item>
        )}
        
        {/* Entity Information */}
        {metadata.businessId && (
          <Descriptions.Item label="Business ID">
            <Text code>{metadata.businessId}</Text>
          </Descriptions.Item>
        )}
        
        {/* Status Information */}
        {metadata.applicationStatus && (
          <Descriptions.Item label="Application Status">
            <Tag color={STATUS_CONFIG[metadata.applicationStatus]?.color || 'default'}>
              {STATUS_CONFIG[metadata.applicationStatus]?.label || metadata.applicationStatus}
            </Tag>
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
        {metadata.appealStatus && (
          <Descriptions.Item label="Appeal Status">
            <Tag color={metadata.appealStatus === 'approved' ? 'green' : metadata.appealStatus === 'rejected' ? 'red' : 'default'}>
              {metadata.appealStatus}
            </Tag>
          </Descriptions.Item>
        )}
        
        {/* Field Review Information */}
        {metadata.fieldKey && (
          <Descriptions.Item label="Field Reviewed">
            <Text code>{metadata.fieldKey}</Text>
            <br />
            <Tag color={metadata.decision === 'approved' ? 'green' : 'red'}>
              {metadata.decision || 'reviewed'}
            </Tag>
          </Descriptions.Item>
        )}
        {metadata.decisionsCount && (
          <Descriptions.Item label="Decisions Made">
            {metadata.decisionsCount} field decision{metadata.decisionsCount > 1 ? 's' : ''}
          </Descriptions.Item>
        )}
        {metadata.decisions && Array.isArray(metadata.decisions) && (
          <Descriptions.Item label="Field Decisions">
            {metadata.decisions.map((decision, idx) => (
              <div key={idx} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: idx < metadata.decisions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div>
                  Field: {decision.fieldKey}
                </div>
                <div>
                  Status: {decision.status}
                </div>
                {decision.requestCode && (
                  <div>
                    Reason Code: {decision.requestCode}
                  </div>
                )}
                {decision.requestOther && (
                  <div>
                    Other Reason: {decision.requestOther}
                  </div>
                )}
                {decision.reasonCode && (
                  <div>
                    Reason Code: {decision.reasonCode}
                  </div>
                )}
                {decision.reasonOther && (
                  <div>
                    Other Reason: {decision.reasonOther}
                  </div>
                )}
              </div>
            ))}
          </Descriptions.Item>
        )}
        
        {/* Pending Action Information */}
        {metadata.actionType && (
          <Descriptions.Item label="Action Type">
            <Text code>{metadata.actionType}</Text>
          </Descriptions.Item>
        )}
        {metadata.scheduledAt && (
          <Descriptions.Item label="Scheduled For">
            {new Date(metadata.scheduledAt).toLocaleString()}
          </Descriptions.Item>
        )}
        
        {/* Permit Information */}
        {metadata.permitId && (
          <Descriptions.Item label="Permit ID">
            <Text code>{metadata.permitId}</Text>
          </Descriptions.Item>
        )}
        {metadata.permitType && (
          <Descriptions.Item label="Permit Type">{metadata.permitType}</Descriptions.Item>
        )}
        
        {/* Inspection Information */}
        {metadata.inspectionId && (
          <Descriptions.Item label="Inspection ID">
            <Text code>{metadata.inspectionId}</Text>
          </Descriptions.Item>
        )}
        {metadata.violationType && (
          <Descriptions.Item label="Violation Type">{metadata.violationType}</Descriptions.Item>
        )}
        
        {/* Override Information */}
        {metadata.override && (
          <Descriptions.Item label="Override">
            Overrode claim by {metadata.override.fromName || metadata.override.from}
          </Descriptions.Item>
        )}
        
        {/* Additional metadata */}
        {metadata.reason && (
          <Descriptions.Item label="Reason">{metadata.reason}</Descriptions.Item>
        )}
        {metadata.comments && (
          <Descriptions.Item label="Comments">{metadata.comments}</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  )
}
