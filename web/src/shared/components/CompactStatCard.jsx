import { Card, Typography, theme } from 'antd'

const { Text } = Typography

export default function CompactStatCard({
  icon: Icon,
  value,
  label,
  onClick,
}) {
  const { token } = theme.useToken()

  return (
    <Card
      size="small"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        cursor: onClick ? 'pointer' : 'default',
      }}
      bodyStyle={{ padding: 16, paddingTop: 96 }}
      onClick={onClick}
    >
      {/* Icon */}
      {Icon && (
        <div style={{ marginBottom: 12 }}>
          <Icon style={{ fontSize: 24, color: token.colorTextSecondary }} />
        </div>
      )}

      {/* Value */}
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ fontSize: 20, color: token.colorText }}>
          {value}
        </Text>
      </div>

      {/* Label */}
      <div>
        <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
          {label}
        </Text>
      </div>
    </Card>
  )
}
