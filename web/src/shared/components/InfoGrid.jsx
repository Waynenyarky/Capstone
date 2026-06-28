import { Typography, Card, Grid, Divider } from 'antd'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function InfoGrid({ items = [], style, cardStyle, size = '' }) {
  const screens = useBreakpoint()
  const isLg = screens.lg

  return (
    <Card size={size} style={{ margin: 16, ...cardStyle }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, ...style }}>
        {items.map((item, index) => {
          if (item.type === 'divider') {
            return <Divider key={index} style={{ width: '100%', margin: '8px 0' }} />
          }
          return (
            <div key={index} style={{ minWidth: '200px', flex: isLg ? '1 1 0' : '1 1 200px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
              <div style={typeof item.value === 'string' || typeof item.value === 'number' ? { wordBreak: 'break-word' } : {}}>
                {item.value !== undefined && item.value !== null ? (
                  typeof item.value === 'string' || typeof item.value === 'number' ? (
                    <Text strong>{item.value}</Text>
                  ) : (
                    item.value
                  )
                ) : (
                  <Text strong>N/A</Text>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
