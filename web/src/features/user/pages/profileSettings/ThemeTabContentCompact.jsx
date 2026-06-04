import { Typography, Card, Row, Col, Button, ColorPicker } from 'antd'
import { theme } from 'antd'

const { Text } = Typography

export default function ThemeTabContentCompact({
  themeOptions,
  presetColors,
  pendingTheme,
  currentPrimaryColor,
  onSelectTheme,
  onMouseEnterTheme,
  onMouseLeaveTheme,
  onApplyTheme,
  onColorChange,
}) {
  const { token } = theme.useToken()

  return (
    <Card size="small" styles={{ body: { padding: 24 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>Choose a theme and primary color, then apply.</Text>
        <Button type="primary" onClick={onApplyTheme}>Apply Changes</Button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Base theme</Text>
        <Row gutter={[12, 12]}>
          {themeOptions.map((option) => (
            <Col xs={12} sm={8} md={6} key={option.key}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectTheme(option.key)}
                onMouseEnter={() => onMouseEnterTheme(option.key)}
                onMouseLeave={onMouseLeaveTheme}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectTheme(option.key)
                  }
                }}
                style={{
                  padding: 12,
                  borderRadius: token.borderRadius,
                  border: pendingTheme === option.key ? `2px solid ${option.active}` : `1px solid ${token.colorBorder}`,
                  cursor: 'pointer',
                  background: token.colorFillAlter,
                }}
              >
                <Text strong={pendingTheme === option.key} style={{ fontSize: 13 }}>{option.label}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>
      <div>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Primary color</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {presetColors.slice(0, 10).map((color) => (
            <div
              key={color}
              role="button"
              tabIndex={0}
              onClick={() => onColorChange(color)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onColorChange(color)
                }
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: token.borderRadius,
                background: color,
                cursor: 'pointer',
                border: currentPrimaryColor === color ? `2px solid ${token.colorText}` : '2px solid transparent',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
              title={color}
            />
          ))}
          <ColorPicker
            value={currentPrimaryColor}
            onChange={onColorChange}
            showText
            disabledAlpha
            size="small"
            format="hex"
          />
        </div>
      </div>
    </Card>
  )
}
