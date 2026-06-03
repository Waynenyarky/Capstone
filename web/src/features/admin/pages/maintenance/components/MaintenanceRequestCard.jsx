import { Typography, Tag, Card, Col } from 'antd'
import dayjs from 'dayjs'
import { getDisplayStatus, getDisplayTagColor, requestedByDisplay, getRequestExpiryText } from '../utils/maintenance.utils.js'

const { Text } = Typography

export default function MaintenanceRequestCard({ approval, selectedId, onSelect, token }) {
  const isSelected = approval?.approvalId === selectedId

  return (
    <Col span={24}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect?.(approval)}
        title={approval.requestDetails?.reason || 'No reason provided'}
        extra={<Tag color={getDisplayTagColor(approval)} style={{ textTransform: 'capitalize' }}>{getDisplayStatus(approval)}</Tag>}
        style={{
          cursor: 'pointer',
          border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
        }}
      >
        {approval.requestDetails?.message && approval.requestDetails?.message !== approval.requestDetails?.reason && (
          <Text style={{ fontSize: 13 }}>
            {approval.requestDetails.message}
          </Text>
        )}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {approval.requestDetails?.scheduledStartAt ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Starts {dayjs(approval.requestDetails.scheduledStartAt).format('MMM D, YYYY HH:mm')}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Starts immediately after approval
            </Text>
          )}
          {approval.requestDetails?.expectedResumeAt && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Resumes {dayjs(approval.requestDetails.expectedResumeAt).format('MMM D, YYYY HH:mm')}
            </Text>
          )}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Requested by {requestedByDisplay(approval.requestedBy)}
          </Text>
          {getRequestExpiryText(approval) && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
              {getRequestExpiryText(approval)}
            </Text>
          )}
        </div>
      </Card>
    </Col>
  )
}
