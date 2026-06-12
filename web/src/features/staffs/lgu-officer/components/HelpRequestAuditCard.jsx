import { Card, Typography, Tag, Space, theme } from 'antd'

const { Text } = Typography

const EVENT_TYPE_LABELS = {
  claim: 'Claimed',
  release: 'Released',
  status_update: 'Status Changed',
  priority_update: 'Priority Changed',
}

export default function HelpRequestAuditCard({ audit, selected, onSelect, token: tokenProp }) {
  const { token } = theme.useToken()
  const t = tokenProp ?? token

  return (
    <Card
      size="small"
      hoverable
      onClick={() => onSelect?.(audit)}
      style={{
        cursor: 'pointer',
        border: selected ? `1px solid ${t.colorPrimary}` : undefined,
        background: selected ? t.colorBgLayout : undefined,
      }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(audit.timestamp).toLocaleString()}
          </Text>
          <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
            {EVENT_TYPE_LABELS[audit.eventType] || audit.eventType}
          </Tag>
        </div>
        <Text strong style={{ fontSize: 13 }}>
          {audit.userId}
        </Text>
      </Space>
    </Card>
  )
}
