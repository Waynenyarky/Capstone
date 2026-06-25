import { Card, Tag, Typography, theme } from 'antd'
import { StarFilled } from '@ant-design/icons'

const { Text } = Typography

export default function PanelCard({
  item: _item,
  selected = false,
  onClick,
  title,
  description,
  metaInfo = [],
  tags = [],
  isBookmarked = false,
}) {
  const { token } = theme.useToken()

  return (
    <Card
      size="small"
      onClick={onClick}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          {isBookmarked && <StarFilled style={{ color: '#faad14' }} />}
        </div>
      }
      style={{
        cursor: 'pointer',
        background: token.colorBgContainer,
        boxShadow: selected ? `0 0 0 2px ${token.colorPrimaryBg}20, 0 2px 8px ${token.colorPrimary}15` : undefined,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = token.colorPrimaryBorder
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
      }}
    >
      {description && (
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
            marginBottom: 12,
            color: token.colorTextSecondary,
          }}
        >
          {description}
        </div>
      )}
      {metaInfo.length > 0 && (
        <div style={{ marginTop: description ? 12 : 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {metaInfo.map((meta, idx) => (
            <Text key={idx} type="secondary" style={{ fontSize: 12 }}>
              {meta.label}: {meta.value}
            </Text>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ marginTop: (description || metaInfo.length > 0) ? 12 : 0, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tags.map((tag, idx) => (
            <Tag key={idx} color={tag.color} style={{ margin: 0, fontSize: 11, textTransform: 'capitalize' }}>
              {tag.label}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  )
}
