import { Card, Typography, Tag, Space, theme } from 'antd'
import dayjs from 'dayjs'
import { CMS_AUDIT_FIELD_LABELS } from '../constants/cmsAudit.constants'

const { Text, Paragraph } = Typography

function userName(user) {
  if (!user) return '—'
  if (typeof user === 'object') {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return name || user.email || user._id || '—'
  }
  return '—'
}

export default function CmsAuditCard({ audit, selected, onSelect, token: tokenProp }) {
  const { token } = theme.useToken()
  const t = tokenProp ?? token
  const user = audit.userId
  const changedFields = audit.metadata?.changedFields || []
  const fieldLabels = changedFields.map((f) => CMS_AUDIT_FIELD_LABELS[f] || f).join(', ')

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
            {dayjs(audit.createdAt).format('MMM D, YYYY HH:mm')}
          </Text>
          <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
            {audit.eventType === 'faq_updated' ? 'FAQ Updated' : 'Instruction Updated'}
          </Tag>
        </div>
        <Text strong style={{ fontSize: 13 }}>
          {userName(user)}
        </Text>
        {fieldLabels && (
          <Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ fontSize: 12, marginBottom: 0 }}>
            Changed: {fieldLabels}
          </Paragraph>
        )}
      </Space>
    </Card>
  )
}
