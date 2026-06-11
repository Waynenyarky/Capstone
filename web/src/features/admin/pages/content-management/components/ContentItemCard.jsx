import { Typography, Card, Col } from 'antd'

const { Paragraph, Text } = Typography

export default function ContentItemCard({ item, selectedId, onSelect, token, contentType }) {
  const isSelected = selectedId && (selectedId === item._id || selectedId === item.slotId)
  const content = item.body || item.description || item.subtitle || ''
  const isFaqSection = contentType === 'faqs'
  const isChapter = ['privacy-policy', 'terms-of-service', 'bizclear-manual'].includes(contentType)

  return (
    <Col span={24}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect?.(item)}
        title={isFaqSection ? item.slotId : (item.title || item.slotId)}
        style={{
          cursor: 'pointer',
          border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
        }}
      >
        {isChapter ? (
          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 0 }}>
            {item.description || 'No description'}
          </Paragraph>
        ) : content ? (
          <Paragraph type="secondary" ellipsis={{ rows: 4 }} style={{ fontSize: 12, marginBottom: 0 }}>
            {content}
          </Paragraph>
        ) : (
          <Text type="secondary" italic style={{ fontSize: 12 }}>
            No content yet
          </Text>
        )}
      </Card>
    </Col>
  )
}
