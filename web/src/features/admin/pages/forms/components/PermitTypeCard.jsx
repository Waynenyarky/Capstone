import { Card, Typography, Tag, Col } from 'antd'

const { Text } = Typography

export default function PermitTypeCard({ item, selectedId, token, onSelect }) {
  const isSelected = selectedId === item.cardId

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <Col span={24} key={item.cardId}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect(item)}
        title={item.title}
        style={{
          cursor: 'pointer',
          border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
        }}
      >
        <div
          style={{
            fontSize: 13,
            lineHeight: '1.3em',
            maxHeight: '2.6em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: token.colorTextSecondary,
          }}
        >
          {item.description}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color={item.isActive !== false ? 'green' : 'default'} style={{ margin: 0, fontSize: 11 }}>
            {item.isActive !== false ? 'Active' : 'Disabled'}
          </Tag>
          <Tag style={{ margin: 0, fontSize: 11 }}>
            Updated on {formatRelativeTime(item.lastUpdatedAt)}
          </Tag>
        </div>
      </Card>
    </Col>
  )
}
