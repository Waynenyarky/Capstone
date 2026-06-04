import { Typography, Row, Col, Button, Tooltip, ColorPicker, Grid, Space } from 'antd'
import { theme } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

export default function ThemeTabContent({
  themeOptions,
  presetColors,
  pendingTheme,
  hoveredTheme,
  currentPrimaryColor,
  onSelectTheme,
  onMouseEnterTheme,
  onMouseLeaveTheme,
  onApplyTheme,
  onColorChange,
  onColorMouseEnter,
  onColorMouseLeave,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const padding = screens.xs ? 16 : 24

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ marginBottom: 4, textAlign: 'center' }}>Theme</Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Personalize your application appearance. Choose a base theme and primary color, then apply changes.
            </Paragraph>
          </div>
          <Space wrap>
            <Button type="primary" onClick={onApplyTheme}>
              Apply Changes
            </Button>
          </Space>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding,
        }}
      >
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Choose Theme</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Select a base theme that defines the overall look and feel of your application
          </Text>
        </div>
        <Row gutter={[16, 20]}>
          {themeOptions.map((option) => {
            const isSelected = pendingTheme === option.key
            const isHovered = hoveredTheme === option.key
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={option.key}>
                <Tooltip title={option.label}>
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
                      cursor: 'pointer',
                      position: 'relative',
                      borderRadius: token.borderRadiusLG,
                      overflow: 'hidden',
                      border: isSelected
                        ? `2px solid ${option.active}`
                        : (isHovered ? `2px solid ${option.active}80` : `1px solid ${token.colorBorderSecondary}`),
                      boxShadow: isSelected
                        ? `0 4px 12px ${option.active}25`
                        : (isHovered ? `0 4px 8px ${token.colorBorderSecondary}40` : '0 2px 4px rgba(0,0,0,0.04)'),
                      transform: isHovered ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: token.colorBgContainer,
                    }}
                  >
                    <div
                      style={{
                        height: 20,
                        background: option.header,
                        borderBottom: `1px solid ${option.border}`,
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: option.active,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', height: 60 }}>
                      <div
                        style={{
                          width: '25%',
                          background: option.side,
                          borderRight: `1px solid ${option.border}`,
                        }}
                      />
                      <div
                        style={{
                          width: '75%',
                          background: option.content,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <CheckCircleFilled
                            style={{
                              color: option.active,
                              fontSize: 18,
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Tooltip>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <Text
                    strong={isSelected}
                    style={{
                      fontSize: 13,
                      color: isSelected ? option.active : token.colorText,
                      transition: 'all 0.2s',
                    }}
                  >
                    {option.label}
                  </Text>
                </div>
              </Col>
            )
          })}
        </Row>
      </div>

      <div
        style={{
          paddingTop: 32,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Primary Color</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Customize the primary accent color used throughout the application
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: screens.xs ? 'column' : 'row',
            gap: screens.xs ? 20 : 24,
            alignItems: screens.xs ? 'stretch' : 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: screens.xs ? '100%' : 300 }}>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              Preset Colors
            </Text>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                padding: 16,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              {presetColors.map((color) => {
                const isSelected = currentPrimaryColor === color
                return (
                  <Tooltip key={color} title={color}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onColorChange(color)}
                      onMouseEnter={() => onColorMouseEnter(color)}
                      onMouseLeave={onColorMouseLeave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onColorChange(color)
                        }
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: token.borderRadius,
                        background: color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected
                          ? `0 0 0 3px ${token.colorBgContainer}, 0 0 0 5px ${color}`
                          : '0 2px 4px rgba(0,0,0,0.1)',
                        border: `2px solid ${token.colorBgContainer}`,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <CheckCircleFilled
                          style={{
                            color: '#fff',
                            fontSize: 18,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                          }}
                        />
                      )}
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: screens.xs ? '100%' : 200,
              padding: screens.xs ? 0 : '0 0 0 24px',
              borderLeft: screens.xs ? 'none' : `1px solid ${token.colorBorderSecondary}`,
              paddingLeft: screens.xs ? 0 : 24,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              Custom Color
            </Text>
            <div
              style={{
                padding: 16,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ColorPicker
                value={currentPrimaryColor}
                onChange={onColorChange}
                showText
                disabledAlpha
                trigger="click"
                format="hex"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
