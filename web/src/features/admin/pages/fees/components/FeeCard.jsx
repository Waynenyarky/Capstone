import { Card, Typography, Tag, Col } from 'antd'

const { Text } = Typography

export default function FeeCard({ item, selectedId, onSelect, token, selectedType }) {
  const isSelected = selectedId === item._id

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <Col span={24} key={item._id}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect(item)}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.name}</span>
            {selectedType === 'fee_groups' ? (
              <span style={{ fontWeight: 'normal', fontSize: 14 }}>₱{item.fees?.reduce((sum, fee) => sum + (fee.amount || 0), 0).toFixed(2)}</span>
            ) : (
              <span style={{ fontWeight: 'normal', fontSize: 14 }}>₱{item.amount}</span>
            )}
          </div>
        }
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
          <Tag color={item.isActive ? 'green' : 'default'} style={{ margin: 0, fontSize: 11 }}>
            {item.isActive ? 'Active' : 'Disabled'}
          </Tag>
          <Tag style={{ margin: 0, fontSize: 11 }}>
            Updated on {formatRelativeTime(item.effectiveDate)}
          </Tag>
        </div>
      </Card>
    </Col>
  )
}
