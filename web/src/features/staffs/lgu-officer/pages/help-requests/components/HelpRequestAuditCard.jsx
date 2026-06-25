import { Card, Typography, Space, theme } from 'antd'

const { Text } = Typography

export default function HelpRequestAuditCard({ audit, selected, onSelect, token: tokenProp }) {
  const { token } = theme.useToken()
  const t = tokenProp ?? token

  // Get officer name from metadata based on event type
  const getOfficerName = () => {
    const metadata = audit.metadata || {}
    if (audit.eventType === 'claim') {
      return `Claimed by ${metadata.claimedByName || 'Unknown'}`
    }
    if (audit.eventType === 'release') {
      return `Released by ${metadata.releasedByName || 'Unknown'}`
    }
    if (audit.eventType === 'status_update') {
      return `Changed by ${metadata.updatedByName || 'Unknown'}`
    }
    if (audit.eventType === 'priority_update') {
      return `Changed by ${metadata.updatedByName || 'Unknown'}`
    }
    return 'Unknown'
  }

  // Get event type label
  const getEventTypeLabel = () => {
    if (audit.eventType === 'claim') return 'Claimed'
    if (audit.eventType === 'release') return 'Released'
    if (audit.eventType === 'status_update') return 'Status Changed'
    if (audit.eventType === 'priority_update') return 'Priority Changed'
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
