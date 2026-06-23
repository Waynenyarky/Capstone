import { Button, Typography, Space, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

export default function StackedCountersCard({ counters = [] }) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <Space.Compact direction="vertical" style={{ width: '100%' }}>
      {counters.map((counter, index) => (
        <Button
          key={counter.key}
          type="default"
          size="small"
          onClick={() => {
            if (counter.onClick) {
              counter.onClick()
            } else if (counter.viewAllTo) {
              navigate(counter.viewAllTo)
            }
          }}
          style={{
            textAlign: 'left',
            height: 'auto',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            justifyContent: 'flex-start',
            borderRadius: index === 0 ? `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0` : index === counters.length - 1 ? `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px` : '0',
          }}
        >
          {/* Icon */}
          {counter.icon && (
            <div style={{ flexShrink: 0 }}>
              <counter.icon style={{ fontSize: 24, color: token.colorText }} />
            </div>
          )}

          {/* Counter with description */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1 }}>
            <div style={{ marginBottom: -6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <Text strong style={{ fontSize: 20, color: token.colorText }}>
                {counter.value}
              </Text>
              {counter.trend && (
                <Text style={{ fontSize: 12, color: counter.trendColor || (counter.trend.startsWith('+') ? token.colorSuccess : token.colorError) }}>
                  {counter.trend}
                </Text>
              )}
            </div>
            <div>
              <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
                {counter.label}
              </Text>
            </div>
          </div>
        </Button>
      ))}
    </Space.Compact>
  )
}
