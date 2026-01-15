import { Drawer, Descriptions, Tag, Typography, Alert } from 'antd'

const { Text } = Typography

export default function RecoveryRequestDetail({ request, onClose }) {
  return (
    <Drawer
      title="Recovery Request Details"
      width={420}
      open={!!request}
      onClose={onClose}
      destroyOnClose
    >
      {!request ? null : (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="User">{request.userName}</Descriptions.Item>
            <Descriptions.Item label="Email">{request.userEmail}</Descriptions.Item>
            <Descriptions.Item label="Office">{request.office || '-'}</Descriptions.Item>
            <Descriptions.Item label="Role">{request.role || '-'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={request.status === 'approved' ? 'green' : request.status === 'pending' ? 'gold' : 'red'}>
                {request.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Requested At">{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="Reviewed At">{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="Review Notes">{request.reviewNotes || '-'}</Descriptions.Item>
            <Descriptions.Item label="Denial Reason">{request.denialReason || '-'}</Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 12 }}>
            <Text strong>Metadata</Text>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="IP">{request.metadata?.ip || request.metadata?.ipAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="User Agent">{request.metadata?.userAgent || '-'}</Descriptions.Item>
              <Descriptions.Item label="Outside Office Hours">{request.metadata?.requestedOutsideOfficeHours ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Suspicious Activity">{request.metadata?.suspiciousActivityDetected ? 'Yes' : 'No'}</Descriptions.Item>
            </Descriptions>
          </div>

          {request.metadata?.suspiciousActivityDetected && (
            <Alert
              showIcon
              type="warning"
              style={{ marginTop: 12 }}
              message="Suspicious activity detected"
              description="Please verify the staff member's identity before issuing credentials."
            />
          )}
        </>
      )}
    </Drawer>
  )
}
