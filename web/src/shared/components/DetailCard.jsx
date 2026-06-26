import { Card, Typography, Grid, theme } from 'antd'
import { useState } from 'react'

const { Text } = Typography

export default function DetailCard({
  icon: Icon,
  title,
  description,
  details = [],
  children,
  onClick,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const [hovered, setHovered] = useState(false)

  return (
    <Card
      size="small"
      style={{
        border: hovered ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        cursor: onClick ? 'pointer' : 'default',
        transition: screens.lg ? 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' : 'none',
        boxShadow: screens.lg && hovered ? token.boxShadowCard : 'none',
        transform: screens.lg && hovered ? 'scale(1.02)' : 'scale(1)',
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Left Panel - Icon and Title */}
      <div style={{ flex: screens.md ? '0 0 40%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: screens.md ? '96px 24px 24px' : '96px 24px' }}>
        {Icon && (
          <Icon style={{ fontSize: 24, color: token.colorTextSecondary, marginBottom: 8 }} />
        )}
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        {description && (
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            {description}
          </Text>
        )}
      </div>

      {/* Right Panel - Details Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorderSecondary}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {details.map((detail, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1 }}>
              <div style={{ marginBottom: -6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Text strong style={{ fontSize: 20, color: token.colorText }}>
                  {detail.value}
                </Text>
                {detail.trend && (
                  <Text style={{ fontSize: 12, color: detail.trendColor || (detail.trend.startsWith('+') ? token.colorSuccess : token.colorError) }}>
                    {detail.trend}
                  </Text>
                )}
              </div>
              <div>
                <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
                  {detail.label}
                </Text>
              </div>
            </div>
          ))}
        </div>
        {children}
      </div>
    </Card>
  )
}
